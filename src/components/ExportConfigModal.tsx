import React, { useState, useEffect, useCallback } from 'react';
import { 
  ExportFormat, 
  ExportOptions, 
  ExportQuality, 
  ExportBackground, 
  BackgroundMode,
  PdfOptions,
  ExportMetadata,
  PaperSize 
} from '../types/export';
import { exportPreferencesService } from '../services/ExportPreferencesService';

interface ExportConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
  isExporting: boolean;
  defaultOptions?: Partial<ExportOptions>;
  currentDiagramType?: string;
  currentTheme?: string;
}

const FORMATS: { value: ExportFormat; label: string; description: string }[] = [
  { value: 'svg', label: 'SVG', description: 'Vector format, scalable, small file size' },
  { value: 'png', label: 'PNG', description: 'High quality, supports transparency' },
  { value: 'jpg', label: 'JPEG', description: 'Smaller file size, no transparency' },
  { value: 'webp', label: 'WebP', description: 'Modern format, excellent compression' },
  { value: 'pdf', label: 'PDF', description: 'Print-ready, professional documents' }
];

const BACKGROUND_MODES: { value: BackgroundMode; label: string }[] = [
  { value: 'transparent', label: 'Transparent' },
  { value: 'white', label: 'White' },
  { value: 'black', label: 'Black' },
  { value: 'theme', label: 'Theme Color' },
  { value: 'custom', label: 'Custom Color' }
];

const PAPER_SIZE_OPTIONS: { value: PaperSize; label: string }[] = [
  { value: 'A4', label: 'A4 (210×297mm)' },
  { value: 'A3', label: 'A3 (297×420mm)' },
  { value: 'A5', label: 'A5 (148×210mm)' },
  { value: 'Letter', label: 'Letter (8.5×11")' },
  { value: 'Legal', label: 'Legal (8.5×14")' },
  { value: 'Tabloid', label: 'Tabloid (11×17")' },
  { value: 'custom', label: 'Custom Size' }
];

const QUALITY_PRESET_OPTIONS = [
  { value: 'web', label: 'Web (72 DPI)', description: 'Optimized for web display' },
  { value: 'print', label: 'Print (300 DPI)', description: 'High quality for printing' },
  { value: 'high', label: 'High (600 DPI)', description: 'Maximum quality' },
  { value: 'custom', label: 'Custom', description: 'Custom settings' }
] as const;

