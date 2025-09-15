/**
 * AI-related type definitions
 */

export interface AISuggestion {
  id: string;
  type: 'improvement' | 'optimization' | 'enhancement' | 'fix';
  title: string;
  description: string;
  confidence: number; // 0-1
  impact: 'low' | 'medium' | 'high';
  code?: string;
  explanation?: string;
  category: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: AISuggestion[];
}

export interface AIConversation {
  id: string;
  messages: AIMessage[];
  context: {
    diagramType?: string;
    currentCode?: string;
    userIntent?: string;
  };
  startedAt: Date;
  lastActivity: Date;
}

export interface AICopilotState {
  isActive: boolean;
  conversation: AIConversation;
  suggestions: AISuggestion[];
  isProcessing: boolean;
  model: string;
  capabilities: string[];
}