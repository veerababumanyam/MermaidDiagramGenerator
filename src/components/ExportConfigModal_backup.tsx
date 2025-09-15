/**
 * Export Configuration Modal
 * WAG 2.1 compliant UI with enhanced user experience
 */

import React, { useState, useCallback, useEffect } from 'react';
import type {
  ExportFormat,
  ExportOptions,
  BackgroundMode,
  PaperSize,
  PdfOrientation,
  ExportQuality,
  ExportBackground,
  PdfOptions,
  ExportMetadata,
  QUALITY_PRESETS
} from '../types/export';
import { PAPER_SIZES } from '../types/export';
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
  }, [format, filename, quality, background, customDimensions, dimensions, metadata, pdfOptions, autoNaming, namingPattern, showAdvanced, selectedFolder, onExport]);

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
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-gray-100 transition-colors"
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

            {/* Right Column - Advanced Settings */}
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
                          type="number"
                          value={quality.dpi}
                          onChange={(e) => setQuality(prev => ({ ...prev, dpi: parseInt(e.target.value) || 300 }))}
                          min="72"
                          max="2400"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          disabled={isExporting}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Scale</label>
                        <input
                          type="number"
                          value={quality.scale}
                          onChange={(e) => setQuality(prev => ({ ...prev, scale: parseFloat(e.target.value) || 2 }))}
                          min="0.1"
                          max="10"
                          step="0.1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          disabled={isExporting}
                        />
                      </div>
                    </div>
                  )}

                  {/* Compression (for applicable formats) */}
                  {formatSupportsCompression && (
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Compression: {Math.round((quality.compression || 0.95) * 100)}%
                      </label>
                      <input
                        type="range"
                        value={quality.compression || 0.95}
                        onChange={(e) => setQuality(prev => ({ ...prev, compression: parseFloat(e.target.value) }))}
                        min="0.1"
                        max="1"
                        step="0.01"
                        className="w-full"
                        disabled={isExporting}
                      />
                    </div>
                  )}

                  {/* Antialiasing */}
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={quality.antialiasing}
                      onChange={(e) => setQuality(prev => ({ ...prev, antialiasing: e.target.checked }))}
                      className="mr-2"
                      disabled={isExporting}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Enable antialiasing</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column - Advanced Settings */}
            <div className="space-y-6">
              {/* Background Settings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Background
                </label>
                <div className="space-y-3">
                  <select
                    value={background.mode}
                    onChange={(e) => setBackground(prev => ({ ...prev, mode: e.target.value as BackgroundMode }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    disabled={isExporting}
                  >
                    {BACKGROUND_MODES
                      .filter(mode => formatSupportsTransparency || mode.value !== 'transparent')
                      .map(mode => (
                        <option key={mode.value} value={mode.value}>
                          {mode.label}
                        </option>
                      ))}
                  </select>

                  {background.mode === 'custom' && (
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={customColor}
                        onChange={(e) => setCustomColor(e.target.value)}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                        disabled={isExporting}
                      />
                      <input
                        type="text"
                        value={customColor}
                        onChange={(e) => setCustomColor(e.target.value)}
                        placeholder="#ffffff"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        disabled={isExporting}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Custom Dimensions */}
              <div>
                <label className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    checked={customDimensions}
                    onChange={(e) => setCustomDimensions(e.target.checked)}
                    className="mr-2"
                    disabled={isExporting}
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Custom Dimensions
                  </span>
                </label>
                
                {customDimensions && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Width (px)</label>
                      <input
                        type="number"
                        value={dimensions.width}
                        onChange={(e) => setDimensions(prev => ({ ...prev, width: parseInt(e.target.value) || 1200 }))}
                        min="100"
                        max="32767"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        disabled={isExporting}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Height (px)</label>
                      <input
                        type="number"
                        value={dimensions.height}
                        onChange={(e) => setDimensions(prev => ({ ...prev, height: parseInt(e.target.value) || 800 }))}
                        min="100"
                        max="32767"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        disabled={isExporting}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* PDF Options */}
              {format === 'pdf' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    PDF Settings
                  </label>
                  <div className="space-y-3">
                    {/* Paper Size */}
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Paper Size</label>
                      <select
                        value={pdfOptions.paperSize}
                        onChange={(e) => setPdfOptions(prev => ({ ...prev, paperSize: e.target.value as PaperSize }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        disabled={isExporting}
                      >
                        {PAPER_SIZE_OPTIONS.map(size => (
                          <option key={size.value} value={size.value}>
                            {size.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Orientation */}
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Orientation</label>
                      <select
                        value={pdfOptions.orientation}
                        onChange={(e) => setPdfOptions(prev => ({ ...prev, orientation: e.target.value as PdfOrientation }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        disabled={isExporting}
                      >
                        <option value="auto">Auto</option>
                        <option value="portrait">Portrait</option>
                        <option value="landscape">Landscape</option>
                      </select>
                    </div>

                    {/* Margins */}
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Margins (pt)</label>
                      <div className="grid grid-cols-4 gap-2">
                        <input
                          type="number"
                          value={pdfOptions.margins.top}
                          onChange={(e) => setPdfOptions(prev => ({
                            ...prev,
                            margins: { ...prev.margins, top: parseInt(e.target.value) || 20 }
                          }))}
                          placeholder="Top"
                          className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          disabled={isExporting}
                        />
                        <input
                          type="number"
                          value={pdfOptions.margins.right}
                          onChange={(e) => setPdfOptions(prev => ({
                            ...prev,
                            margins: { ...prev.margins, right: parseInt(e.target.value) || 20 }
                          }))}
                          placeholder="Right"
                          className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          disabled={isExporting}
                        />
                        <input
                          type="number"
                          value={pdfOptions.margins.bottom}
                          onChange={(e) => setPdfOptions(prev => ({
                            ...prev,
                            margins: { ...prev.margins, bottom: parseInt(e.target.value) || 20 }
                          }))}
                          placeholder="Bottom"
                          className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          disabled={isExporting}
                        />
                        <input
                          type="number"
                          value={pdfOptions.margins.left}
                          onChange={(e) => setPdfOptions(prev => ({
                            ...prev,
                            margins: { ...prev.margins, left: parseInt(e.target.value) || 20 }
                          }))}
                          placeholder="Left"
                          className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          disabled={isExporting}
                        />
                      </div>
                    </div>

                    {/* PDF Options */}
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={pdfOptions.compress}
                          onChange={(e) => setPdfOptions(prev => ({ ...prev, compress: e.target.checked }))}
                          className="mr-2"
                          disabled={isExporting}
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Compress PDF</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={pdfOptions.embedFonts}
                          onChange={(e) => setPdfOptions(prev => ({ ...prev, embedFonts: e.target.checked }))}
                          className="mr-2"
                          disabled={isExporting}
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Embed fonts</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced Options Toggle */}
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                disabled={isExporting}
              >
                {showAdvanced ? 'Hide' : 'Show'} Advanced Options
              </button>

              {/* Metadata */}
              {showAdvanced && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Metadata
                  </label>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={metadata.title || ''}
                      onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Title"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      disabled={isExporting}
                    />
                    <input
                      type="text"
                      value={metadata.author || ''}
                      onChange={(e) => setMetadata(prev => ({ ...prev, author: e.target.value }))}
                      placeholder="Author"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      disabled={isExporting}
                    />
                    <input
                      type="text"
                      value={metadata.subject || ''}
                      onChange={(e) => setMetadata(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Subject"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      disabled={isExporting}
                    />
                    <input
                      type="text"
                      value={metadata.keywords?.join(', ') || ''}
                      onChange={(e) => setMetadata(prev => ({ 
                        ...prev, 
                        keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                      }))}
                      placeholder="Keywords (comma-separated)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      disabled={isExporting}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
              disabled={isExporting}
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || !filename.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center"
            >
              {isExporting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Exporting...
                </>
              ) : (
                <>
                  Export {format.toUpperCase()}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportConfigModal;