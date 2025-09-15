
import React, { useRef, useEffect, useState } from 'react';
import * as monaco from 'monaco-editor';

// Configure Monaco Environment - disable workers to avoid CSP issues in development
// Monaco will run in main thread, which is acceptable for development
self.MonacoEnvironment = {
  getWorkerUrl: function () {
    return undefined;
  }
};

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  theme: string;
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({ value, onChange, theme }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoInstance = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);

  useEffect(() => {
    if (editorRef.current && !monacoInstance.current) {
      // Initialize Monaco Editor
      monacoInstance.current = monaco.editor.create(editorRef.current, {
        value: value,
        language: 'markdown', // Using markdown for basic highlighting
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 14,
        fontFamily: 'monospace',
        wordWrap: 'on',
        padding: { top: 16 },
        theme: 'vs-dark', // Start with dark theme
        scrollBeyondLastLine: false,
        readOnly: false,
      });

      monacoInstance.current.onDidChangeModelContent(() => {
        if (monacoInstance.current) {
          onChange(monacoInstance.current.getValue());
        }
      });

      setIsEditorReady(true);
    }

    return () => {
      if (monacoInstance.current) {
        monacoInstance.current.dispose();
        monacoInstance.current = null;
        setIsEditorReady(false);
      }
    };
  }, [onChange]);
  
  // Update editor value if it changes from outside (e.g., undo/redo, AI generation)
  useEffect(() => {
    if (monacoInstance.current && monacoInstance.current.getValue() !== value) {
        monacoInstance.current.setValue(value);
    }
  }, [value]);

  // Update editor theme
  useEffect(() => {
    if (isEditorReady && monacoInstance.current) {
      const monacoTheme = theme.includes('dark') || theme.includes('blue') || theme.includes('forest') ? 'vs-dark' : 'vs';
      monaco.editor.setTheme(monacoTheme);
    }
  }, [theme, isEditorReady]);

  return (
    <div ref={editorRef} className="w-full h-full p-0 bg-gray-900 text-gray-200 font-mono resize-none focus:outline-none" />
  );
};

export default MonacoEditor;
