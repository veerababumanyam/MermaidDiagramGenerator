import type { ExportOptions } from './export';

export interface ExportPreferences {
  defaultFormat: 'svg' | 'png' | 'jpg' | 'webp' | 'pdf';
  defaultQuality: {
    dpi: number;
    scale: number;
    compression: number;
    antialiasing: boolean;
  };
  defaultBackground: {
    mode: 'transparent' | 'white' | 'black' | 'theme' | 'custom';
    color: string;
  };
  defaultFolder: string;
  enableAutoNaming: boolean;
  autoNamingPattern: string; // e.g., "{diagramType}-{timestamp}", "{filename}-{date}", etc.
  showAdvancedOptions: boolean;
  rememberSettings: boolean;
  defaultPdfOptions: {
    paperSize: 'A4' | 'A3' | 'A5' | 'Letter' | 'Legal' | 'custom';
    orientation: 'portrait' | 'landscape';
    margin: number;
  };
}

export interface ExportSettings extends ExportPreferences {
  lastUsedSettings?: Partial<ExportOptions>;
  exportCount: number;
  lastExportDate: string;
}

export const DEFAULT_EXPORT_PREFERENCES: ExportPreferences = {
  defaultFormat: 'png',
  defaultQuality: {
    dpi: 300,
    scale: 2,
    compression: 0.95,
    antialiasing: true
  },
  defaultBackground: {
    mode: 'white',
    color: '#ffffff'
  },
  defaultFolder: '', // Browser's default downloads folder
  enableAutoNaming: true,
  autoNamingPattern: '{filename}-{timestamp}',
  showAdvancedOptions: false,
  rememberSettings: true,
  defaultPdfOptions: {
    paperSize: 'A4',
    orientation: 'portrait',
    margin: 20
  }
};

// Auto-naming tokens that can be used in patterns
export const AUTO_NAMING_TOKENS = {
  '{filename}': 'Base filename entered by user',
  '{timestamp}': 'Current timestamp (YYYYMMDD-HHMMSS)',
  '{date}': 'Current date (YYYY-MM-DD)',
  '{time}': 'Current time (HH-MM-SS)',
  '{diagramType}': 'Type of diagram (flowchart, sequence, etc.)',
  '{theme}': 'Current theme name',
  '{format}': 'Export format (svg, png, etc.)',
  '{counter}': 'Auto-incrementing counter'
} as const;

export type AutoNamingToken = keyof typeof AUTO_NAMING_TOKENS;