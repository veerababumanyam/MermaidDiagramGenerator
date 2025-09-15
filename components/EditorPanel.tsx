import React, { useState, useCallback, useEffect } from 'react';
import { DIAGRAM_TEMPLATES, THEMES, FONT_FAMILIES } from '../constants';
import type { DiagramTemplate, IconSet } from '../types';
import { useAppStore } from '../store/useAppStore';
import { diagramPluginManager } from '../src/plugins/diagrams/PluginManager';
import MonacoEditor from './MonacoEditor';
import {
    IconClipboard, IconSparkles,
    IconInfoCircle, IconMagicWand, IconUpload, IconChat, IconUndo, IconRedo, IconShare,
    IconStore, IconWand
} from './Icons';

interface EditorPanelProps {
  onTemplateChange: (template: DiagramTemplate) => void;
  onFormatCode: () => void;
  onGenerateWithAI: () => void;
  onOpenUploadModal: () => void;
  onOpenMarketplace: () => void;
  onOpenVisualIDE: () => void;
  onDiagramTypeChange?: (type: string) => void;
}

const EditorPanel: React.FC<EditorPanelProps> = ({
  onTemplateChange,
  onFormatCode,
  onGenerateWithAI,
  onOpenUploadModal,
  onOpenMarketplace,
  onOpenVisualIDE,
  onDiagramTypeChange,
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
  const [availableDiagramTypes, setAvailableDiagramTypes] = useState<string[]>([]);
  const [currentDiagramType, setCurrentDiagramType] = useState<string>('flowchart');

  // Load available diagram types from plugins
  useEffect(() => {
    const plugins = diagramPluginManager.getAll();
    const types = ['flowchart', 'graph', ...plugins.map(plugin => plugin.type)];
    const uniqueTypes = [...new Set(types)];
    setAvailableDiagramTypes(uniqueTypes);
  }, []);

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
    <div className="flex flex-col bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700 h-full">
      <div className="p-3 sm:p-4 space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 bg-gray-800/70 border-b border-gray-700">
        {/* Row 1: Templates and display options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 w-full sm:w-auto">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label htmlFor="template-select" className="text-xs sm:text-sm font-medium text-gray-300">Template:</label>
              <select
                  id="template-select"
                  onChange={(e) => onTemplateChange(DIAGRAM_TEMPLATES.find(t => t.name === e.target.value) as DiagramTemplate)}
                  defaultValue={DIAGRAM_TEMPLATES.find(t => t.name === 'Cisco Collaboration Architecture')?.name}
                  className="bg-gray-700 border border-gray-600 text-white text-xs sm:text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2 min-w-0"
              >
                  {DIAGRAM_TEMPLATES.map((template) => (
                  <option key={template.name} value={template.name}>
                      {template.name}
                  </option>
                  ))}
              </select>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label htmlFor="diagram-type-select" className="text-xs sm:text-sm font-medium text-gray-300">Type:</label>
              <select
                  id="diagram-type-select"
                  value={currentDiagramType}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setCurrentDiagramType(newType);
                    onDiagramTypeChange?.(newType);
                  }}
                  className="bg-gray-700 border border-gray-600 text-white text-xs sm:text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2 min-w-0"
              >
                  {availableDiagramTypes.map((type) => (
                  <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                  ))}
              </select>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label htmlFor="theme-select" className="text-xs sm:text-sm font-medium text-gray-300">Theme:</label>
              <select
                  id="theme-select"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="bg-gray-700 border border-gray-600 text-white text-xs sm:text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2 min-w-0"
              >
                  {THEMES.map((themeName) => (
                  <option key={themeName} value={themeName}>
                      {themeName.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </option>
                  ))}
              </select>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label htmlFor="font-select" className="text-xs sm:text-sm font-medium text-gray-300">Font:</label>
              <select
                  id="font-select"
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="bg-gray-700 border border-gray-600 text-white text-xs sm:text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2 min-w-0"
              >
                  {FONT_FAMILIES.map((font) => (
                  <option key={font} value={font}>
                      {font}
                  </option>
                  ))}
              </select>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label htmlFor="icon-set-select" className="text-xs sm:text-sm font-medium text-gray-300">Icon Set:</label>
              <div className="flex items-center gap-2 min-w-0">
                <select
                    id="icon-set-select"
                    value={iconSet}
                    onChange={(e) => setIconSet(e.target.value)}
                    className="bg-gray-700 border border-gray-600 text-white text-xs sm:text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2 flex-1 min-w-0"
                >
                    <option value="none">None</option>
                    {Object.keys(allIconSets).sort((a,b) => a.localeCompare(b)).map((key) => (
                        <option key={key} value={key}>{allIconSets[key].name}</option>
                    ))}
                </select>
                {iconSet !== 'none' && (
                    <button onClick={showIconHelp} className="text-gray-400 hover:text-cyan-400 flex-shrink-0" aria-label="Show icon codes">
                        <IconInfoCircle />
                    </button>
                )}
                <button
                    onClick={onOpenUploadModal}
                    className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex-shrink-0"
                    title="Upload Custom Icons"
                >
                    <IconUpload />
                </button>
              </div>
          </div>
        </div>

        {/* Row 2: History and actions */}
        <div className='w-full space-y-3 sm:space-y-0 sm:flex sm:justify-between sm:items-center sm:gap-3'>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={undo} disabled={!history.canUndo} className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed" title="Undo (Ctrl+Z)"><IconUndo /></button>
            <button onClick={redo} disabled={!history.canRedo} className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed" title="Redo (Ctrl+Y)"><IconRedo /></button>
            <button onClick={handleShare} className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2" title="Share URL">
                <IconShare />
                <span className="text-xs hidden sm:inline">{isShareCopied ? 'Copied!' : 'Share'}</span>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-2">
              <button
                onClick={onGenerateWithAI}
                className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-500 transition-colors min-w-[120px]"
              >
                <IconMagicWand />
                <span className="hidden sm:inline">Generate...</span>
                <span className="sm:hidden">Generate</span>
              </button>
              <button
                onClick={toggleChat}
                className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-500 transition-colors min-w-[120px]"
              >
                <IconChat />
                <span className="hidden sm:inline">AI Co-pilot</span>
                <span className="sm:hidden">AI Chat</span>
              </button>
              <button
                onClick={onOpenMarketplace}
                className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-500 transition-colors min-w-[120px]"
              >
                <IconStore />
                <span className="hidden sm:inline">Marketplace</span>
                <span className="sm:hidden">Market</span>
              </button>
              <button
                onClick={onOpenVisualIDE}
                className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-500 transition-colors min-w-[120px]"
              >
                <IconWand />
                <span className="hidden sm:inline">Visual IDE</span>
                <span className="sm:hidden">Visual</span>
              </button>
              <button
                onClick={onFormatCode}
                disabled={isFormatting}
                className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed min-w-[120px]"
              >
                <IconSparkles />
                <span className="hidden sm:inline">{isFormatting ? 'Formatting...' : 'Format'}</span>
                <span className="sm:hidden">Format</span>
              </button>
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0 relative overflow-hidden">
        <MonacoEditor value={code} onChange={setCode} theme={theme} />
      </div>
      <div className="p-3 bg-gray-800/70 border-t border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <button
            onClick={handleCopyCode}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-500 transition-colors min-w-[120px]"
          >
            <IconClipboard />
            <span className="hidden sm:inline">{isCopied ? 'Copied!' : 'Copy Code'}</span>
            <span className="sm:hidden">Copy</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditorPanel;