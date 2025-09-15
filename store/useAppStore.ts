
import { create } from 'zustand';
import { DIAGRAM_TEMPLATES, ALL_ICON_SETS_KEY, DEFAULT_ICON_SETS } from '../constants';
import type { IconSet, ChatMessage } from '../types';
// History functionality implemented directly in store
import { merge } from 'lodash';

// Declare mermaid for TypeScript since it's loaded from a CDN
declare const mermaid: any;

export interface HistoryState {
  state: string;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
}

export interface AppState {
  code: string;
  history: HistoryState;
  theme: string;
  fontFamily: string;
  iconSet: string;
  svg: string;
  error: string | null;
  allIconSets: Record<string, IconSet>;
  isGenerating: boolean;
  isFormatting: boolean;
  isChatOpen: boolean;
  chatHistory: ChatMessage[];
  isChatProcessing: boolean;
  // Export settings
  exportBackgroundMode: 'white' | 'transparent' | 'theme' | 'custom';
  exportBackgroundColor: string; // used when mode = custom
  exportFileName: string; // base name without extension
}

export interface AppActions {
  // Code and History
  setCode: (code: string, fromHistory?: boolean) => void;
  undo: () => void;
  redo: () => void;
  // Settings
  setTheme: (theme: string) => void;
  setFontFamily: (font: string) => void;
  setIconSet: (iconSet: string) => void;
  // Output
  setSvg: (svg: string) => void;
  setError: (error: string | null) => void;
  // Icons
  loadIconSets: () => void;
  saveIconSets: (sets: Record<string, IconSet>) => void;
  addIcons: (newIcons: Record<string, string>, vendor: string) => void;
  // AI
  setIsGenerating: (isGenerating: boolean) => void;
  setIsFormatting: (isFormatting: boolean) => void;
  // Chat
  toggleChat: () => void;
  setChatHistory: (history: ChatMessage[]) => void;
  addChatMessage: (message: ChatMessage) => void;
  streamToLastMessage: (chunk: string) => void;
  setIsChatProcessing: (isProcessing: boolean) => void;
  // App initialization
  initializeFromUrl: () => void;
  // Export settings actions
  setExportBackgroundMode: (mode: 'white' | 'transparent' | 'theme' | 'custom') => void;
  setExportBackgroundColor: (color: string) => void;
  setExportFileName: (name: string) => void;
}

