/**
 * Enhanced AI Co-Pilot Hook
 * Advanced AI assistant with context awareness, proactive suggestions, and multi-modal interactions
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '../../../store/useAppStore';
import { GoogleGenAI, Chat } from '@google/genai';
import type {
  AICoPilotState,
  AIConversation,
  AIConversationMessage,
  AIContext,
  AIResponse,
  AISuggestion,
  AIAction,
  AIUserProfile,
  AIPreferences,
  AIInteraction,
  SuggestionType,
  ActionType
} from '../../types/ai';
import { env } from '../../utils/env';

export const useEnhancedAICopilot = () => {
  const store = useAppStore();
  const chatRef = useRef<Chat | null>(null);
  const contextRef = useRef<AIContext>({});

  // Enhanced state management
  const [coPilotState, setCoPilotState] = useState<AICoPilotState>({
    isActive: false,
    conversation: {
      id: '',
      messages: [],
      context: {},
      createdAt: new Date(),
      updatedAt: new Date()
    },
    suggestions: [],
    context: {},
    preferences: {
      autoSuggest: true,
      contextAware: true,
      proactiveHelp: true,
      learningMode: true,
      voiceEnabled: false
    }
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [userProfile, setUserProfile] = useState<AIUserProfile | null>(null);

  // Initialize AI chat with enhanced context
  const initializeChat = useCallback(async () => {
    if (!chatRef.current) {
      const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

      const currentIconSet = store.allIconSets[store.iconSet];
      const availableIcons = currentIconSet ? Object.keys(currentIconSet.icons).join(', ') : 'none';

      const systemInstruction = `You are an advanced AI Co-Pilot for diagram creation and editing. Your capabilities include:

**CORE FUNCTIONS:**
1. **Natural Language Processing**: Understand complex diagram descriptions and convert them to Mermaid code
2. **Contextual Editing**: Modify existing diagrams based on user instructions
3. **Proactive Suggestions**: Provide intelligent recommendations for diagram improvements
4. **Multi-Modal Support**: Handle text, voice, and visual inputs
5. **Learning Adaptation**: Remember user preferences and patterns

**ENHANCED FEATURES:**
- **Smart Auto-Complete**: Predict user intentions and complete partial commands
- **Visual Analysis**: Understand diagram layouts and suggest optimizations
- **Collaborative Intelligence**: Consider team context and shared knowledge
- **Progressive Enhancement**: Start simple, offer advanced features as user engages

**AVAILABLE ICONS**: ${availableIcons}

**RESPONSE FORMAT**:
Always structure responses with:
- Clear, actionable suggestions
- Confidence levels for recommendations
- Alternative approaches when applicable
- Learning from user feedback

**ETHICAL GUIDELINES**:
- Prioritize user intent and accessibility
- Suggest best practices for diagram clarity
- Respect user preferences and avoid overwhelming suggestions
- Maintain professional, helpful tone`;

      chatRef.current = ai.getGenerativeModel({ model: 'gemini-1.5-flash' }).startChat({
        history: [
          {
            role: 'user',
            parts: [{ text: systemInstruction }]
          },
          {
            role: 'model',
            parts: [{ text: 'Understood. I am ready to assist with diagram creation and editing.' }]
          }
        ]
      });

      // Initialize conversation
      const conversationId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setCoPilotState(prev => ({
        ...prev,
        conversation: {
          ...prev.conversation,
          id: conversationId,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }));
    }
  }, [store.iconSet, store.allIconSets]);

  // Update context based on current state
  const updateContext = useCallback(() => {
    const context: AIContext = {
      diagram: store.code ? {
        type: 'mermaid',
        nodes: [], // Would be parsed from code
        edges: [],
        metadata: {
          theme: store.theme,
          iconSet: store.iconSet
        }
      } : undefined,
      userAction: store.code ? 'editing' : 'creating',
      selection: [], // Would be populated from UI selection
      viewport: {
        x: 0,
        y: 0,
        width: 800,
        height: 600,
        zoom: 1
      },
      history: [] // Would be populated from user interaction history
    };

    contextRef.current = context;
    setCoPilotState(prev => ({
      ...prev,
      context
    }));
  }, [store.code, store.theme, store.iconSet]);

  // Generate proactive suggestions based on context
  const generateSuggestions = useCallback(async (): Promise<AISuggestion[]> => {
    if (!store.code || !coPilotState.preferences.autoSuggest) return [];

    try {
      const suggestions: AISuggestion[] = [];

      // Analyze diagram complexity
      const lineCount = store.code.split('\n').length;
      if (lineCount > 20 && !store.code.includes('subgraph')) {
        suggestions.push({
          id: `suggest-${Date.now()}-grouping`,
          type: 'structure',
          title: 'Consider grouping related elements',
          description: 'Your diagram has many elements. Using subgraphs could improve readability.',
          confidence: 0.8,
          action: {
            type: 'generate',
            payload: { type: 'subgraph' },
            description: 'Add subgraph structure'
          }
        });
      }

      // Check for missing icons
      const iconSet = store.allIconSets[store.iconSet];
      if (iconSet && Object.keys(iconSet.icons).length > 0) {
        const hasIcons = store.code.includes('icon:');
        if (!hasIcons) {
          suggestions.push({
            id: `suggest-${Date.now()}-icons`,
            type: 'style',
            title: 'Add visual icons',
            description: `Enhance your diagram with icons from the ${iconSet.name} set.`,
            confidence: 0.6,
            action: {
              type: 'style',
              payload: { target: 'nodes', property: 'icon' },
              description: 'Add icons to nodes'
            }
          });
        }
      }

      // Theme suggestions
      if (store.theme === 'default') {
        suggestions.push({
          id: `suggest-${Date.now()}-theme`,
          type: 'style',
          title: 'Try a professional theme',
          description: 'Professional themes can make your diagrams more suitable for documentation.',
          confidence: 0.5,
          action: {
            type: 'style',
            payload: { target: 'theme', value: 'professional-blue' },
            description: 'Apply professional theme'
          }
        });
      }

      return suggestions;
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return [];
    }
  }, [store.code, store.iconSet, store.allIconSets, store.theme, coPilotState.preferences.autoSuggest]);

  // Enhanced message sending with context awareness
  const sendMessage = useCallback(async (message: string): Promise<void> => {
    if (!message.trim() || isProcessing) return;

    setIsProcessing(true);

    try {
      await initializeChat();

      // Add user message to conversation
      const userMessage: AIConversationMessage = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date()
      };

      setCoPilotState(prev => ({
        ...prev,
        conversation: {
          ...prev.conversation,
          messages: [...prev.conversation.messages, userMessage],
          updatedAt: new Date()
        }
      }));

      // Prepare enhanced prompt with context
      const enhancedPrompt = `
**USER MESSAGE**: "${message}"

**CURRENT CONTEXT**:
- Diagram Type: Mermaid
- Current Code Length: ${store.code.length} characters
- Selected Theme: ${store.theme}
- Icon Set: ${store.iconSet}
- Recent Actions: ${store.history.length > 0 ? 'Has edit history' : 'New diagram'}

**DIAGRAM CODE**:
\`\`\`mermaid
${store.code || '// Empty diagram - ready for creation'}
\`\`\`

**INSTRUCTION**:
Provide a helpful, contextual response. If modifying code, return ONLY the complete updated Mermaid code between \`\`\`mermaid and \`\`\` markers. If suggesting improvements, be specific and actionable.
`;

      const chat = chatRef.current!;
      const result = await chat.sendMessageStream(enhancedPrompt);

      let accumulatedResponse = "";
      let isFirstChunk = true;

      for await (const chunk of result) {
        if (isFirstChunk) {
          const aiMessage: AIConversationMessage = {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: '',
            timestamp: new Date()
          };

          setCoPilotState(prev => ({
            ...prev,
            conversation: {
              ...prev.conversation,
              messages: [...prev.conversation.messages, aiMessage],
              updatedAt: new Date()
            }
          }));

          isFirstChunk = false;
        }

        const chunkText = chunk.text;
        accumulatedResponse += chunkText;

        // Update the last message with streaming content
        setCoPilotState(prev => ({
          ...prev,
          conversation: {
            ...prev.conversation,
            messages: prev.conversation.messages.map((msg, index) =>
              index === prev.conversation.messages.length - 1
                ? { ...msg, content: msg.content + chunkText }
                : msg
            ),
            updatedAt: new Date()
          }
        }));

        // Check for Mermaid code blocks and update diagram
        const mermaidMatch = accumulatedResponse.match(/```mermaid\s*\n([\s\S]*?)\n```/);
        if (mermaidMatch) {
          const mermaidCode = mermaidMatch[1].trim();
          if (mermaidCode && mermaidCode !== store.code) {
            store.setCode(mermaidCode, true);
          }
        }
      }

      // Final validation and suggestions update
      if (accumulatedResponse) {
        const newSuggestions = await generateSuggestions();
        setCoPilotState(prev => ({
          ...prev,
          suggestions: newSuggestions
        }));

        // Update user profile with interaction
        updateUserProfile(message, accumulatedResponse);
      }

    } catch (error) {
      console.error('AI Co-pilot error:', error);

      const errorMessage: AIConversationMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `I apologize, but I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or rephrase your request.`,
        timestamp: new Date()
      };

      setCoPilotState(prev => ({
        ...prev,
        conversation: {
          ...prev.conversation,
          messages: [...prev.conversation.messages, errorMessage],
          updatedAt: new Date()
        }
      }));
    } finally {
      setIsProcessing(false);
    }
  }, [store, isProcessing, initializeChat, generateSuggestions]);

  // Apply suggestion directly
  const applySuggestion = useCallback(async (suggestion: AISuggestion): Promise<void> => {
    if (!suggestion.action) return;

    setIsProcessing(true);

    try {
      switch (suggestion.action.type) {
        case 'style':
          if (suggestion.action.payload.target === 'theme') {
            store.setTheme(suggestion.action.payload.value);
          }
          // Handle other style actions...
          break;

        case 'generate':
          if (suggestion.action.payload.type === 'subgraph') {
            await sendMessage('Add subgraphs to organize this diagram better');
          }
          break;

        default:
          console.log('Suggestion applied:', suggestion.action);
      }

      // Remove applied suggestion
      setCoPilotState(prev => ({
        ...prev,
        suggestions: prev.suggestions.filter(s => s.id !== suggestion.id)
      }));

    } catch (error) {
      console.error('Error applying suggestion:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [store, sendMessage]);

  // Update user profile based on interactions
  const updateUserProfile = useCallback((userMessage: string, aiResponse: string) => {
    const interaction: AIInteraction = {
      id: `interaction-${Date.now()}`,
      type: 'diagram_create', // Could be more specific based on action
      timestamp: new Date(),
      context: contextRef.current,
      result: aiResponse,
      feedback: undefined
    };

    // Update profile with interaction patterns
    setUserProfile(prev => {
      if (!prev) {
        return {
          userId: 'anonymous', // Would be actual user ID in production
          preferences: coPilotState.preferences,
          skills: [],
          history: [interaction],
          patterns: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }

      return {
        ...prev,
        history: [...prev.history.slice(-9), interaction], // Keep last 10 interactions
        updatedAt: new Date()
      };
    });
  }, [coPilotState.preferences]);

  // Toggle co-pilot active state
  const toggleActive = useCallback(() => {
    setCoPilotState(prev => ({
      ...prev,
      isActive: !prev.isActive
    }));
  }, []);

  // Clear conversation
  const clearConversation = useCallback(() => {
    setCoPilotState(prev => ({
      ...prev,
      conversation: {
        id: `conv-${Date.now()}`,
        messages: [],
        context: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }));
  }, []);

  // Update preferences
  const updatePreferences = useCallback((preferences: Partial<AIPreferences>) => {
    setCoPilotState(prev => ({
      ...prev,
      preferences: { ...prev.preferences, ...preferences }
    }));

    // Persist preferences
    localStorage.setItem('ai-copilot-preferences', JSON.stringify({
      ...coPilotState.preferences,
      ...preferences
    }));
  }, [coPilotState.preferences]);

  // Load preferences on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('ai-copilot-preferences');
    if (savedPreferences) {
      try {
        const preferences = JSON.parse(savedPreferences);
        setCoPilotState(prev => ({
          ...prev,
          preferences
        }));
      } catch (error) {
        console.error('Error loading AI preferences:', error);
      }
    }
  }, []);

  // Update context when store changes
  useEffect(() => {
    updateContext();
  }, [updateContext]);

  // Generate suggestions when context changes
  useEffect(() => {
    if (coPilotState.preferences.proactiveHelp) {
      generateSuggestions().then(suggestions => {
        setCoPilotState(prev => ({
          ...prev,
          suggestions
        }));
      });
    }
  }, [generateSuggestions, coPilotState.preferences.proactiveHelp]);

  return {
    // State
    coPilotState,
    isProcessing,
    userProfile,

    // Actions
    sendMessage,
    applySuggestion,
    toggleActive,
    clearConversation,
    updatePreferences,

    // Computed values
    hasActiveConversation: coPilotState.conversation.messages.length > 0,
    unreadSuggestions: coPilotState.suggestions.filter(s => s.confidence > 0.7).length
  };
};
