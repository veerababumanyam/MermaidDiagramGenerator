/**
 * Enterprise Export Service
 * High-quality, reliable export functionality for Mermaid diagrams
 */

import type {
  ExportOptions,
  ExportResult,
  ExportProgress,
  ExportError,
  ExportProgressCallback,
  BatchExportOptions,
  BatchExportResult,
  ExportDimensions,
  ExportQuality,
  PdfOptions
} from '../types/export';

import {
  DEFAULT_EXPORT_QUALITY,
  DEFAULT_EXPORT_BACKGROUND,
  DEFAULT_PDF_OPTIONS,
  PAPER_SIZES
} from '../types/export';

class ExportService {
  private progressCallbacks: Set<ExportProgressCallback> = new Set();
  private abortController: AbortController | null = null;

  /**
   * Register progress callback
   */
  onProgress(callback: ExportProgressCallback): () => void {
    this.progressCallbacks.add(callback);
    return () => this.progressCallbacks.delete(callback);
  }

  /**
   * Emit progress update to all registered callbacks
   */
  private emitProgress(progress: ExportProgress): void {
    this.progressCallbacks.forEach(callback => {
      try {
        callback(progress);
      } catch (error) {
        console.error('Error in progress callback:', error);
      }
    });
  }

  /**
   * Abort current export operation
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Main export function
   */
  async exportDiagram(
    svgContent: string,
    options: Partial<ExportOptions>
  ): Promise<ExportResult> {
    const startTime = performance.now();
    this.abortController = new AbortController();

    try {
      // Merge with defaults
      const exportOptions = this.mergeWithDefaults(options);
      
      this.emitProgress({
        stage: 'preparing',
        progress: 0,
        message: 'Preparing export...',
        timeElapsed: 0
      });

      // Validate inputs
      await this.validateInputs(svgContent, exportOptions);

      this.emitProgress({
        stage: 'rendering',
        progress: 20,
        message: 'Processing SVG...',
        timeElapsed: performance.now() - startTime
      });

      // Process SVG
      const processedSvg = await this.processSvg(svgContent, exportOptions);
      
      this.emitProgress({
        stage: 'processing',
        progress: 50,
        message: `Generating ${exportOptions.format.toUpperCase()}...`,
        timeElapsed: performance.now() - startTime
      });

      let result: ExportResult;

      // Export based on format
      switch (exportOptions.format) {
        case 'svg':
          result = await this.exportSvg(processedSvg, exportOptions);
          break;
        case 'png':
        case 'jpg':
        case 'webp':
          result = await this.exportRaster(processedSvg, exportOptions);
          break;
        case 'pdf':
          result = await this.exportPdf(processedSvg, exportOptions);
          break;
        default:
          throw new Error(`Unsupported format: ${exportOptions.format}`);
      }

      this.emitProgress({
        stage: 'finalizing',
        progress: 90,
        message: 'Finalizing export...',
        timeElapsed: performance.now() - startTime
      });

      // Add metadata
      result.processingTime = performance.now() - startTime;
      result.metadata = {
        ...exportOptions.metadata,
        creationDate: new Date(),
        creator: 'Mermaid Diagram Generator',
        producer: 'Enterprise Export Service v1.0'
      };

      this.emitProgress({
        stage: 'complete',
        progress: 100,
        message: 'Export completed successfully',
        timeElapsed: result.processingTime
      });

      return result;

    } catch (error) {
      const exportError: ExportError = {
        code: 'EXPORT_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error,
        recoverable: this.isRecoverableError(error),
        suggestions: this.getErrorSuggestions(error)
      };

      this.emitProgress({
        stage: 'error',
        progress: 0,
        message: exportError.message,
        timeElapsed: performance.now() - startTime
      });

      return {
        success: false,
        filename: options.filename || 'diagram',
        fileSize: 0,
        dimensions: { width: 0, height: 0 },
        format: options.format || 'svg',
        metadata: {},
        processingTime: performance.now() - startTime,
        error: exportError
      };
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Batch export multiple formats
   */
  async batchExport(
    svgContent: string,
    batchOptions: BatchExportOptions
  ): Promise<BatchExportResult> {
    const startTime = performance.now();
    const results: ExportResult[] = [];
    const errors: ExportError[] = [];

    for (let i = 0; i < batchOptions.formats.length; i++) {
      const format = batchOptions.formats[i];
      const filename = `${batchOptions.baseFilename}.${format}`;

      try {
        const result = await this.exportDiagram(svgContent, {
          ...batchOptions.options,
          format,
          filename
        });

        results.push(result);
        if (!result.success && result.error) {
          errors.push(result.error);
        }
      } catch (error) {
        errors.push({
          code: 'BATCH_EXPORT_FAILED',
          message: `Failed to export ${format}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error,
          recoverable: false,
          suggestions: ['Try exporting formats individually']
        });
      }
    }

    let zipBlob: Blob | undefined;
    if (batchOptions.zipResults && results.length > 1) {
      zipBlob = await this.createZipArchive(results);
    }

    const totalSize = results.reduce((sum, result) => sum + result.fileSize, 0);

    return {
      success: errors.length === 0,
      results,
      zipBlob,
      totalSize,
      processingTime: performance.now() - startTime,
      errors
    };
  }

  /**
   * Merge options with defaults
   */
  private mergeWithDefaults(options: Partial<ExportOptions>): ExportOptions {
    return {
      format: options.format || 'svg',
      filename: options.filename || 'diagram',
      quality: { ...DEFAULT_EXPORT_QUALITY, ...options.quality },
      background: { ...DEFAULT_EXPORT_BACKGROUND, ...options.background },
      dimensions: options.dimensions,
      metadata: options.metadata || {},
      pdfOptions: { ...DEFAULT_PDF_OPTIONS, ...options.pdfOptions },
      includeWatermark: options.includeWatermark || false,
      embedSvgFonts: options.embedSvgFonts || true,
      optimizeSvg: options.optimizeSvg || true
    };
  }

  /**
   * Validate export inputs
   */
  private async validateInputs(svgContent: string, options: ExportOptions): Promise<void> {
    if (!svgContent?.trim()) {
      throw new Error('SVG content is required');
    }

    if (!options.filename?.trim()) {
      throw new Error('Filename is required');
    }

    // Validate SVG content
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgContent, 'image/svg+xml');
      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        throw new Error('Invalid SVG content');
      }
    } catch (error) {
      throw new Error('Failed to parse SVG content');
    }

    // Validate dimensions
    if (options.dimensions) {
      if (options.dimensions.width <= 0 || options.dimensions.height <= 0) {
        throw new Error('Invalid dimensions: width and height must be positive');
      }
      if (options.dimensions.width > 32767 || options.dimensions.height > 32767) {
        throw new Error('Dimensions too large: maximum size is 32767px');
      }
    }

    // Validate quality settings
    if (options.quality.dpi < 72 || options.quality.dpi > 2400) {
      throw new Error('DPI must be between 72 and 2400');
    }

    if (options.quality.scale < 0.1 || options.quality.scale > 10) {
      throw new Error('Scale must be between 0.1 and 10');
    }
  }

  /**
   * Process and optimize SVG content
   */
  private async processSvg(svgContent: string, options: ExportOptions): Promise<SVGSVGElement> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
    const svgElement = doc.documentElement as unknown as SVGSVGElement;

    // Clone to avoid modifying original
    const processedSvg = svgElement.cloneNode(true) as SVGSVGElement;

    // Embed fonts if requested
    if (options.embedSvgFonts) {
      await this.embedFonts(processedSvg);
    }

    // Inline styles for better compatibility
    this.inlineStyles(processedSvg);

    // Set proper dimensions
    this.setDimensions(processedSvg, options);

    // Optimize if requested
    if (options.optimizeSvg) {
      this.optimizeSvg(processedSvg);
    }

    return processedSvg;
  }

  /**
   * Export as SVG
   */
  private async exportSvg(svgElement: SVGSVGElement, options: ExportOptions): Promise<ExportResult> {
    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svgElement);

    // Add XML declaration if missing
    if (!svgString.startsWith('<?xml')) {
      svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgString;
    }

    // Add metadata comments
    if (options.metadata) {
      const metadataComments = this.generateMetadataComments(options.metadata);
      svgString = svgString.replace('<svg', metadataComments + '\n<svg');
    }

    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const dimensions = this.getDimensions(svgElement);

    return {
      success: true,
      blob,
      dataUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`,
      filename: options.filename,
      fileSize: blob.size,
      dimensions,
      format: 'svg',
      metadata: options.metadata || {},
      processingTime: 0
    };
  }

  /**
   * Export as raster image (PNG, JPG, WebP)
   */
  private async exportRaster(svgElement: SVGSVGElement, options: ExportOptions): Promise<ExportResult> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      const dimensions = this.getDimensions(svgElement);
      const scaledWidth = dimensions.width * options.quality.scale;
      const scaledHeight = dimensions.height * options.quality.scale;

      // Set canvas size with high DPI support
      canvas.width = scaledWidth;
      canvas.height = scaledHeight;
      canvas.style.width = `${dimensions.width}px`;
      canvas.style.height = `${dimensions.height}px`;

      // Scale context for high DPI
      ctx.scale(options.quality.scale, options.quality.scale);

      // Enable antialiasing if requested
      if (options.quality.antialiasing) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
      }

      // Draw background
      this.drawBackground(ctx, dimensions, options);

      // Convert SVG to a safer data URL format to avoid CORS issues
      const svgString = new XMLSerializer().serializeToString(svgElement);
      
      // Clean SVG string to avoid potential CORS issues
      const cleanSvgString = svgString
        .replace(/xmlns:xlink="[^"]*"/g, '')
        .replace(/xlink:href=/g, 'href=');

      // Create data URL directly to avoid blob URL CORS issues
      const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(cleanSvgString);

      const img = new Image();
      
      // Set crossOrigin to anonymous to avoid tainted canvas
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);
          
          // Get the appropriate MIME type and quality
          const mimeType = this.getMimeType(options.format);
          const quality = options.quality.compression || 0.95;
          
          // Use timeout to handle potential toBlob failures
          const toBlob = () => {
            try {
              canvas.toBlob(
                (blob) => {
                  if (!blob) {
                    reject(new Error('Failed to create image blob'));
                    return;
                  }

                  const dataUrl = canvas.toDataURL(mimeType, quality);
                  
                  resolve({
                    success: true,
                    blob,
                    dataUrl,
                    filename: options.filename,
                    fileSize: blob.size,
                    dimensions: { width: scaledWidth, height: scaledHeight },
                    format: options.format,
                    metadata: options.metadata || {},
                    processingTime: 0
                  });
                },
                mimeType,
                quality
              );
            } catch (error) {
              reject(new Error('Canvas tainted - cannot export. Try exporting as SVG instead.'));
            }
          };

          // Execute with small delay to allow canvas to fully render
          setTimeout(toBlob, 10);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load SVG image'));
      };

      img.src = svgDataUrl;
    });
  }

  /**
   * Export as PDF
   */
  private async exportPdf(svgElement: SVGSVGElement, options: ExportOptions): Promise<ExportResult> {
    // Dynamic import of jsPDF
    const { jsPDF } = await this.loadJsPDF();
    
    const dimensions = this.getDimensions(svgElement);
    const pdfOptions = options.pdfOptions!;

    // Determine orientation
    let orientation: 'portrait' | 'landscape';
    if (pdfOptions.orientation === 'auto') {
      orientation = dimensions.width > dimensions.height ? 'landscape' : 'portrait';
    } else {
      orientation = pdfOptions.orientation as 'portrait' | 'landscape';
    }

    // Get paper size
    let pageSize: [number, number];
    if (pdfOptions.paperSize === 'custom' && pdfOptions.customSize) {
      pageSize = [pdfOptions.customSize.width, pdfOptions.customSize.height];
    } else {
      const size = PAPER_SIZES[pdfOptions.paperSize];
      pageSize = [size.width, size.height];
    }

    // Create PDF document
    const pdf = new jsPDF({
      orientation,
      unit: 'pt',
      format: pageSize,
      compress: pdfOptions.compress
    });

    // Add metadata
    if (options.metadata) {
      pdf.setProperties({
        title: options.metadata.title || options.filename,
        subject: options.metadata.subject || 'Mermaid Diagram',
        author: options.metadata.author || 'Unknown',
        keywords: options.metadata.keywords?.join(', ') || '',
        creator: options.metadata.creator || 'Mermaid Diagram Generator'
      });
    }

    // Calculate positioning
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - pdfOptions.margins.left - pdfOptions.margins.right;
    const contentHeight = pageHeight - pdfOptions.margins.top - pdfOptions.margins.bottom;

    // Scale to fit if necessary
    const scaleX = contentWidth / dimensions.width;
    const scaleY = contentHeight / dimensions.height;
    const scale = Math.min(scaleX, scaleY, 1); // Don't upscale

    const scaledWidth = dimensions.width * scale;
    const scaledHeight = dimensions.height * scale;

    // Center the diagram
    const x = pdfOptions.margins.left + (contentWidth - scaledWidth) / 2;
    const y = pdfOptions.margins.top + (contentHeight - scaledHeight) / 2;

    try {
      // Add SVG to PDF
      await pdf.svg(svgElement, {
        x,
        y,
        width: scaledWidth,
        height: scaledHeight
      });

      const pdfBlob = pdf.output('blob');

      return {
        success: true,
        blob: pdfBlob,
        dataUrl: pdf.output('datauristring'),
        filename: options.filename,
        fileSize: pdfBlob.size,
        dimensions: { width: scaledWidth, height: scaledHeight },
        format: 'pdf',
        metadata: options.metadata || {},
        processingTime: 0
      };
    } catch (error) {
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Helper methods
   */
  private async embedFonts(svgElement: SVGSVGElement): Promise<void> {
    // Font embedding implementation would go here
    // This is a complex feature that would require additional libraries
    // For now, we'll inline the computed font styles
    this.inlineStyles(svgElement);
  }

  private inlineStyles(svgElement: SVGSVGElement): void {
    const elements = svgElement.querySelectorAll('*');
    elements.forEach(element => {
      if (element instanceof SVGElement || element instanceof HTMLElement) {
        const computedStyle = window.getComputedStyle(element);
        const relevantStyles = [
          'font-family', 'font-size', 'font-weight', 'font-style',
          'fill', 'stroke', 'stroke-width', 'stroke-dasharray',
          'opacity', 'transform', 'text-anchor', 'dominant-baseline'
        ];

        const styleArray: string[] = [];
        relevantStyles.forEach(prop => {
          const value = computedStyle.getPropertyValue(prop);
          if (value && value !== 'none' && value !== 'normal') {
            styleArray.push(`${prop}:${value}`);
          }
        });

        if (styleArray.length > 0) {
          const existingStyle = element.getAttribute('style') || '';
          element.setAttribute('style', `${existingStyle};${styleArray.join(';')}`);
        }
      }
    });
  }

  private setDimensions(svgElement: SVGSVGElement, options: ExportOptions): void {
    if (options.dimensions) {
      svgElement.setAttribute('width', options.dimensions.width.toString());
      svgElement.setAttribute('height', options.dimensions.height.toString());
      svgElement.setAttribute('viewBox', `0 0 ${options.dimensions.width} ${options.dimensions.height}`);
    }
  }

  private optimizeSvg(svgElement: SVGSVGElement): void {
    // Remove unnecessary attributes and elements
    const elementsToRemove: Element[] = [];
    
    svgElement.querySelectorAll('*').forEach(element => {
      // Remove empty groups
      if (element.tagName === 'g' && !element.hasChildNodes()) {
        elementsToRemove.push(element);
      }
      
      // Remove unused definitions
      if (element.tagName === 'defs' && !element.hasChildNodes()) {
        elementsToRemove.push(element);
      }
      
      // Clean up attributes
      const unnecessaryAttrs = ['data-*', 'class'];
      unnecessaryAttrs.forEach(attr => {
        if (element.hasAttribute(attr)) {
          element.removeAttribute(attr);
        }
      });
    });

    elementsToRemove.forEach(element => element.remove());
  }

  private getDimensions(svgElement: SVGSVGElement): ExportDimensions {
    const width = parseFloat(svgElement.getAttribute('width') || '800');
    const height = parseFloat(svgElement.getAttribute('height') || '600');
    
    return { width, height };
  }

  private drawBackground(
    ctx: CanvasRenderingContext2D,
    dimensions: ExportDimensions,
    options: ExportOptions
  ): void {
    const { background } = options;
    
    if (background.mode === 'transparent') {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      return;
    }

    let color: string;
    switch (background.mode) {
      case 'white':
        color = '#ffffff';
        break;
      case 'black':
        color = '#000000';
        break;
      case 'theme':
        color = getComputedStyle(document.body).backgroundColor || '#ffffff';
        break;
      case 'custom':
        color = background.color || '#ffffff';
        break;
      default:
        color = '#ffffff';
    }

    ctx.fillStyle = color;
    ctx.globalAlpha = background.opacity || 1;
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);
    ctx.globalAlpha = 1;
  }

  private getMimeType(format: string): string {
    switch (format) {
      case 'png':
        return 'image/png';
      case 'jpg':
        return 'image/jpeg';
      case 'webp':
        return 'image/webp';
      default:
        return 'image/png';
    }
  }

  private generateMetadataComments(metadata: any): string {
    const comments: string[] = [];
    
    if (metadata.title) comments.push(`<!-- Title: ${metadata.title} -->`);
    if (metadata.author) comments.push(`<!-- Author: ${metadata.author} -->`);
    if (metadata.subject) comments.push(`<!-- Subject: ${metadata.subject} -->`);
    if (metadata.keywords) comments.push(`<!-- Keywords: ${metadata.keywords.join(', ')} -->`);
    
    comments.push(`<!-- Generated: ${new Date().toISOString()} -->`);
    
    return comments.join('\n');
  }

  private async loadJsPDF(): Promise<any> {
    if (typeof window !== 'undefined' && (window as any).jspdf) {
      return (window as any).jspdf;
    }
    
    // If jsPDF is not available, throw an error
    throw new Error('jsPDF library not loaded. Please include jsPDF in your HTML.');
  }

  private async createZipArchive(results: ExportResult[]): Promise<Blob> {
    // This would require a ZIP library like JSZip
    // For now, we'll return a simple implementation
    throw new Error('ZIP archive creation not implemented. Include JSZip library for this feature.');
  }

  private isRecoverableError(error: any): boolean {
    if (error instanceof Error) {
      const recoverableErrors = [
        'Network error',
        'Timeout',
        'Canvas context not available',
        'Failed to load SVG image'
      ];
      
      return recoverableErrors.some(msg => error.message.includes(msg));
    }
    
    return false;
  }

  private getErrorSuggestions(error: any): string[] {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      if (message.includes('canvas')) {
        return [
          'Try using a different browser',
          'Clear browser cache and reload',
          'Try exporting as SVG instead'
        ];
      }
      
      if (message.includes('svg')) {
        return [
          'Check if the diagram rendered correctly',
          'Try a simpler diagram',
          'Refresh the page and try again'
        ];
      }
      
      if (message.includes('dimensions')) {
        return [
          'Use smaller dimensions',
          'Try a lower scale factor',
          'Export as vector format (SVG) instead'
        ];
      }
    }
    
    return [
      'Try refreshing the page',
      'Try a different export format',
      'Check browser console for more details'
    ];
  }
}

// Export singleton instance
export const exportService = new ExportService();
export default exportService;