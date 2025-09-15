/**
 * Enterprise Export Service Types
 * Comprehensive type definitions for export functionality
 */

export type ExportFormat = 'svg' | 'png' | 'jpg' | 'pdf' | 'webp';

export type BackgroundMode = 'transparent' | 'white' | 'black' | 'theme' | 'custom';

export type PaperSize = 'A4' | 'A3' | 'A5' | 'Letter' | 'Legal' | 'Tabloid' | 'custom';

export type PdfOrientation = 'portrait' | 'landscape' | 'auto';

export interface ExportDimensions {
  width: number;
  height: number;
}

export interface ExportQuality {
  dpi: number;
  scale: number;
  compression?: number; // 0-1 for JPEG/WebP
  antialiasing?: boolean;
}

export interface ExportBackground {
  mode: BackgroundMode;
  color?: string;
  opacity?: number;
}

export interface ExportMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

export interface PdfOptions {
  orientation: PdfOrientation;
  paperSize: PaperSize;
  customSize?: ExportDimensions;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  compress: boolean;
  embedFonts: boolean;
}

export interface ExportOptions {
  format: ExportFormat;
  filename: string;
  quality: ExportQuality;
  background: ExportBackground;
  dimensions?: ExportDimensions;
  metadata?: ExportMetadata;
  pdfOptions?: PdfOptions;
  includeWatermark?: boolean;
  embedSvgFonts?: boolean;
  optimizeSvg?: boolean;
}

export interface ExportProgress {
  stage: 'preparing' | 'rendering' | 'processing' | 'finalizing' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  timeElapsed: number;
  estimatedTimeRemaining?: number;
}

export interface ExportResult {
  success: boolean;
  blob?: Blob;
  dataUrl?: string;
  filename: string;
  fileSize: number;
  dimensions: ExportDimensions;
  format: ExportFormat;
  metadata: ExportMetadata;
  processingTime: number;
  error?: ExportError;
}

export interface ExportError {
  code: string;
  message: string;
  details?: any;
  recoverable: boolean;
  suggestions?: string[];
}

export interface BatchExportOptions {
  formats: ExportFormat[];
  baseFilename: string;
  options: Omit<ExportOptions, 'format' | 'filename'>;
  zipResults?: boolean;
}

export interface BatchExportResult {
  success: boolean;
  results: ExportResult[];
  zipBlob?: Blob;
  totalSize: number;
  processingTime: number;
  errors: ExportError[];
}

export type ExportProgressCallback = (progress: ExportProgress) => void;
export type ExportCompleteCallback = (result: ExportResult) => void;
export type ExportErrorCallback = (error: ExportError) => void;

// Default configurations
export const DEFAULT_EXPORT_QUALITY: ExportQuality = {
  dpi: 300,
  scale: 2,
  compression: 0.95,
  antialiasing: true
};

export const DEFAULT_EXPORT_BACKGROUND: ExportBackground = {
  mode: 'white',
  opacity: 1
};

export const DEFAULT_PDF_OPTIONS: PdfOptions = {
  orientation: 'auto',
  paperSize: 'A4',
  margins: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20
  },
  compress: true,
  embedFonts: true
};

export const PAPER_SIZES: Record<PaperSize, ExportDimensions> = {
  'A4': { width: 595, height: 842 },
  'A3': { width: 842, height: 1191 },
  'A5': { width: 420, height: 595 },
  'Letter': { width: 612, height: 792 },
  'Legal': { width: 612, height: 1008 },
  'Tabloid': { width: 792, height: 1224 },
  'custom': { width: 800, height: 600 }
};

export const QUALITY_PRESETS = {
  web: { dpi: 72, scale: 1, compression: 0.8 },
  print: { dpi: 300, scale: 2, compression: 0.95 },
  high: { dpi: 600, scale: 3, compression: 1 }
} as const;