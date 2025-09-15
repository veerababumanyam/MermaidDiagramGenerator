# API Documentation

This document provides comprehensive API documentation for the Mermaid Diagram Generator application.

## 📋 Table of Contents

- [Client-side APIs](#client-side-apis)
- [Environment Configuration](#environment-configuration)
- [Security APIs](#security-apis)
- [Validation APIs](#validation-apis)
- [State Management](#state-management)
- [Utility Functions](#utility-functions)
- [Hooks](#hooks)
- [Error Handling](#error-handling)

## 🌐 Client-side APIs

### AI Generation API

#### `generateDiagram(options: AIGenerationOptions): Promise<string>`

Generates a Mermaid diagram from natural language description.

**Parameters:**
```typescript
interface AIGenerationOptions {
  prompt: string;           // Natural language description of the diagram
  iconSet?: string;         // Icon set to use ('aws', 'azure', 'cisco', etc.)
  theme?: string;           // Theme to apply ('dark', 'light', etc.)
  maxRetries?: number;      // Maximum retry attempts (default: 3)
  timeout?: number;         // Timeout in milliseconds (default: 30000)
}
```

**Returns:**
- `Promise<string>`: Mermaid diagram code

**Example:**
```typescript
import { generateDiagram } from './hooks/useGeminiAI';

const diagramCode = await generateDiagram({
  prompt: "Create a microservices architecture with API Gateway, three services, and a database",
  iconSet: 'aws',
  theme: 'dark'
});
```

**Error Handling:**
```typescript
try {
  const diagramCode = await generateDiagram(options);
  // Use diagramCode
} catch (error) {
  if (error.message.includes('API key')) {
    // Handle API key issues
  } else if (error.message.includes('timeout')) {
    // Handle timeout errors
  } else {
    // Handle other errors
  }
}
```

### Export APIs

#### `exportDiagram(options: ExportOptions): Promise<Blob>`

Exports the current diagram in the specified format.

**Parameters:**
```typescript
interface ExportOptions {
  format: 'svg' | 'png' | 'pdf';
  quality?: number;          // PNG quality (0-1, default: 1.0)
  backgroundColor?: string;  // Background color (default: transparent)
  scale?: number;           // Scale factor (default: 1.0)
  filename?: string;        // Output filename
}
```

**Returns:**
- `Promise<Blob>`: Diagram file as a Blob

**Example:**
```typescript
import { useAppStore } from './store/useAppStore';

const exportOptions = {
  format: 'png',
  quality: 0.9,
  backgroundColor: '#ffffff',
  filename: 'my-diagram'
};

const diagramBlob = await exportDiagram(exportOptions);

// Download the file
const url = URL.createObjectURL(diagramBlob);
const a = document.createElement('a');
a.href = url;
a.download = `${exportOptions.filename || 'diagram'}.${exportOptions.format}`;
a.click();
URL.revokeObjectURL(url);
```

### Chat API

#### `sendChatMessage(message: string): Promise<void>`

Sends a message to the AI co-pilot and updates the diagram accordingly.

**Parameters:**
- `message: string`: The user's message/command

**Returns:**
- `Promise<void>`

**Example:**
```typescript
import { useAppStore } from './store/useAppStore';

const sendMessage = async (message: string) => {
  const store = useAppStore.getState();

  try {
    store.addChatMessage({
      role: 'user',
      parts: [{ text: message }],
      timestamp: Date.now()
    });

    store.setIsChatProcessing(true);

    // Process with AI
    await processChatMessage(message);

    store.setIsChatProcessing(false);
  } catch (error) {
    store.addChatMessage({
      role: 'model',
      parts: [{ text: `Error: ${error.message}` }],
      timestamp: Date.now()
    });
  }
};
```

## ⚙️ Environment Configuration

### Environment Variables

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `GEMINI_API_KEY` | string | Yes | - | Google Gemini API key for AI features |
| `NODE_ENV` | string | No | 'development' | Application environment |
| `VITE_APP_TITLE` | string | No | 'Mermaid Diagram Generator' | Application title |

### Environment API

#### `env: EnvConfig`

Access validated environment configuration.

```typescript
import { env, isDevelopment, isProduction } from './utils/env';

// Direct access to environment variables
console.log(env.GEMINI_API_KEY);  // Validated API key
console.log(env.NODE_ENV);        // Environment
console.log(env.VITE_APP_TITLE);  // Application title

// Environment checks
if (isDevelopment) {
  // Development-specific code
}

if (isProduction) {
  // Production-specific code
}
```

#### `envUtils: EnvironmentUtilities`

Utility functions for environment validation and access.

```typescript
import { envUtils } from './utils/env';

// Check if environment is valid
const isValid = envUtils.isValid();  // boolean

// Get validation errors
const errors = envUtils.getValidationErrors();  // string[]

// Safe access to optional environment variables
const port = envUtils.getNumber('PORT', 3000);
const debug = envUtils.getBoolean('DEBUG', false);
const apiUrl = envUtils.getOptional('API_URL', 'http://localhost:3000');
```

## 🔒 Security APIs

### Input Validation

#### `inputValidation.validateTextInput(input, options)`

Validates and sanitizes text input.

**Parameters:**
```typescript
interface ValidationOptions {
  maxLength?: number;
  minLength?: number;
  allowHtml?: boolean;
  allowSpecialChars?: boolean;
}

inputValidation.validateTextInput(
  input: string,
  options?: ValidationOptions
): ValidationResult
```

**Returns:**
```typescript
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized: string;
}
```

**Example:**
```typescript
import { inputValidation } from './utils/security';

const result = inputValidation.validateTextInput(userInput, {
  maxLength: 1000,
  minLength: 10,
  allowHtml: false
});

if (result.isValid) {
  // Use result.sanitized
} else {
  // Handle validation errors
  console.error('Validation errors:', result.errors);
}
```

#### `inputValidation.validateMermaidCode(code)`

Validates Mermaid diagram code for security and syntax.

**Parameters:**
- `code: string`: Mermaid diagram code

**Returns:**
```typescript
interface MermaidValidationResult {
  isValid: boolean;
  errors: string[];
}
```

**Example:**
```typescript
import { inputValidation } from './utils/security';

const validation = inputValidation.validateMermaidCode(diagramCode);

if (!validation.isValid) {
  console.error('Mermaid validation errors:', validation.errors);
  // Handle invalid code
}
```

### Rate Limiting

#### `rateLimit.check(key, options)`

Checks if an action should be rate limited.

**Parameters:**
```typescript
interface RateLimitOptions {
  maxAttempts: number;
  windowMs: number;
}

rateLimit.check(
  key: string,
  options: RateLimitOptions
): RateLimitResult
```

**Returns:**
```typescript
interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  resetTime: number;
}
```

**Example:**
```typescript
import { rateLimit } from './utils/security';

const result = rateLimit.check('user_generation', {
  maxAttempts: 10,
  windowMs: 60000  // 1 minute
});

if (result.allowed) {
  // Proceed with action
  console.log(`Remaining attempts: ${result.remainingAttempts}`);
} else {
  // Rate limited
  const resetIn = Math.ceil((result.resetTime - Date.now()) / 1000);
  console.log(`Rate limited. Try again in ${resetIn} seconds.`);
}
```

### Security Headers

The application automatically applies security headers including:

- **Content Security Policy (CSP)**: Prevents XSS attacks
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **X-XSS-Protection**: Enables XSS filtering
- **Referrer-Policy**: Controls referrer information
- **Permissions-Policy**: Restricts browser features

## ✅ Validation APIs

### Text Validation Hook

#### `useTextValidation(initialValue, options)`

Hook for real-time text input validation.

**Parameters:**
```typescript
interface ValidationOptions {
  maxLength?: number;
  minLength?: number;
  allowHtml?: boolean;
  allowSpecialChars?: boolean;
  debounceMs?: number;
  validateOnChange?: boolean;
  validateMermaid?: boolean;
}

const {
  value,
  setValue,
  validation,
  isValidating,
  validate,
  reset,
  hasErrors
} = useTextValidation(initialValue, options);
```

**Example:**
```typescript
import { useTextValidation } from './hooks/useValidation';

const MyComponent = () => {
  const {
    value,
    setValue,
    validation,
    hasErrors
  } = useTextValidation('', {
    maxLength: 2000,
    minLength: 10,
    allowHtml: false,
    debounceMs: 300
  });

  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={hasErrors ? 'error' : ''}
      />
      {hasErrors && (
        <div className="error-messages">
          {validation.errors.map((error, index) => (
            <p key={index}>{error}</p>
          ))}
        </div>
      )}
      <p>{value.length}/2000 characters</p>
    </div>
  );
};
```

### File Validation Hook

#### `useFileValidation(options)`

Hook for file upload validation.

**Parameters:**
```typescript
interface FileValidationOptions {
  maxSize?: number;        // in bytes
  allowedTypes?: string[]; // MIME types
  allowedExtensions?: string[];
}

const { validateFile, isValidating } = useFileValidation(options);
```

**Example:**
```typescript
import { useFileValidation } from './hooks/useValidation';

const FileUploadComponent = () => {
  const { validateFile, isValidating } = useFileValidation({
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/svg+xml', 'image/png'],
    allowedExtensions: ['.svg', 'png']
  });

  const handleFileUpload = async (file: File) => {
    const result = await validateFile(file);

    if (result.isValid) {
      // Process file
    } else {
      console.error('File validation errors:', result.errors);
    }
  };

  return (
    <input
      type="file"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleFileUpload(file);
      }}
      disabled={isValidating}
    />
  );
};
```

## 📊 State Management

### Zustand Store

#### `useAppStore()`

Main application state store.

**State Interface:**
```typescript
interface AppState {
  // Code and History
  code: string;
  history: HistoryState;

  // Settings
  theme: string;
  fontFamily: string;
  iconSet: string;

  // Output
  svg: string;
  error: string | null;

  // Icons
  allIconSets: Record<string, IconSet>;

  // AI
  isGenerating: boolean;
  isFormatting: boolean;

  // Chat
  isChatOpen: boolean;
  chatHistory: ChatMessage[];
  isChatProcessing: boolean;
}
```

**Actions:**
```typescript
interface AppActions {
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
  addIcons: (newIcons: Record<string, string>, vendor: string) => void;

  // AI
  setIsGenerating: (isGenerating: boolean) => void;
  setIsFormatting: (isFormatting: boolean) => void;

  // Chat
  toggleChat: () => void;
  setChatHistory: (history: ChatMessage[]) => void;
  addChatMessage: (message: ChatMessage) => void;

  // App initialization
  initializeFromUrl: () => void;
}
```

**Example:**
```typescript
import { useAppStore } from './store/useAppStore';

const MyComponent = () => {
  const {
    code,
    setCode,
    theme,
    setTheme,
    isGenerating,
    error
  } = useAppStore();

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
  };

  return (
    <div>
      {error && <div className="error">{error}</div>}
      {isGenerating && <div>Loading...</div>}
      {/* Component JSX */}
    </div>
  );
};
```

## 🔧 Utility Functions

### History Management

#### `useHistory<T>(initialState)`

Provides undo/redo functionality for any state type.

**Example:**
```typescript
import { useHistory } from './hooks/useHistory';

const [state, setState, history] = useHistory(initialState);

const handleUndo = () => history.undo();
const handleRedo = () => history.redo();

const canUndo = history.canUndo;
const canRedo = history.canRedo;
```

### Local Storage

#### `useLocalStorage<T>(key, initialValue)`

Persistent state management with localStorage.

**Example:**
```typescript
import useLocalStorage from './hooks/useLocalStorage';

const [value, setValue] = useLocalStorage('user-preference', defaultValue);
```

### Mermaid Renderer

#### `useMermaidRenderer()`

Handles Mermaid diagram rendering and updates.

**Features:**
- Automatic re-rendering on code changes
- Icon processing and injection
- Theme application
- Error handling and display

**Example:**
```typescript
import { useMermaidRenderer } from './hooks/useMermaidRenderer';

// Call in component - handles all rendering logic
useMermaidRenderer();
```

## 🎣 Hooks

### AI Hooks

#### `useGeminiAI()`

Provides AI-powered diagram generation and formatting.

**Returns:**
```typescript
interface GeminiAIReturn {
  handleFormatCode: () => Promise<void>;
  handleGenerateDiagram: (prompt: string) => Promise<void>;
  handleSendMessage: (message: string) => Promise<void>;
}
```

**Example:**
```typescript
import { useGeminiAI } from './hooks/useGeminiAI';

const {
  handleFormatCode,
  handleGenerateDiagram,
  handleSendMessage
} = useGeminiAI();

// Format current diagram
await handleFormatCode();

// Generate new diagram
await handleGenerateDiagram("Create a flowchart for user authentication");

// Send chat message
await handleSendMessage("Add a database to the diagram");
```

### Validation Hook

#### `useValidation(initialValue, rules)`

Form validation with multiple fields.

**Example:**
```typescript
import { useFormValidation } from './hooks/useValidation';

const {
  values,
  errors,
  touched,
  setFieldValue,
  setFieldTouched,
  validateForm,
  resetForm,
  isValid,
  isDirty,
  hasErrors
} = useFormValidation(initialValues, validationRules);
```

## 🚨 Error Handling

### Error Boundary

#### `ErrorBoundary`

Catches React errors and displays user-friendly error messages.

**Props:**
```typescript
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}
```

**Example:**
```typescript
import ErrorBoundary from './components/ErrorBoundary';

const App = () => (
  <ErrorBoundary>
    <MyApp />
  </ErrorBoundary>
);
```

### Global Error Handlers

The application includes global error handlers for:

- **Unhandled Promise Rejections**: Catches async errors
- **Uncaught Errors**: Catches synchronous errors
- **React Errors**: Caught by ErrorBoundary

### Error Reporting

Errors are automatically logged and can be configured to report to external services:

```typescript
// In production, errors are sent to monitoring service
if (process.env.NODE_ENV === 'production') {
  // Send to error monitoring service (Sentry, Rollbar, etc.)
}
```

---

## 📞 Support

For API-related questions or issues:

- **API Documentation**: This document
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)

---

## 🔄 Version History

### v1.0.0
- Initial API documentation
- Core functionality documented
- Security and validation APIs added
- Error handling documented

---

*This documentation is automatically updated with each release. For the latest version, see the main repository.*

