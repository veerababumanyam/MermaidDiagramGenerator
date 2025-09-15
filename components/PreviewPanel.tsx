import React, { useState, useEffect, useRef } from 'react';
import PerfectScrollbar from 'perfect-scrollbar';
import 'perfect-scrollbar/css/perfect-scrollbar.css';
import '../src/components/PreviewPanel.css';
import { IconError, IconInfo, IconZoomIn, IconZoomOut, IconResetZoom, IconDownload, IconPNG, IconPDF } from './Icons';
import { useAppStore } from '../store/useAppStore';

interface PreviewPanelProps {
  onIconClick: (nodeId: string) => void;
  onTextClick: (nodeId: string, currentText: string) => void;
  onExportSVG?: () => void;
  onExportPNG?: () => void;
  onExportPDF?: () => void;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  onIconClick,
  onTextClick,
  onExportSVG,
  onExportPNG,
  onExportPDF
}) => {
  const { svg, error, exportBackgroundMode, exportBackgroundColor, exportFileName, setExportBackgroundMode, setExportBackgroundColor, setExportFileName } = useAppStore(state => ({
    svg: state.svg,
    error: state.error,
    exportBackgroundMode: state.exportBackgroundMode,
    exportBackgroundColor: state.exportBackgroundColor,
    exportFileName: state.exportFileName,
    setExportBackgroundMode: state.setExportBackgroundMode,
    setExportBackgroundColor: state.setExportBackgroundColor,
    setExportFileName: state.setExportFileName
  }));
  const [zoom, setZoom] = useState(1);
  const previewRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const perfectScrollbarRef = useRef<PerfectScrollbar | null>(null);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.2));
  const handleResetZoom = () => setZoom(1);

  // Initialize Perfect Scrollbar
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    // Initialize Perfect Scrollbar
    perfectScrollbarRef.current = new PerfectScrollbar(scrollContainer, {
      wheelSpeed: 2,
      wheelPropagation: true,
      minScrollbarLength: 20,
      swipeEasing: true,
      suppressScrollX: false,
      suppressScrollY: false,
    });

    console.log('Perfect Scrollbar initialized on container:', scrollContainer);
    console.log('Container dimensions:', {
      width: scrollContainer.offsetWidth,
      height: scrollContainer.offsetHeight,
      scrollWidth: scrollContainer.scrollWidth,
      scrollHeight: scrollContainer.scrollHeight
    });

    // Update scrollbar on window resize
    const handleResize = () => {
      if (perfectScrollbarRef.current) {
        perfectScrollbarRef.current.update();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (perfectScrollbarRef.current) {
        perfectScrollbarRef.current.destroy();
        perfectScrollbarRef.current = null;
      }
    };
  }, []);

  // Update scrollbar when content or zoom changes
  useEffect(() => {
    if (perfectScrollbarRef.current) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        perfectScrollbarRef.current?.update();
      }, 50);
    }
  }, [svg, zoom, error]);

  useEffect(() => {
    const container = previewRef.current;
    if (!container || !svg) return;

    const svgElement = container.querySelector('svg');
    if (!svgElement) return;

    // Add classes to make elements interactive
    svgElement.querySelectorAll('.node img').forEach(icon => {
      icon.classList.add('clickable-icon');
    });
    svgElement.querySelectorAll('.node .nodeLabel').forEach(label => {
      label.classList.add('clickable-text');
    });

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Element;

      // Icon click handling
      const iconElement = target.closest('.clickable-icon');
      if (iconElement) {
        const nodeElement = iconElement.closest('.node');
        if (nodeElement && nodeElement.id) {
          event.stopPropagation();
          onIconClick(nodeElement.id);
          return;
        }
      }

      // Text click handling
      const textElement = target.closest('.clickable-text');
      if (textElement) {
        const nodeElement = textElement.closest('.node');
        if (nodeElement && nodeElement.id) {
          event.stopPropagation();

          const clonedLabel = textElement.cloneNode(true) as HTMLElement;

          const imgInLabel = clonedLabel.querySelector('img');
          if (imgInLabel) {
            const nextBr = imgInLabel.nextElementSibling;
            if (nextBr && nextBr.tagName.toLowerCase() === 'br') {
              nextBr.remove();
            }
            imgInLabel.remove();
          }

          clonedLabel.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
          const currentText = (clonedLabel.textContent || '').trim();

          onTextClick(nodeElement.id, currentText);
        }
      }
    };

    container.addEventListener('click', handleClick);

    return () => {
      container.removeEventListener('click', handleClick);
    };
  }, [svg, onIconClick, onTextClick]);


  return (
    <div className="flex flex-col bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700 h-full">
      {/* Header with zoom controls and export buttons */}
      <div className="p-3 sm:p-4 bg-gray-800/70 border-b border-gray-700">
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Title and zoom controls */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
            <h2 className="text-base sm:text-lg font-semibold text-white">Preview</h2>
            <div className="flex items-center justify-center gap-1 sm:gap-2 text-white">
              <button onClick={handleZoomOut} className="p-1.5 sm:p-2 rounded-md hover:bg-gray-700 transition-colors" aria-label="Zoom out">
                <IconZoomOut />
              </button>
              <span className="text-xs sm:text-sm font-medium text-gray-300 w-10 sm:w-12 text-center" aria-live="polite">{Math.round(zoom * 100)}%</span>
              <button onClick={handleZoomIn} className="p-1.5 sm:p-2 rounded-md hover:bg-gray-700 transition-colors" aria-label="Zoom in">
                <IconZoomIn />
              </button>
              <button onClick={handleResetZoom} className="p-1.5 sm:p-2 rounded-md hover:bg-gray-700 transition-colors" title="Reset Zoom" aria-label="Reset zoom">
                <IconResetZoom />
              </button>
            </div>
          </div>

          {/* Export controls */}
          {svg && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2">
                <span className="text-xs sm:text-sm text-gray-400 mr-2">Export:</span>
                <button
                  onClick={onExportSVG}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-500 transition-colors min-w-[80px]"
                  title="Export as SVG"
                >
                  <IconDownload />
                  <span className="hidden sm:inline">SVG</span>
                </button>
                <button
                  onClick={onExportPNG}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-500 transition-colors min-w-[80px]"
                  title="Export as PNG"
                >
                  <IconPNG />
                  <span className="hidden sm:inline">PNG</span>
                </button>
                <button
                  onClick={onExportPDF}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-500 transition-colors min-w-[80px]"
                  title="Export as PDF"
                >
                  <IconPDF />
                  <span className="hidden sm:inline">PDF</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex flex-col">
                  <label className="text-xs text-gray-400">Filename</label>
                  <input
                    type="text"
                    value={exportFileName}
                    onChange={(e) => setExportFileName(e.target.value.replace(/\.[a-zA-Z0-9]+$/,''))}
                    className="bg-gray-700 text-white text-xs px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="diagram"
                    aria-label="Export file name"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-400">Background</label>
                  <select
                    value={exportBackgroundMode}
                    onChange={(e) => setExportBackgroundMode(e.target.value as any)}
                    className="bg-gray-700 text-white text-xs px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Export background mode"
                  >
                    <option value="white">White</option>
                    <option value="transparent">Transparent</option>
                    <option value="theme">Theme</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                {exportBackgroundMode === 'custom' && (
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-400">Color</label>
                    <input
                      type="color"
                      value={exportBackgroundColor}
                      onChange={(e) => setExportBackgroundColor(e.target.value)}
                      className="w-10 h-8 bg-gray-700 rounded cursor-pointer"
                      aria-label="Custom background color"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <div
        ref={scrollContainerRef}
        className="flex-grow p-3 sm:p-6 bg-gray-200/5 backdrop-blur-sm perfect-scrollbar-container"
        style={{
          position: 'relative',
          overflow: 'hidden',
          height: '100%',
          width: '100%',
          minHeight: '200px'
        }}
      >
        <div
          ref={previewRef}
          className="flex items-center justify-center min-h-full"
          style={{
            minWidth: 'fit-content',
            minHeight: 'fit-content',
            width: 'max-content',
            height: 'max-content'
          }}
        >
        {error && (
          <div className="flex flex-col items-center justify-center text-center text-red-400 bg-red-900/50 p-6 rounded-lg border border-red-700 max-w-full">
            <IconError />
            <h3 className="mt-4 text-xl font-bold">Diagram Error</h3>
            <pre className="mt-2 text-sm font-mono text-red-300 whitespace-pre-wrap text-left">{error}</pre>
          </div>
        )}
        {!error && svg && (
          <div 
            className="flex items-center justify-center transition-transform duration-150 ease-in-out" 
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center', width: '100%', height: '100%' }}
            dangerouslySetInnerHTML={{ __html: svg }} 
          />
        )}
        {!error && !svg && (
            <div className="flex flex-col items-center justify-center text-center text-gray-400">
                <IconInfo />
                <p className="mt-4 text-lg">Your diagram will appear here.</p>
                <p className="text-sm">Start typing or select a template.</p>
            </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default PreviewPanel;