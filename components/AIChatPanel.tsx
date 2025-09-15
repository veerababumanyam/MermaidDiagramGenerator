
import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { IconMagicWand, IconChat, IconLightbulb, IconCheck } from './Icons';
import type { AISuggestion } from '../types/ai';

interface AIChatPanelProps {
  enhancedAICopilot?: {
    coPilotState: any;
    isProcessing: boolean;
    sendMessage: (message: string) => Promise<void>;
    applySuggestion: (suggestion: AISuggestion) => Promise<void>;
    toggleActive: () => void;
    clearConversation: () => void;
    hasActiveConversation: boolean;
    unreadSuggestions: number;
  };
}

const AIChatPanel: React.FC<AIChatPanelProps> = ({ enhancedAICopilot }) => {
  const { isChatOpen, toggleChat } = useAppStore();
  
  // Provide default values if enhancedAICopilot is not available
  const defaultCopilot = {
    coPilotState: { conversation: { messages: [] }, suggestions: [] },
    isProcessing: false,
    sendMessage: async (message: string) => console.log('Sent:', message),
    applySuggestion: async (suggestion: AISuggestion) => console.log('Applied:', suggestion),
    clearConversation: () => console.log('Cleared conversation'),
    hasActiveConversation: false,
    unreadSuggestions: 0
  };
  
  const copilot = enhancedAICopilot || defaultCopilot;
  const { coPilotState, isProcessing, sendMessage, applySuggestion, clearConversation, hasActiveConversation, unreadSuggestions } = copilot;
  const [prompt, setPrompt] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [coPilotState.conversation.messages]);

  const handleSend = () => {
    if (prompt.trim()) {
      sendMessage(prompt);
      setPrompt('');
    }
  };

  const handleApplySuggestion = (suggestion: AISuggestion) => {
    applySuggestion(suggestion);
  };

  return (
    <aside 
      className={`fixed top-0 right-0 h-full bg-gray-800 border-l border-gray-700 shadow-2xl z-40 transition-transform duration-300 ease-in-out flex flex-col ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}`}
      style={{ width: '450px' }}
      aria-hidden={!isChatOpen}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800/80 backdrop-blur-sm">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <IconChat />
            AI Co-pilot
            {unreadSuggestions > 0 && (
              <span className="bg-cyan-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadSuggestions}
              </span>
            )}
        </h2>
        <div className="flex items-center gap-2">
          {hasActiveConversation && (
            <button
              onClick={clearConversation}
              className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded"
              title="Clear conversation"
            >
              Clear
            </button>
          )}
          <button onClick={toggleChat} className="text-gray-400 hover:text-white text-2xl" aria-label="Close AI Co-pilot">&times;</button>
        </div>
      </div>
      
      {/* AI Suggestions Panel */}
      {coPilotState.suggestions.length > 0 && (
        <div className="mb-4 p-3 bg-cyan-900/20 border border-cyan-700/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <IconLightbulb className="text-cyan-400" />
            <span className="text-cyan-400 font-medium text-sm">AI Suggestions</span>
          </div>
          <div className="space-y-2">
            {coPilotState.suggestions.slice(0, 3).map((suggestion) => (
              <div key={suggestion.id} className="flex items-start gap-2 p-2 bg-gray-800/50 rounded">
                <div className="flex-1">
                  <div className="text-sm text-gray-200">{suggestion.title}</div>
                  <div className="text-xs text-gray-400 mt-1">{suggestion.description}</div>
                </div>
                <button
                  onClick={() => handleApplySuggestion(suggestion)}
                  className="px-2 py-1 text-xs bg-cyan-600 hover:bg-cyan-500 text-white rounded flex items-center gap-1"
                  title="Apply suggestion"
                >
                  <IconCheck size={12} />
                  Apply
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-grow overflow-y-auto space-y-4">
        {coPilotState.conversation.messages.map((msg, index) => (
          <div key={msg.id || msg.timestamp} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-md p-3 rounded-lg ${msg.role === 'user' ? 'bg-sky-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
              <div className="text-sm font-sans whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
        {isProcessing && coPilotState.conversation.messages[coPilotState.conversation.messages.length - 1]?.role !== 'assistant' && (
            <div className="flex justify-start">
                <div className="max-w-md p-3 rounded-lg bg-gray-700 text-gray-200">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="e.g., Change layout to top-to-bottom..."
            className="flex-grow p-2 bg-gray-900 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-gray-600 resize-none"
            rows={2}
            disabled={isProcessing}
          />
          <button
            onClick={handleSend}
            className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-sky-500 transition-colors disabled:bg-sky-400 disabled:cursor-not-allowed"
            disabled={isProcessing || !prompt.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AIChatPanel;