export const useAppStore = create<AppState & AppActions>((set, get) => {
  const initialCode = DIAGRAM_TEMPLATES.find(t => t.name === 'Cisco Collaboration Architecture')?.code ?? DIAGRAM_TEMPLATES[0].code;

  // History state
  let history: string[] = [initialCode];
  let historyIndex: number = 0;
  
  const saveIconSetsToLocalStorage = (sets: Record<string, IconSet>) => {
    try {
      localStorage.setItem(ALL_ICON_SETS_KEY, JSON.stringify(sets));
    } catch (err) {
      console.error("Failed to save icon sets to local storage:", err);
    }
  };

  return {
    code: history[historyIndex],
    history: {
      state: history[historyIndex],
      canUndo: historyIndex > 0,
      canRedo: historyIndex < history.length - 1,
      undo: () => {
        if (historyIndex > 0) {
          historyIndex--;
          set({ code: history[historyIndex] });
        }
      },
      redo: () => {
        if (historyIndex < history.length - 1) {
          historyIndex++;
          set({ code: history[historyIndex] });
        }
      }
    },
    theme: 'documentation-light',
    fontFamily: 'sans-serif',
    iconSet: 'cisco',
    svg: '',
    error: null,
    allIconSets: DEFAULT_ICON_SETS,
    isGenerating: false,
    isFormatting: false,
    isChatOpen: false,
    chatHistory: [],
    isChatProcessing: false,
  exportBackgroundMode: 'white',
  exportBackgroundColor: '#ffffff',
  exportFileName: 'diagram',

    setCode: (newCode, fromHistory = false) => {
        try {
            if (typeof newCode !== 'string') {
                console.error('setCode: newCode must be a string', newCode);
                return;
            }

            if (fromHistory) {
                // Internal call from undo/redo, just update the state
                set({ code: newCode });
            } else {
                // User or AI action, create new history entry
                if (newCode !== history[historyIndex]) {
                  // Remove any future history
                  history = history.slice(0, historyIndex + 1);
                  // Add new state
                  history.push(newCode);
                  historyIndex = history.length - 1;
                  set({ code: newCode });
                }
            }
        } catch (error) {
            console.error('Error in setCode:', error);
            set({ error: `Failed to update code: ${error.message}` });
        }
    },
    undo: () => {
      try {
        if (historyIndex > 0) {
          historyIndex--;
          set({ code: history[historyIndex] });
        }
      } catch (error) {
        console.error('Error in undo:', error);
        set({ error: `Failed to undo: ${error.message}` });
      }
    },
    redo: () => {
      try {
        if (historyIndex < history.length - 1) {
          historyIndex++;
          set({ code: history[historyIndex] });
        }
      } catch (error) {
        console.error('Error in redo:', error);
        set({ error: `Failed to redo: ${error.message}` });
      }
    },
    setTheme: (theme) => set({ theme }),
    setFontFamily: (font) => set({ fontFamily: font }),
    setIconSet: (iconSet) => set({ iconSet }),
    setSvg: (svg) => set({ svg }),
    setError: (error) => set({ error }),
    loadIconSets: () => {
        try {
            const savedIconSets = localStorage.getItem(ALL_ICON_SETS_KEY);
            if (savedIconSets) {
                const parsedIconSets = JSON.parse(savedIconSets);
                const mergedSets = merge({}, DEFAULT_ICON_SETS, parsedIconSets);
                set({ allIconSets: mergedSets });
            }
        } catch (err) {
            console.error("Failed to load icon sets from local storage:", err);
            set({ allIconSets: DEFAULT_ICON_SETS });
        }
    },
    saveIconSets: (sets) => {
        set({ allIconSets: sets });
        saveIconSetsToLocalStorage(sets);
    },
    addIcons: (newIcons, vendor) => {
        set(state => {
            const newSets = { ...state.allIconSets };
            if (!newSets[vendor]) {
                newSets[vendor] = { name: vendor.charAt(0).toUpperCase() + vendor.slice(1), icons: {} };
            }
            const updatedIcons = { ...newSets[vendor].icons, ...newIcons };
            newSets[vendor] = { ...newSets[vendor], icons: updatedIcons };
            saveIconSetsToLocalStorage(newSets);
            return { allIconSets: newSets };
        });
    },
    setIsGenerating: (isGenerating) => set({ isGenerating }),
    setIsFormatting: (isFormatting) => set({ isFormatting }),
    toggleChat: () => set(state => ({ isChatOpen: !state.isChatOpen })),
    setChatHistory: (history) => set({ chatHistory: history }),
    addChatMessage: (message) => set(state => ({ chatHistory: [...state.chatHistory, message] })),
    streamToLastMessage: (chunk) => {
        set(state => {
            const newHistory = [...state.chatHistory];
            const lastMessage = newHistory[newHistory.length - 1];
            if (lastMessage && lastMessage.role === 'model') {
                lastMessage.parts[0].text += chunk;
            }
            return { chatHistory: newHistory };
        });
    },
    setIsChatProcessing: (isProcessing) => set({ isChatProcessing: isProcessing }),
    initializeFromUrl: () => {
        if (typeof window !== 'undefined' && window.location.hash.startsWith('#data=')) {
            try {
                const base64Data = window.location.hash.substring(6);
                const decodedData = atob(base64Data);
                const parsedState = JSON.parse(decodedData);

                const { code, theme, fontFamily, iconSet } = parsedState;
                if (code) get().setCode(code);
                if (theme) set({ theme });
                if (fontFamily) set({ fontFamily });
                if (iconSet) set({ iconSet });
                
                // Clear the hash to prevent re-loading on refresh
                window.history.replaceState(null, '', ' ');

            } catch (e) {
                console.error("Failed to parse state from URL hash", e);
            }
        }
    },
    setExportBackgroundMode: (mode) => set({ exportBackgroundMode: mode }),
    setExportBackgroundColor: (color) => set({ exportBackgroundColor: color }),
    setExportFileName: (name) => set({ exportFileName: name || 'diagram' })
  };
});
