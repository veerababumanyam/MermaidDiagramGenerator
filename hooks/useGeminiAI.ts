
import { useCallback, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { GoogleGenAI, Chat } from '@google/genai';
import { env } from '../src/utils/env';

// Declare mermaid for TypeScript
declare const mermaid: any;

// Helper function to validate Mermaid code for common issues
const validateMermaidCode = (code: string): string[] => {
    const errors: string[] = [];

    // Check if code starts with valid diagram type
    const validDiagramTypes = /^(graph|flowchart|sequenceDiagram|gantt|classDiagram|stateDiagram|erDiagram|journey|pie|gitGraph)/;
    if (!validDiagramTypes.test(code.trim())) {
        errors.push("Code must start with a valid diagram type (e.g., 'graph TD', 'flowchart LR', 'sequenceDiagram')");
    }

    // Check for incomplete style definitions (missing values after commas)
    const incompleteStyles = code.match(/style\s+\w+[^}]*,\s*$/gm);
    if (incompleteStyles) {
        errors.push("Found incomplete style definitions (missing values after commas)");
    }

    // Check for unbalanced brackets in subgraphs
    const subgraphCount = (code.match(/subgraph/g) || []).length;
    const endCount = (code.match(/end/g) || []).length;
    if (subgraphCount !== endCount) {
        errors.push(`Unbalanced subgraphs: ${subgraphCount} 'subgraph' keywords but ${endCount} 'end' keywords`);
    }

    // Check for incomplete connections (arrows without destinations)
    const incompleteConnections = code.match(/\w+\s*[-=]+>\s*$/gm);
    if (incompleteConnections) {
        errors.push("Found incomplete connection arrows");
    }

    return errors;
};

