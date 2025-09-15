
import React, { useState, useEffect, useRef } from 'react';
import { IconError, IconInfo, IconZoomIn, IconZoomOut, IconResetZoom } from './Icons';
import { useAppStore } from '../store/useAppStore';

interface PreviewPanelProps {
  onIconClick: (nodeId: string) => void;
  onTextClick: (nodeId: string, currentText: string) => void;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ onIconClick, onTextClick }) => {
  const { svg, error } = useAppStore(state => ({ svg: state.svg, error: state.error }));
  const [zoom, setZoom] = useState(1);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.2));
  const handleResetZoom = () => setZoom(1);

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
    <div className="flex flex-col bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
      <div className="p-4 bg-gray-800/70 border-b border-gray-700 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-white">Preview</h2>
        <div className="flex items-center gap-2 text-white">
          <button onClick={handleZoomOut} className="p-2 rounded-md hover:bg-gray-700 transition-colors" aria-label="Zoom out">
            <IconZoomOut />
          </button>
          <span className="text-sm font-medium text-gray-300 w-12 text-center" aria-live="polite">{Math.round(zoom * 100)}%</span>
          <button onClick={handleZoomIn} className="p-2 rounded-md hover:bg-gray-700 transition-colors" aria-label="Zoom in">
            <IconZoomIn />
          </button>
          <button onClick={handleResetZoom} className="p-2 rounded-md hover:bg-gray-700 transition-colors" title="Reset Zoom" aria-label="Reset zoom">
            <IconResetZoom />
          </button>
        </div>
      </div>
      <div ref={previewRef} className="flex-grow p-6 flex items-center justify-center bg-gray-200/5 backdrop-blur-sm overflow-auto">
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
  );
};

export default PreviewPanel;
