import type { ExportPreferences, ExportSettings, AutoNamingToken } from '../types/preferences';
import { DEFAULT_EXPORT_PREFERENCES, AUTO_NAMING_TOKENS } from '../types/preferences';
import type { ExportOptions } from '../types/export';

class ExportPreferencesService {
  private readonly STORAGE_KEY = 'mermaid-export-preferences';
  private preferences: ExportSettings;

  constructor() {
    this.preferences = this.loadPreferences();
  }

  /**
   * Load preferences from localStorage
   */
  private loadPreferences(): ExportSettings {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_EXPORT_PREFERENCES,
          ...parsed,
          exportCount: parsed.exportCount || 0,
          lastExportDate: parsed.lastExportDate || ''
        };
      }
    } catch (error) {
      console.warn('Failed to load export preferences:', error);
    }

    return {
      ...DEFAULT_EXPORT_PREFERENCES,
      exportCount: 0,
      lastExportDate: ''
    };
  }

  /**
   * Save preferences to localStorage
   */
  private savePreferences(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.preferences));
    } catch (error) {
      console.error('Failed to save export preferences:', error);
    }
  }

  /**
   * Get current preferences
   */
  getPreferences(): ExportSettings {
    return { ...this.preferences };
  }

  /**
   * Update preferences
   */
  updatePreferences(updates: Partial<ExportPreferences>): void {
    this.preferences = { ...this.preferences, ...updates };
    this.savePreferences();
  }

  /**
   * Generate smart filename based on pattern and context
   */
  generateFilename(context: {
    baseFilename?: string;
    diagramType?: string;
    theme?: string;
    format?: string;
  }): string {
    if (!this.preferences.enableAutoNaming) {
      return context.baseFilename || 'diagram';
    }

    let filename = this.preferences.autoNamingPattern;
    const now = new Date();

    // Replace tokens with actual values
    filename = filename.replace('{filename}', context.baseFilename || 'diagram');
    filename = filename.replace('{timestamp}', this.formatTimestamp(now));
    filename = filename.replace('{date}', this.formatDate(now));
    filename = filename.replace('{time}', this.formatTime(now));
    filename = filename.replace('{diagramType}', context.diagramType || 'diagram');
    filename = filename.replace('{theme}', context.theme || 'default');
    filename = filename.replace('{format}', context.format || '');
    filename = filename.replace('{counter}', this.getNextCounter().toString().padStart(3, '0'));

    // Clean up filename (remove invalid characters)
    filename = filename.replace(/[<>:"/\\|?*]/g, '-');
    filename = filename.replace(/\s+/g, '-');
    filename = filename.replace(/-+/g, '-');
    filename = filename.replace(/^-|-$/g, '');

    return filename || 'diagram';
  }

  /**
   * Get default export options based on preferences
   */
  getDefaultExportOptions(overrides: Partial<ExportOptions> = {}): Partial<ExportOptions> {
    return {
      format: this.preferences.defaultFormat,
      quality: { ...this.preferences.defaultQuality },
      background: { ...this.preferences.defaultBackground },
      filename: this.generateFilename({
        baseFilename: overrides.filename,
        format: overrides.format || this.preferences.defaultFormat
      }),
      pdfOptions: this.preferences.defaultFormat === 'pdf' ? {
        paperSize: this.preferences.defaultPdfOptions.paperSize,
        orientation: this.preferences.defaultPdfOptions.orientation,
        margins: {
          top: this.preferences.defaultPdfOptions.margin,
          right: this.preferences.defaultPdfOptions.margin,
          bottom: this.preferences.defaultPdfOptions.margin,
          left: this.preferences.defaultPdfOptions.margin
        },
        compress: true,
        embedFonts: true
      } : undefined,
      ...overrides
    };
  }

  /**
   * Update last used settings
   */
  rememberSettings(options: ExportOptions): void {
    if (!this.preferences.rememberSettings) return;

    this.preferences.lastUsedSettings = {
      format: options.format,
      quality: options.quality,
      background: options.background,
      pdfOptions: options.pdfOptions
    };
    this.preferences.exportCount++;
    this.preferences.lastExportDate = new Date().toISOString();
    this.savePreferences();
  }

  /**
   * Reset preferences to defaults
   */
  resetToDefaults(): void {
    this.preferences = {
      ...DEFAULT_EXPORT_PREFERENCES,
      exportCount: this.preferences.exportCount,
      lastExportDate: this.preferences.lastExportDate
    };
    this.savePreferences();
  }

  /**
   * Get auto-naming pattern suggestions
   */
  getAutoNamingPatterns(): Array<{ pattern: string; description: string; example: string }> {
    const context = {
      baseFilename: 'my-diagram',
      diagramType: 'flowchart',
      theme: 'default',
      format: 'png'
    };

    return [
      {
        pattern: '{filename}',
        description: 'Simple filename only',
        example: this.previewFilename('{filename}', context)
      },
      {
        pattern: '{filename}-{timestamp}',
        description: 'Filename with timestamp',
        example: this.previewFilename('{filename}-{timestamp}', context)
      },
      {
        pattern: '{filename}-{date}',
        description: 'Filename with date',
        example: this.previewFilename('{filename}-{date}', context)
      },
      {
        pattern: '{diagramType}-{filename}-{counter}',
        description: 'Type, filename, and counter',
        example: this.previewFilename('{diagramType}-{filename}-{counter}', context)
      },
      {
        pattern: '{date}-{filename}-{theme}',
        description: 'Date, filename, and theme',
        example: this.previewFilename('{date}-{filename}-{theme}', context)
      }
    ];
  }

  /**
   * Preview filename generation with given pattern
   */
  private previewFilename(pattern: string, context: any): string {
    const oldPattern = this.preferences.autoNamingPattern;
    this.preferences.autoNamingPattern = pattern;
    const result = this.generateFilename(context);
    this.preferences.autoNamingPattern = oldPattern;
    return result;
  }

  /**
   * Format timestamp for filename
   */
  private formatTimestamp(date: Date): string {
    return date.toISOString()
      .slice(0, 19)
      .replace(/[-:T]/g, '')
      .replace(/(\d{8})(\d{6})/, '$1-$2');
  }

  /**
   * Format date for filename
   */
  private formatDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  /**
   * Format time for filename
   */
  private formatTime(date: Date): string {
    return date.toTimeString().slice(0, 8).replace(/:/g, '-');
  }

  /**
   * Get next counter value
   */
  private getNextCounter(): number {
    return this.preferences.exportCount + 1;
  }

  /**
   * Check if folder selection is supported
   */
  isDirectoryPickerSupported(): boolean {
    return 'showDirectoryPicker' in window;
  }

  /**
   * Request directory access (for supported browsers)
   */
  async selectExportDirectory(): Promise<string | null> {
    if (!this.isDirectoryPickerSupported()) {
      console.warn('Directory picker is not supported in this browser');
      // Show user-friendly message
      alert('Folder selection is not supported in this browser. Files will be saved to your default download folder.');
      return null;
    }

    try {
      // @ts-ignore - showDirectoryPicker is not in TypeScript definitions yet
      const dirHandle = await window.showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'downloads'
      });
      
      const folderPath = dirHandle.name || 'Selected Folder';
      console.log('Directory selected:', folderPath);
      
      this.updatePreferences({ defaultFolder: folderPath });
      return folderPath;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Directory selection was cancelled by user');
      } else {
        console.error('Failed to select directory:', error);
        alert('Failed to select folder. Please try again or use the default download folder.');
      }
      return null;
    }
  }
}

export const exportPreferencesService = new ExportPreferencesService();