export const useGeminiAI = () => {
  const store = useAppStore();
  const chatRef = useRef<Chat | null>(null);

  const getChat = useCallback(() => {
    try {
        if (!chatRef.current) {
            if (!env.GEMINI_API_KEY) {
                throw new Error('GEMINI_API_KEY is not configured. Please check your environment variables.');
            }

            const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

            const currentIconSet = store.allIconSets[store.iconSet];
            const availableIcons = currentIconSet ? Object.keys(currentIconSet.icons).join(', ') : 'none';

            const systemInstruction = `You are an expert Mermaid code editor. Your task is to modify the provided Mermaid code based on the user's instruction.
            **CRITICAL REQUIREMENTS:**
            1. **PRESERVE COMPLETENESS:** Maintain the complete diagram structure - ensure all subgraphs are properly closed, all styles are complete, and all connections are valid.
            2. Analyze the user's request (e.g., "add a database", "change layout to LR").
            3. Modify the mermaid code provided in the user prompt to implement the change.
            4. Preserve the existing structure, styling, and content as much as possible, only making the requested changes.
            5. **Icon Integration:** If the user's request involves a technology with an available icon, you MUST use it in the format \`icon:ICON_CODE\`.
            6. **Available Icons for the '${currentIconSet?.name ?? 'none'}' set:** ${availableIcons}. Do NOT invent icon codes.
            7. **VALID SYNTAX:** Your output MUST be 100% valid Mermaid syntax with proper closure of all elements.
            8. **COMPLETENESS CHECK:** Ensure the modified diagram remains complete with all necessary connections and styling.
            9. Return ONLY the complete, modified, raw Mermaid code. Do not add explanations, comments, or markdown fences.`;

            chatRef.current = ai.getGenerativeModel({ model: "gemini-1.5-flash" }).startChat({
                history: [
                    {
                        role: "user",
                        parts: [{ text: systemInstruction }]
                    },
                    {
                        role: "model",
                        parts: [{ text: "Understood. I will modify Mermaid code according to your instructions, using available icons when applicable, and ensure the output is 100% valid Mermaid syntax." }]
                    }
                ]
            });
        }
        return chatRef.current;
    } catch (error) {
        console.error('Failed to initialize AI chat:', error);
        store.setError(`AI initialization failed: ${error.message}`);
        throw error;
    }
  }, [store.iconSet, store.allIconSets, store.setError]);
  
  const handleFormatCode = useCallback(async () => {
    if (!store.code.trim() || store.isFormatting) return;
    store.setIsFormatting(true);
    store.setError(null);
    try {
        // Pre-validation: Check for common syntax issues
        const originalCode = store.code.trim();
        const validationErrors = validateMermaidCode(originalCode);
        if (validationErrors.length > 0) {
            throw new Error(`Pre-validation failed: ${validationErrors.join(', ')}`);
        }

        const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: store.code,
            config: {
                systemInstruction: `You are an expert Mermaid code formatter and syntax validator. Your primary task is to reformat the provided Mermaid code to be clean, readable, and perfectly indented.
                **CRITICAL RULE: Your output MUST be 100% valid Mermaid syntax.**
                - Correct common syntax errors. A frequent mistake is using a pipe character '|' inside a node's text (e.g., "A[Label 1 | Label 2]") where it is invalid; you MUST replace it with a forward slash '/' (e.g., "A[Label 1 / Label 2]").
                - Ensure all style definitions are properly closed (e.g., 'style A fill:#fff' should be complete).
                - Ensure all subgraphs are properly closed.
                - Add missing connection arrows if the diagram structure suggests they should exist.
                - Do NOT change the diagram's structure, content, or meaning unless fixing obvious syntax errors.
                - Only adjust whitespace, indentation, line breaks, and fix minor syntax errors for clarity and correctness.
                - Return ONLY the formatted code, with no explanations or markdown backticks.`,
            },
        });

        const formattedCode = response.text.trim();
        if (!formattedCode) throw new Error("AI returned an empty response.");

        // Post-validation: Check the formatted code before parsing
        const postValidationErrors = validateMermaidCode(formattedCode);
        if (postValidationErrors.length > 0) {
            throw new Error(`Post-validation failed: ${postValidationErrors.join(', ')}`);
        }

        await mermaid.parse(formattedCode);
        store.setCode(formattedCode);

    } catch (err: unknown) {
        console.error("Error formatting code:", err);
        let message = 'An unknown error occurred.';

        if (err instanceof Error) {
            if (err.message.includes('Pre-validation failed')) {
                message = `Code validation failed before formatting. ${err.message}`;
            } else if (err.message.includes('Post-validation failed')) {
                message = `AI formatter generated invalid diagram code. ${err.message}`;
            } else if (err.message.includes('No diagram type detected')) {
                message = `Invalid diagram syntax: No diagram type detected. Ensure the code starts with a valid diagram type (e.g., 'graph TD', 'flowchart LR', 'sequenceDiagram').`;
            } else if (err.message.includes('Parse error')) {
                message = `Mermaid parsing error: ${err.message}`;
            } else {
                message = `Formatting failed: ${err.message}`;
            }
        }

        store.setError(message);
    } finally {
        store.setIsFormatting(false);
    }
  }, [store]);

  const handleGenerateDiagram = useCallback(async (aiPrompt: string) => {
    if (!aiPrompt.trim() || store.isGenerating) return;
    store.setIsGenerating(true);
    store.setError(null);
    try {
        const currentIconSet = store.allIconSets[store.iconSet];
        const availableIcons = currentIconSet ? Object.keys(currentIconSet.icons).join(', ') : 'none';

        const systemInstruction = `You are a world-class expert in generating Mermaid diagram code. Your task is to take a user's natural language description and convert it into valid, clean, and well-structured Mermaid code.
        **CRITICAL REQUIREMENTS:**
        1. **COMPLETE DIAGRAM:** Generate a FULLY COMPLETE diagram with ALL necessary connections, styling, and proper closure.
        2. **VALID SYNTAX:** Ensure 100% valid Mermaid syntax - all subgraphs must be closed with 'end', all styles must be complete, all connections must have both source and destination.
        3. **CONNECTIONS:** Add appropriate connection arrows between related components (e.g., data flow, communication paths, dependencies).
        4. **STRUCTURE:** Use subgraphs for logical grouping where appropriate.
        5. **Icon Integration:** If the user mentions technologies for which icons are available, you MUST use them. Use the format \`icon:ICON_CODE\` within the node label.
        6. **Available Icons for the '${currentIconSet?.name ?? 'none'}' set:** ${availableIcons}.
        7. Do NOT invent icon codes. Only use the codes provided above.
        8. Add professional styling using \`classDef\` and \`class\` for clarity and visual appeal.
        9. **COMPLETENESS CHECK:** Before finishing, verify that:
           - All subgraphs are closed with 'end'
           - All style definitions are complete
           - All connections have both source and destination nodes
           - The diagram has a logical flow or structure
        10. Return ONLY the raw Mermaid code, without any explanations, comments, or markdown fences.`;

        const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: aiPrompt,
            config: { systemInstruction },
        });

        const generatedCode = response.text.trim();
        if (generatedCode) {
            store.setCode(generatedCode);
        } else {
            throw new Error("AI returned an empty response.");
        }
    } catch (err: unknown) {
        console.error("Error generating diagram:", err);
        const message = err instanceof Error ? err.message : 'An unknown error occurred.';
        alert(`Generation failed: ${message}`);
    } finally {
        store.setIsGenerating(false);
    }
  }, [store]);

  const handleSendMessage = useCallback(async (message: string) => {
    if (!message.trim() || store.isChatProcessing) return;
    store.setIsChatProcessing(true);
    store.addChatMessage({ role: 'user', parts: [{ text: message }], timestamp: Date.now() });

    try {
        const chat = getChat();
        const fullPrompt = `Mermaid Code to Modify:
        \`\`\`mermaid
        ${store.code}
        \`\`\`
        
        User's Instruction: "${message}"`;
        
        const result = await chat.sendMessageStream({ message: fullPrompt });

        let accumulatedResponse = "";
        let isFirstChunk = true;

        for await (const chunk of result) {
            if (isFirstChunk) {
                store.addChatMessage({ role: 'model', parts: [{ text: '' }], timestamp: Date.now() });
                isFirstChunk = false;
            }
            const chunkText = chunk.text;
            accumulatedResponse += chunkText;
            store.streamToLastMessage(chunkText);
            
            // Simple validation: if it starts with mermaid syntax, update the code
            if (accumulatedResponse.trim().match(/^(graph|flowchart|sequenceDiagram|gantt|classDiagram|stateDiagram|erDiagram|journey|pie|gitGraph)/)) {
                 store.setCode(accumulatedResponse, true); // Update without creating history for each chunk
            }
        }
        
        // Final validation and history update
        if (accumulatedResponse) {
            await mermaid.parse(accumulatedResponse.trim());
            store.setCode(accumulatedResponse.trim());
        }
        
    } catch (err: unknown) {
        console.error("Error in AI chat:", err);
        const message = err instanceof Error ? err.message : 'An unknown error occurred.';
        store.addChatMessage({ role: 'model', parts: [{ text: `Sorry, an error occurred: ${message}` }], timestamp: Date.now() });
    } finally {
        store.setIsChatProcessing(false);
    }
  }, [store, getChat]);

  return { handleFormatCode, handleGenerateDiagram, handleSendMessage };
};
