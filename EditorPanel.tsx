
import React, { useState, useCallback } from 'react';
import { DIAGRAM_TEMPLATES, THEMES, FONT_FAMILIES } from '../constants';
import type { DiagramTemplate, IconSet } from '../types';
import { useAppStore } from '../store/useAppStore';
import MonacoEditor from './MonacoEditor';
import { 
    IconDownload, IconClipboard, IconPNG, IconPDF, IconSparkles, 
    IconInfoCircle, IconMagicWand, IconUpload, IconChat, IconUndo, IconRedo, IconShare 
} from './Icons';

interface EditorPanelProps {
  onTemplateChange: (template: DiagramTemplate) => void;
  onExportSVG: () => void;
  onExportPNG: () => void;
  onExportPDF: () => void;
  onFormatCode: () => void;
  onGenerateWithAI: () => void;
  onOpenUploadModal: () => void;
}

const EditorPanel: React.FC<EditorPanelProps> = ({
  onTemplateChange,
  onExportSVG,
  onExportPNG,
  onExportPDF,
  onFormatCode,
  onGenerateWithAI,
  onOpenUploadModal,
}) => {
  const { 
    code, setCode, theme, setTheme, fontFamily, setFontFamily, iconSet, setIconSet,
    undo, redo, history, allIconSets, isFormatting, toggleChat 
  } = useAppStore(state => ({
    code: state.code,
    setCode: state.setCode,
    theme: state.theme,
    setTheme: state.setTheme,
    fontFamily: state.fontFamily,
    setFontFamily: state.setFontFamily,
    iconSet: state.iconSet,
    setIconSet: state.setIconSet,
    undo: state.undo,
    redo: state.redo,
    history: state.history,
    allIconSets: state.allIconSets,
    isFormatting: state.isFormatting,
    toggleChat: state.toggleChat
  }));
  
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isShareCopied, setIsShareCopied] = useState<boolean>(false);

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  }, [code]);
  
  const handleShare = useCallback(() => {
    const stateToShare = { code, theme, fontFamily, iconSet };
    const jsonState = JSON.stringify(stateToShare);
    const base64State = btoa(jsonState);
    const url = `${window.location.origin}${window.location.pathname}#data=${base64State}`;
    navigator.clipboard.writeText(url).then(() => {
        setIsShareCopied(true);
        setTimeout(() => setIsShareCopied(false), 2000);
    });
  }, [code, theme, fontFamily, iconSet]);

  const showIconHelp = () => {
    if (!iconSet || iconSet === 'none' || !allIconSets[iconSet]) {
        alert("No icon set selected. Select a set to see available icon codes.");
        return;
    }
    const availableIcons = Object.keys(allIconSets[iconSet].icons).join('\n');
    alert(`Available icons for ${allIconSets[iconSet].name}:\n\n${availableIcons}\n\nUse them in your node labels like this:\n[icon:ICON_NAME Your Label Text]`);
  };

  return (
    <div className="flex flex-col bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
      <div className="p-4 flex flex-wrap items-center justify-between gap-4 bg-gray-800/70 border-b border-gray-700">
        {/* Row 1: Templates and display options */}
        <div className="flex items-center gap-2">
            <label htmlFor="template-select" className="text-sm font-medium text-gray-300">Template:</label>
            <select
                id="template-select"
                onChange={(e) => onTemplateChange(DIAGRAM_TEMPLATES.find(t => t.name === e.target.value) as DiagramTemplate)}
                defaultValue={DIAGRAM_TEMPLATES.find(t => t.name === 'Cisco Collaboration Architecture')?.name}
                className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2"
            >
                {DIAGRAM_TEMPLATES.map((template) => (
                <option key={template.name} value={template.name}>
                    {template.name}
                </option>
                ))}
            </select>
        </div>
        <div className="flex items-center gap-2">
            <label htmlFor="theme-select" className="text-sm font-medium text-gray-300">Theme:</label>
            <select
                id="theme-select"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2"
            >
                {THEMES.map((themeName) => (
                <option key={themeName} value={themeName}>
                    {themeName.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </option>
                ))}
            </select>
        </div>
         <div className="flex items-center gap-2">
            <label htmlFor="font-select" className="text-sm font-medium text-gray-300">Font:</label>
            <select
                id="font-select"
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2"
            >
                {FONT_FAMILIES.map((font) => (
                <option key={font} value={font}>
                    {font}
                </option>
                ))}
            </select>
        </div>
        <div className="flex items-center gap-2">
            <label htmlFor="icon-set-select" className="text-sm font-medium text-gray-300">Icon Set:</label>
            <select
                id="icon-set-select"
                value={iconSet}
                onChange={(e) => setIconSet(e.target.value)}
                className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2"
            >
                <option value="none">None</option>
                {Object.keys(allIconSets).sort((a,b) => a.localeCompare(b)).map((key) => (
                    <option key={key} value={key}>{allIconSets[key].name}</option>
                ))}
            </select>
            {iconSet !== 'none' && (
                <button onClick={showIconHelp} className="text-gray-400 hover:text-cyan-400" aria-label="Show icon codes">
                    <IconInfoCircle />
                </button>
            )}
            <button
                onClick={onOpenUploadModal}
                className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                title="Upload Custom Icons"
            >
                <IconUpload />
            </button>
        </div>

        {/* Row 2: History and actions */}
        <div className='w-full flex justify-between items-center gap-3 flex-wrap'>
          <div className="flex items-center gap-2">
            <button onClick={undo} disabled={!history.canUndo} className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed" title="Undo (Ctrl+Z)"><IconUndo /></button>
            <button onClick={redo} disabled={!history.canRedo} className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed" title="Redo (Ctrl+Y)"><IconRedo /></button>
             <button onClick={handleShare} className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2" title="Share URL">
                <IconShare />
                <span className="text-xs">{isShareCopied ? 'Copied!' : 'Share'}</span>
            </button>
          </div>
           <div className="flex items-center gap-2">
              <button
                onClick={onGenerateWithAI}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-500 transition-colors"
              >
                <IconMagicWand />
                Generate...
              </button>
              <button
                onClick={toggleChat}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-500 transition-colors"
              >
                <IconChat />
                AI Co-pilot
              </button>
              <button
                onClick={onFormatCode}
                disabled={isFormatting}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
              >
                <IconSparkles />
                {isFormatting ? 'Formatting...' : 'Format'}
              </button>
           </div>
        </div>
      </div>
      <div className="flex-grow relative">
        <MonacoEditor value={code} onChange={setCode} theme={theme} />
      </div>
      <div className="p-3 bg-gray-800/70 border-t border-gray-700 flex justify-end items-center gap-3 flex-wrap">
        <button
          onClick={handleCopyCode}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-500 transition-colors"
        >
          <IconClipboard />
          {isCopied ? 'Copied!' : 'Copy Code'}
        </button>
        <button
          onClick={onExportSVG}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-500 transition-colors"
        >
          <IconDownload />
          SVG
        </button>
        <button
          onClick={onExportPNG}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-500 transition-colors"
        >
          <IconPNG />
          PNG
        </button>
        <button
          onClick={onExportPDF}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-500 transition-colors"
        >
          <IconPDF />
          PDF
        </button>
      </div>
    </div>
  );
};

export default EditorPanel;