const ExportConfigModal: React.FC<ExportConfigModalProps> = ({
  isOpen,
  onClose,
  onExport,
  isExporting,
  defaultOptions,
  currentDiagramType = 'diagram',
  currentTheme = 'default'
}) => {
  // Load user preferences
  const preferences = exportPreferencesService.getPreferences();
  
  // Initialize state with smart defaults
  const [format, setFormat] = useState<ExportFormat>(
    defaultOptions?.format || preferences.defaultFormat
  );
  const [filename, setFilename] = useState(() => {
    return exportPreferencesService.generateFilename({
      baseFilename: defaultOptions?.filename || 'diagram',
      diagramType: currentDiagramType,
      theme: currentTheme,
      format: format
    });
  });
  const [qualityPreset, setQualityPreset] = useState<'web' | 'print' | 'high' | 'custom'>('print');
  const [quality, setQuality] = useState<ExportQuality>(
    defaultOptions?.quality || preferences.defaultQuality
  );
  const [background, setBackground] = useState<ExportBackground>(
    defaultOptions?.background || preferences.defaultBackground
  );
  const [customColor, setCustomColor] = useState(
    preferences.defaultBackground.color || '#ffffff'
  );
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const [customDimensions, setCustomDimensions] = useState(false);
  const [pdfOptions, setPdfOptions] = useState<PdfOptions>({
    orientation: preferences.defaultPdfOptions.orientation,
    paperSize: preferences.defaultPdfOptions.paperSize,
    customSize: { width: 595, height: 842 },
    margins: { 
      top: preferences.defaultPdfOptions.margin,
      right: preferences.defaultPdfOptions.margin,
      bottom: preferences.defaultPdfOptions.margin,
      left: preferences.defaultPdfOptions.margin
    },
    compress: true,
    embedFonts: true
  });
  const [metadata, setMetadata] = useState<ExportMetadata>({
    title: filename,
    author: '',
    subject: '',
    keywords: []
  });
  const [showAdvanced, setShowAdvanced] = useState(preferences.showAdvancedOptions);
  const [selectedFolder, setSelectedFolder] = useState(preferences.defaultFolder);
  const [autoNaming, setAutoNaming] = useState(preferences.enableAutoNaming);
  const [namingPattern, setNamingPattern] = useState(preferences.autoNamingPattern);

  // Regenerate filename when auto-naming settings change
  useEffect(() => {
    if (autoNaming) {
      const newFilename = exportPreferencesService.generateFilename({
        baseFilename: filename.replace(/[_-]\d{8}-\d{6}$/, ''), // Remove existing timestamp
        diagramType: currentDiagramType,
        theme: currentTheme,
        format: format
      });
      setFilename(newFilename);
    }
  }, [autoNaming, namingPattern, format, currentDiagramType, currentTheme]);

  // Update quality when preset changes
  useEffect(() => {
    if (qualityPreset !== 'custom') {
      const presets = {
        web: { dpi: 72, scale: 1, compression: 0.8, antialiasing: true },
        print: { dpi: 300, scale: 2, compression: 0.95, antialiasing: true },
        high: { dpi: 600, scale: 3, compression: 1, antialiasing: true }
      };
      setQuality(presets[qualityPreset]);
    }
  }, [qualityPreset]);

  // Update background color when mode changes
  useEffect(() => {
    if (background.mode === 'custom') {
      setBackground(prev => ({ ...prev, color: customColor }));
    }
  }, [background.mode, customColor]);

  // Handle folder selection
  const handleSelectFolder = async () => {
    const folder = await exportPreferencesService.selectExportDirectory();
    if (folder) {
      setSelectedFolder(folder);
    }
  };

  const handleExport = useCallback(() => {
    const exportOptions: ExportOptions = {
      format,
      filename: filename || 'diagram',
      quality,
      background,
      dimensions: customDimensions ? dimensions : undefined,
      metadata: {
        ...metadata,
        title: metadata.title || filename
      },
      pdfOptions: format === 'pdf' ? pdfOptions : undefined,
      embedSvgFonts: true,
      optimizeSvg: format === 'svg'
    };

    // Remember user settings
    exportPreferencesService.rememberSettings(exportOptions);
    
    // Update preferences
    exportPreferencesService.updatePreferences({
      defaultFormat: format,
      defaultQuality: {
        ...preferences.defaultQuality,
        ...quality
      },
      defaultBackground: {
        ...preferences.defaultBackground,
        ...background
      },
      enableAutoNaming: autoNaming,
      autoNamingPattern: namingPattern,
      showAdvancedOptions: showAdvanced,
      defaultFolder: selectedFolder
    });

    onExport(exportOptions);
  }, [format, filename, quality, background, customDimensions, dimensions, metadata, pdfOptions, autoNaming, namingPattern, showAdvanced, selectedFolder, onExport, preferences]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const formatSupportsTransparency = ['svg', 'png', 'webp'].includes(format);
  const formatSupportsCompression = ['jpg', 'webp'].includes(format);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 
              id="export-modal-title"
              className="text-2xl font-bold text-gray-900 dark:text-gray-100"
            >
              Export Configuration
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1"
              disabled={isExporting}
              aria-label="Close export configuration"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Left Column - Basic Settings */}
            <div className="space-y-6">
              {/* Export Format */}
              <fieldset>
                <legend className="block text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Export Format
                </legend>
                <div className="space-y-2">
                  {FORMATS.map(fmt => (
                    <label 
                      key={fmt.value} 
                      className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-gray-200 dark:border-gray-600 focus-within:ring-2 focus-within:ring-blue-500"
                    >
                      <input
                        type="radio"
                        name="format"
                        value={fmt.value}
                        checked={format === fmt.value}
                        onChange={(e) => setFormat(e.target.value as ExportFormat)}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                        disabled={isExporting}
                        aria-describedby={`format-${fmt.value}-desc`}
                      />
                      <div className="ml-3">
                        <div className="font-semibold text-gray-900 dark:text-gray-100 text-base">{fmt.label}</div>
                        <div id={`format-${fmt.value}-desc`} className="text-sm text-gray-600 dark:text-gray-300 mt-1">{fmt.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* File Settings */}
              <fieldset>
                <legend className="block text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  File Settings
                </legend>
                
                {/* Auto-naming toggle */}
                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={autoNaming}
                      onChange={(e) => setAutoNaming(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={isExporting}
                    />
                    <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                      Enable auto-naming with timestamps
                    </span>
                  </label>
                  {autoNaming && (
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      Pattern: {namingPattern}
                    </div>
                  )}
                </div>

                {/* Filename input */}
                <div className="mb-4">
                  <label 
                    htmlFor="filename-input"
                    className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2"
                  >
                    Filename {autoNaming && '(base name)'}
                  </label>
                  <input
                    id="filename-input"
                    type="text"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    placeholder="Enter filename (without extension)"
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                    disabled={isExporting}
                    aria-describedby="filename-help"
                  />
                  <div id="filename-help" className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                    File extension will be added automatically based on format
                  </div>
                </div>

                {/* Export folder selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Export Folder
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={selectedFolder || 'Default download folder'}
                      readOnly
                      className="flex-1 px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                      aria-describedby="folder-help"
                    />
                    <button
                      type="button"
                      onClick={handleSelectFolder}
                      disabled={isExporting}
                      className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Browse
                    </button>
                  </div>
                  <div id="folder-help" className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                    Choose where to save exported files (browser dependent)
                  </div>
                </div>
              </fieldset>
            </div>

            {/* Right Column - Quality & Background Settings */}
            <div className="space-y-6">
              {/* Quality Settings */}
              <fieldset>
                <legend className="block text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Quality Settings
                </legend>
                
                {/* Quality Preset */}
                <div className="mb-4">
                  <label 
                    htmlFor="quality-preset"
                    className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2"
                  >
                    Quality Preset
                  </label>
                  <select
                    id="quality-preset"
                    value={qualityPreset}
                    onChange={(e) => setQualityPreset(e.target.value as any)}
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-gray-100 transition-colors"
                    disabled={isExporting}
                  >
                    {QUALITY_PRESET_OPTIONS.map(preset => (
                      <option key={preset.value} value={preset.value}>
                        {preset.label} - {preset.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom Quality Settings */}
                {qualityPreset === 'custom' && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div>
                      <label 
                        htmlFor="quality-dpi"
                        className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1"
                      >
                        DPI
                      </label>
                      <input
                        id="quality-dpi"
                        type="number"
                        value={quality.dpi}
                        onChange={(e) => setQuality(prev => ({ ...prev, dpi: parseInt(e.target.value) || 72 }))}
                        min="72"
                        max="600"
                        className="w-full px-3 py-2 text-base border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                        disabled={isExporting}
                      />
                    </div>
                    <div>
                      <label 
                        htmlFor="quality-scale"
                        className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1"
                      >
                        Scale
                      </label>
                      <input
                        id="quality-scale"
                        type="number"
                        value={quality.scale}
                        onChange={(e) => setQuality(prev => ({ ...prev, scale: parseFloat(e.target.value) || 1 }))}
                        min="0.5"
                        max="5"
                        step="0.1"
                        className="w-full px-3 py-2 text-base border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                        disabled={isExporting}
                      />
                    </div>
                  </div>
                )}
              </fieldset>

              {/* Background Settings */}
              <fieldset>
                <legend className="block text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Background
                </legend>
                <div className="space-y-3">
                  {BACKGROUND_MODES.map(bg => (
                    <label 
                      key={bg.value} 
                      className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-gray-200 dark:border-gray-600 focus-within:ring-2 focus-within:ring-blue-500"
                    >
                      <input
                        type="radio"
                        name="background"
                        value={bg.value}
                        checked={background.mode === bg.value}
                        onChange={(e) => setBackground(prev => ({ ...prev, mode: e.target.value as BackgroundMode }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                        disabled={isExporting || (!formatSupportsTransparency && bg.value === 'transparent')}
                      />
                      <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-100">{bg.label}</span>
                    </label>
                  ))}
                  
                  {background.mode === 'custom' && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                      <label 
                        htmlFor="custom-color"
                        className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2"
                      >
                        Custom Color
                      </label>
                      <input
                        id="custom-color"
                        type="color"
                        value={customColor}
                        onChange={(e) => setCustomColor(e.target.value)}
                        className="w-16 h-10 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                        disabled={isExporting}
                      />
                    </div>
                  )}
                </div>
              </fieldset>

              {/* Advanced Options Toggle */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showAdvanced}
                    onChange={(e) => setShowAdvanced(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={isExporting}
                  />
                  <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                    Show advanced options
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isExporting}
                className="px-6 py-3 text-base font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting || !filename.trim()}
                className="px-6 py-3 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                {isExporting ? 'Exporting...' : 'Export'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportConfigModal;