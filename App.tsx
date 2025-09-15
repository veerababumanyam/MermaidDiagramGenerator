
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { DiagramTemplate } from './types';
import { useAppStore } from './store/useAppStore';
import { useMermaidRenderer } from './hooks/useMermaidRenderer';
import { useGeminiAI } from './hooks/useGeminiAI';
import useLocalStorage from './hooks/useLocalStorage';

import Header from './components/Header';
import EditorPanel from './components/EditorPanel';
import PreviewPanel from './components/PreviewPanel';
import GenerateAIModal from './components/GenerateAIModal';
import UploadIconModal from './components/UploadIconModal';
import IconPickerModal from './components/IconPickerModal';
import TextEditorModal from './components/TextEditorModal';
import AIChatPanel from './components/AIChatPanel';
import ErrorBoundary from './src/components/ErrorBoundary';
import ExportConfigModal from './src/components/ExportConfigModal';
import ExportProgressModal from './src/components/ExportProgressModal';
import ToastProvider, { useToast, createSuccessToast, createErrorToast } from './src/components/ToastProvider';
import { exportService } from './src/services/ExportService';
import { exportPreferencesService } from './src/services/ExportPreferencesService';
import type { ExportOptions, ExportProgress, ExportResult, BackgroundMode } from './src/types/export';
import TemplateMarketplace from './src/components/templates/TemplateMarketplace';
import VisualIDE from './src/components/ai/VisualIDE';

const AppContent: React.FC = () => {
  // Access toast context
  const { addToast } = useToast();

  // Central store selectors and actions
  const { code, setCode, allIconSets, addIcons, loadIconSets, isChatOpen, initializeFromUrl, isGenerating, theme } = useAppStore();

  // Custom hooks for complex logic
  useMermaidRenderer();
  const { handleFormatCode, handleGenerateDiagram, handleSendMessage } = useGeminiAI();
  // const enhancedAICopilot = useEnhancedAICopilot();
  
  // Local state for UI that doesn't need to be global
  const [editorWidth, setEditorWidth] = useLocalStorage('mermaid-editor-width', 0);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const mainContainerRef = useRef<HTMLElement>(null);
  
  // Modal states
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [isTextEditorOpen, setIsTextEditorOpen] = useState(false);
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false);
  const [isVisualIDEOpen, setIsVisualIDEOpen] = useState(false);
  const [isExportConfigOpen, setIsExportConfigOpen] = useState(false);
  const [isExportProgressOpen, setIsExportProgressOpen] = useState(false);
  
  // Export states
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | undefined>();
  const [exportResult, setExportResult] = useState<ExportResult | undefined>();
  
  // Modal-specific data
  const [aiPrompt, setAiPrompt] = useState('');
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingTextNodeId, setEditingTextNodeId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  
      // Initialize from LocalStorage and URL on mount
  useEffect(() => {
    loadIconSets();
    initializeFromUrl();
    
    // Initialize plugin system
    // diagramPluginManager.initializeBuiltInPlugins();
    
    // Initialize web components
    // webComponentsEngine.initializeBuiltInComponents();
  }, [loadIconSets, initializeFromUrl]);

  // Handle window resize for responsive layout
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Resizer logic
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (windowWidth < 768) return;
    e.preventDefault();
    setIsResizing(true);
  }, [windowWidth]);

  const handleMouseUp = useCallback(() => setIsResizing(false), []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !mainContainerRef.current) return;
    const containerRect = mainContainerRef.current.getBoundingClientRect();
    const newWidth = e.clientX - containerRect.left;
    const minWidth = 300;
    const rightPaneMinWidth = isChatOpen ? 400 + 12 + 300 : 300;
    const maxWidth = containerRect.width - rightPaneMinWidth;
    
    if (newWidth >= minWidth && newWidth <= maxWidth) {
        setEditorWidth(newWidth);
    }
  }, [isResizing, isChatOpen, setEditorWidth]);
  
  useEffect(() => {
    if (isResizing) {
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    } else {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Event Handlers for components
  const handleTemplateChange = useCallback((template: DiagramTemplate) => setCode(template.code), [setCode]);

  const handleDiagramTypeChange = useCallback((type: string) => {
    // Update the current diagram type for Visual IDE
    setCurrentDiagramType(type);
    console.log(`Diagram type changed to: ${type}`);
  }, []);

  const [currentDiagramType, setCurrentDiagramType] = useState<string>('venn');
  const [currentTheme, setCurrentTheme] = useState<string>('default');

  // Enhanced export handlers - direct export with smart defaults
  const handleExport = useCallback(async (type: 'SVG' | 'PNG' | 'PDF') => {
    const format = type.toLowerCase() as 'svg' | 'png' | 'pdf';
    const { exportFileName } = useAppStore.getState();
    
    // Generate smart filename using preferences service
    const filename = exportPreferencesService.generateFilename({
      baseFilename: exportFileName || 'diagram',
      diagramType: currentDiagramType,
      theme: currentTheme,
      format
    });
    
    // Create options with smart defaults
    const options: ExportOptions = {
      format,
      filename,
      quality: format === 'svg' ? undefined : { dpi: 300, scale: 2, compression: 0.95, antialiasing: true },
      background: {
        mode: 'transparent' as BackgroundMode,
        color: '#ffffff',
        opacity: 1
      },
      metadata: {
        title: filename,
        author: 'Mermaid Diagram Generator',
        subject: `${currentDiagramType || 'Diagram'} created with Mermaid`,
        creator: 'Mermaid Diagram Generator',
        producer: 'Mermaid.js',
        keywords: [currentDiagramType || 'diagram', 'mermaid', 'visualization']
      },
      embedSvgFonts: true,
      optimizeSvg: format === 'svg'
    };
    
    // Directly export
    await handleExportWithOptions(options);
  }, [currentDiagramType, currentTheme]);

  const handleExportWithOptions = useCallback(async (options: ExportOptions) => {
    const { svg: svgString } = useAppStore.getState();
    
    if (!svgString) {
      addToast(createErrorToast('Export failed', 'No diagram to export. Please create a diagram first.'));
      return;
    }

    setIsExportConfigOpen(false);
    setIsExporting(true);
    setIsExportProgressOpen(true);
    setExportProgress(undefined);
    setExportResult(undefined);

    // Set up progress callback
    const removeProgressCallback = exportService.onProgress((progress) => {
      setExportProgress(progress);
    });

    try {
      const result = await exportService.exportDiagram(svgString, options);
      
      setExportResult(result);
      
      if (result.success && result.blob) {
        // Auto-download the file
        handleDownloadResult(result);
        
        addToast(createSuccessToast(
          'Export completed',
          `${options.format.toUpperCase()} exported successfully (${(result.fileSize / 1024).toFixed(1)} KB)`
        ));
      } else if (result.error) {
        addToast(createErrorToast(
          'Export failed',
          result.error.message,
          result.error.recoverable ? {
            label: 'Try Again',
            onClick: () => handleExportWithOptions(options)
          } : undefined
        ));
      }
    } catch (error) {
      console.error('Export error:', error);
      addToast(createErrorToast(
        'Export failed',
        error instanceof Error ? error.message : 'An unknown error occurred'
      ));
    } finally {
      removeProgressCallback();
      setIsExporting(false);
    }
  }, [addToast]);

  const handleDownloadResult = useCallback((result: ExportResult) => {
    if (!result.blob) return;

    // Ensure filename has proper extension
    let filename = result.filename;
    const extension = `.${result.format}`;
    
    // Remove any existing extension first, then add the correct one
    filename = filename.replace(/\.[^/.]+$/, '');
    filename = `${filename}${extension}`;

    const url = URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const handleRetryExport = useCallback(() => {
    if (exportResult?.error) {
      setIsExportProgressOpen(false);
      setIsExportConfigOpen(true);
    }
  }, [exportResult]);

  const handleGenerateWithAI = () => {
    handleGenerateDiagram(aiPrompt).then(() => {
        setIsAiModalOpen(false);
        setAiPrompt('');
    });
  };

  const handleTemplateSelect = useCallback((template: any) => {
    // For now, just close the marketplace
    setIsMarketplaceOpen(false);
  }, []);

  const handleVisualIDEDiagramChange = useCallback((diagramData: any) => {
    // Convert visual IDE data back to Mermaid code
    if (diagramData.type === 'venn') {
      const vennCode = `graph TD
${diagramData.sets?.map((set: any) => `  ${set.id}["${set.label}"]`).join('\n') || ''}
${diagramData.intersections?.map((intersection: any) => `  ${intersection.sets.join(' --- ')}["${intersection.label || 'Intersection'}"]`).join('\n') || ''}
${diagramData.sets?.map((set: any) => `  ${set.id}`).join(' --- ') || ''}`;
      setCode(vennCode);
    } else {
      // For other diagram types, store as JSON for now
      setCode(JSON.stringify(diagramData, null, 2));
    }
  }, [setCode]);

  const handleOpenIconPicker = useCallback((nodeId: string) => {
    setEditingNodeId(nodeId);
    setIsIconPickerOpen(true);
  }, []);

  const handleIconSelect = useCallback((newIconCode: string) => {
    if (!editingNodeId) return;
    const nodeDefinitionRegex = new RegExp(`\\b${editingNodeId}\\b(\\[[\\s\\S]*?\\]|\\([\\s\\S]*?\\)|\\{[\\s\\S]*?\\}|>[\\s\\S]*?\\])`);
    const match = code.match(nodeDefinitionRegex);
    if (match) {
        const originalDefinition = match[0];
        let updatedDefinition: string;

        if (originalDefinition.includes('icon:')) {
            // Replace existing icon
            updatedDefinition = originalDefinition.replace(/icon:\w+/, `icon:${newIconCode}`);
        } else {
            // Add icon to node definition
            const nodeIdPart = match[1];
            const labelPart = match[2];
            const startBracket = labelPart[0];
            const endBracket = labelPart[labelPart.length - 1];

            // Remove quotes if present
            let labelContent = labelPart.substring(1, labelPart.length - 1);
            const hasQuotes = labelContent.startsWith('"') && labelContent.endsWith('"');
            if (hasQuotes) {
                labelContent = labelContent.substring(1, labelContent.length - 1);
            }

            // Add icon to the beginning of the content
            const newInnerContent = `icon:${newIconCode} ${labelContent}`;
            const newQuotedContent = hasQuotes ? `"${newInnerContent}"` : newInnerContent;
            updatedDefinition = `${nodeIdPart}${startBracket}${newQuotedContent}${endBracket}`;
        }

        if (originalDefinition !== updatedDefinition) {
            setCode(code.replace(originalDefinition, updatedDefinition));
        }
    }
    setIsIconPickerOpen(false);
    setEditingNodeId(null);
  }, [code, editingNodeId, setCode]);
  
  const handleOpenTextEditor = useCallback((nodeId: string, currentText: string) => {
    setEditingTextNodeId(nodeId);
    setEditingText(currentText);
    setIsTextEditorOpen(true);
  }, []);
  
  const handleTextSave = useCallback(() => {
      if (!editingTextNodeId) return;
      const nodeDefRegex = new RegExp(`(\\b${editingTextNodeId}\\b)(\\[[\\s\\S]*?\\]|\\([\\s\\S]*?\\)|\\{[\\s\\S]*?\\]|>[\\s\\S]*?\\])`);
      const match = code.match(nodeDefRegex);

      if (match) {
          const originalDefinition = match[0];
          const nodeIdPart = match[1];
          const labelPart = match[2];
          const startBracket = labelPart[0];
          const endBracket = labelPart[labelPart.length - 1];
          
          let labelContent = labelPart.substring(1, labelPart.length - 1);
          const hasQuotes = labelContent.startsWith('"') && labelContent.endsWith('"');
          if (hasQuotes) labelContent = labelContent.substring(1, labelContent.length - 1);

          const iconMatch = labelContent.match(/(icon:\w+)(\s*<br\s*\/?>)?/);
          const iconPart = iconMatch ? iconMatch[0] : '';
          
          const newText = editingText.replace(/\n/g, '<br>');
          const newInnerContent = iconPart ? `${iconPart.trim()} ${newText}` : newText;
          const newQuotedContent = hasQuotes ? `"${newInnerContent}"` : newInnerContent;
          const updatedDefinition = `${nodeIdPart}${startBracket}${newQuotedContent}${endBracket}`;
          
          setCode(code.replace(originalDefinition, updatedDefinition));
      }

      setEditingTextNodeId(null);
      setEditingText('');
      setIsTextEditorOpen(false);
  }, [code, editingText, editingTextNodeId, setCode]);

  const Resizer = () => (
    windowWidth < 768 ? null : (
      <div onMouseDown={handleMouseDown} className="w-3 cursor-col-resize flex items-center justify-center group" role="separator">
          <div className="w-1 h-12 bg-gray-700 group-hover:bg-cyan-400 rounded-full transition-colors duration-200"></div>
      </div>
    )
  );

  return (
    <ErrorBoundary fallback={
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Application Error</h1>
          <p className="text-gray-300 mb-4">The application encountered a critical error.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
          >
            Reload Application
          </button>
        </div>
      </div>
    }>
      <div className="flex flex-col h-screen bg-gray-900 overflow-hidden relative">
        <ErrorBoundary fallback={
          <div className="h-16 bg-gray-800 border-b border-gray-700 flex items-center px-4">
            <span className="text-red-400">Header component failed to load</span>
          </div>
        }>
          <Header />
        </ErrorBoundary>

        <main
          ref={mainContainerRef}
          className="flex-grow grid p-2 sm:p-4 overflow-hidden transition-all duration-300 ease-in-out"
          style={{
              gridTemplateColumns: windowWidth < 768 ? '1fr' : (editorWidth ? `${editorWidth}px 12px 1fr` : '1fr 12px 1fr'),
              gap: windowWidth < 768 ? '12px' : '0',
              gridTemplateRows: windowWidth < 768 ? '1fr 12px 1fr' : '1fr',
              marginRight: isChatOpen && windowWidth >= 768 ? '450px' : '0'
          }}
        >
          <ErrorBoundary fallback={
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <span className="text-red-400">Editor panel failed to load</span>
            </div>
          }>
            <EditorPanel
              onTemplateChange={handleTemplateChange}
              onFormatCode={handleFormatCode}
              onGenerateWithAI={() => setIsAiModalOpen(true)}
              onOpenUploadModal={() => setIsUploadModalOpen(true)}
              onOpenMarketplace={() => setIsMarketplaceOpen(true)}
              onOpenVisualIDE={() => setIsVisualIDEOpen(true)}
              onDiagramTypeChange={handleDiagramTypeChange}
            />
          </ErrorBoundary>

          <Resizer />

          <ErrorBoundary fallback={
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <span className="text-red-400">Preview panel failed to load</span>
            </div>
          }>
            <div id="preview-panel-content">
              <PreviewPanel
                onIconClick={handleOpenIconPicker}
                onTextClick={handleOpenTextEditor}
                onExportSVG={() => handleExport('SVG')}
                onExportPNG={() => handleExport('PNG')}
                onExportPDF={() => handleExport('PDF')}
              />
            </div>
          </ErrorBoundary>
        </main>

        <ErrorBoundary fallback={
          <div className="fixed bottom-4 right-4 bg-red-900 text-white p-3 rounded-lg">
            <span>AI Chat panel failed to load</span>
          </div>
        }>
          <AIChatPanel />
        </ErrorBoundary>

        <ErrorBoundary fallback={
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-red-900 text-white p-4 rounded-lg max-w-md">
              <span>Modal failed to load</span>
            </div>
          </div>
        }>
          <GenerateAIModal
            isOpen={isAiModalOpen}
            onClose={() => setIsAiModalOpen(false)}
            prompt={aiPrompt}
            setPrompt={setAiPrompt}
            onGenerate={handleGenerateWithAI}
            isLoading={isGenerating}
          />
          <UploadIconModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            onSave={addIcons}
            iconSets={allIconSets}
          />
          <IconPickerModal
            isOpen={isIconPickerOpen}
            onClose={() => setIsIconPickerOpen(false)}
            onSelect={handleIconSelect}
            iconSets={allIconSets}
          />
          <TextEditorModal
            isOpen={isTextEditorOpen}
            onClose={() => setIsTextEditorOpen(false)}
            text={editingText}
            setText={setEditingText}
            onSave={handleTextSave}
          />

          {/* Template Marketplace */}
          {isMarketplaceOpen && (
            <ErrorBoundary fallback={
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="bg-red-900 text-white p-4 rounded-lg">
                  <span>Marketplace failed to load</span>
                </div>
              </div>
            }>
              <TemplateMarketplace
                onTemplateSelect={handleTemplateSelect}
                onClose={() => setIsMarketplaceOpen(false)}
              />
            </ErrorBoundary>
          )}

          {/* Visual IDE Modal */}
          {isVisualIDEOpen && (
            <ErrorBoundary fallback={
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="bg-red-900 text-white p-4 rounded-lg">
                  <span>Visual IDE failed to load</span>
                </div>
              </div>
            }>
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-7xl max-h-[90vh] flex flex-col">
                  <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900">Visual Diagram Editor</h3>
                    <button
                      onClick={() => setIsVisualIDEOpen(false)}
                      className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                      &times;
                    </button>
                  </div>
                  <div className="flex-1">
                    <VisualIDE
                      diagramType="venn" // Default to Venn diagrams for now
                      onDiagramChange={handleVisualIDEDiagramChange}
                      initialData={undefined} // Could parse current code here
                    />
                  </div>
                </div>
              </div>
            </ErrorBoundary>
          )}

          {/* Export Configuration Modal */}
          <ExportConfigModal
            isOpen={isExportConfigOpen}
            onClose={() => setIsExportConfigOpen(false)}
            onExport={handleExportWithOptions}
            isExporting={isExporting}
            currentDiagramType={currentDiagramType}
            currentTheme={theme}
            defaultOptions={{
              filename: currentDiagramType || 'diagram'
            }}
          />

          {/* Export Progress Modal */}
          <ExportProgressModal
            isOpen={isExportProgressOpen}
            progress={exportProgress}
            result={exportResult}
            onClose={() => setIsExportProgressOpen(false)}
            onRetry={handleRetryExport}
            onDownload={handleDownloadResult}
          />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
};

// Main App component with ToastProvider wrapper
const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};

export default App;
