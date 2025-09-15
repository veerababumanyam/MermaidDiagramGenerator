# Mermaid Diagram Generator

<div align="center">
<img width="1200" height="475" alt="Mermaid Diagram Generator" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

<p align="center">
  <strong>Professional diagram creation powered by AI and Mermaid.js</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#configuration">Configuration</a> •
  <a href="#api">API</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#license">License</a>
</p>

---

## 🚀 Features

### ✨ Core Features
- **AI-Powered Generation**: Create professional diagrams using natural language prompts
- **Real-time Preview**: Live rendering of Mermaid diagrams with instant feedback
- **Interactive Editing**: Click-to-edit nodes, labels, and icons directly on the diagram
- **Multiple Export Formats**: Export diagrams as SVG, PNG, or PDF
- **Rich Icon Library**: Pre-built icon sets for AWS, Azure, GCP, Kubernetes, Cisco, and Microsoft
- **Custom Icon Upload**: Upload and use your own custom icons
- **Professional Themes**: Multiple theme options for different documentation styles
- **History Management**: Undo/redo functionality with persistent storage
- **AI Co-pilot Chat**: Interactive AI assistant for diagram modifications
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### 🔒 Security Features
- **Input Validation**: Comprehensive validation and sanitization of all user inputs
- **Security Headers**: CSP, XSS protection, and other security headers implemented
- **Rate Limiting**: Protection against abuse with configurable rate limits
- **Content Security Policy**: Strict CSP to prevent XSS attacks
- **Secure File Uploads**: Validated and sanitized file uploads with type checking

### 🧪 Quality Assurance
- **Comprehensive Testing**: Unit, integration, and E2E test coverage
- **TypeScript**: Full TypeScript support for type safety
- **ESLint**: Code quality enforcement with custom rules
- **Error Boundaries**: Graceful error handling with user-friendly messages

---

## 📁 Project Structure

```
mermaid-diagram-generator/
├── 📁 components/                 # React components
│   ├── AIChatPanel.tsx           # AI chat interface component
│   ├── EditorPanel.tsx           # Diagram editor interface
│   ├── GenerateAIModal.tsx       # AI generation modal
│   ├── Header.tsx                # Application header
│   ├── IconPickerModal.tsx       # Icon selection modal
│   ├── Icons.tsx                 # Icon component library
│   ├── MonacoEditor.tsx          # Code editor component
│   ├── PreviewPanel.tsx          # Diagram preview component
│   ├── RefineAIModal.tsx         # AI refinement modal
│   ├── TextEditorModal.tsx       # Text editor modal
│   └── UploadIconModal.tsx       # Custom icon upload modal
├── 📁 hooks/                     # Custom React hooks
│   ├── useGeminiAI.ts            # Gemini AI integration hook
│   ├── useHistory.ts             # History management hook
│   ├── useLocalStorage.ts        # Local storage utilities
│   └── useMermaidRenderer.ts     # Mermaid rendering hook
├── 📁 src/                       # Main source directory
│   ├── 📁 components/            # Additional components
│   │   ├── ai/                   # AI-related components
│   │   ├── diagrams/             # Diagram-specific components
│   │   ├── templates/            # Template components
│   │   └── __tests__/            # Component tests
│   ├── 📁 hooks/                 # Additional custom hooks
│   │   ├── ai/                   # AI-specific hooks
│   │   ├── diagrams/             # Diagram hooks
│   │   └── templates/            # Template hooks
│   ├── 📁 plugins/               # Plugin system
│   │   ├── diagrams/             # Diagram plugins
│   │   └── templates/            # Template plugins
│   ├── 📁 services/              # Business logic services
│   │   ├── ExportService.ts      # Export functionality
│   │   ├── ExportPreferencesService.ts # Export preferences
│   │   └── TemplateMarketplace.ts # Template marketplace
│   ├── 📁 types/                 # TypeScript type definitions
│   │   ├── ai.ts                 # AI-related types
│   │   ├── diagrams.ts           # Diagram types
│   │   ├── export.ts             # Export types
│   │   ├── preferences.ts        # Preference types
│   │   └── templates.ts          # Template types
│   ├── 📁 utils/                 # Utility functions
│   │   ├── ai/                   # AI utilities
│   │   ├── diagrams/             # Diagram utilities
│   │   ├── env.ts                # Environment utilities
│   │   ├── security.ts           # Security utilities
│   │   └── templates/            # Template utilities
│   └── setupTests.ts             # Test setup configuration
├── 📁 store/                     # State management
│   └── useAppStore.ts            # Global application store
├── 📁 types/                     # Additional type definitions
│   └── ai.ts                     # AI type definitions
├── 📁 public/                    # Static assets
│   └── 📁 icons/                 # Icon assets
│       ├── aws/                  # AWS service icons
│       ├── azure/                # Azure service icons
│       ├── cisco/                # Cisco equipment icons
│       ├── gcp/                  # Google Cloud icons
│       ├── k8s/                  # Kubernetes icons
│       └── microsoft/            # Microsoft service icons
├── 📁 tests/                     # Test files
│   ├── 📁 e2e/                   # End-to-end tests
│   │   ├── diagram-generation.spec.ts
│   │   ├── global-setup.ts
│   │   └── global-teardown.ts
│   └── 📁 __tests__/             # Unit tests
├── 📁 dist/                      # Built application (generated)
├── App.tsx                       # Main application component
├── index.tsx                     # Application entry point
├── index.html                    # HTML template
├── package.json                  # NPM dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── vite.config.ts                # Vite build configuration
├── playwright.config.ts          # Playwright E2E test config
├── constants.ts                  # Application constants
├── API_DOCUMENTATION.md          # API documentation
├── CONTRIBUTING.md               # Contributing guidelines
├── README.md                     # This file
└── metadata.json                 # Application metadata
```

### Directory Overview

- **`components/`**: Core React components for the UI
- **`hooks/`**: Custom React hooks for state and side effects
- **`src/`**: Main application source code with modular organization
- **`store/`**: Global state management using Zustand
- **`types/`**: TypeScript type definitions and interfaces
- **`public/`**: Static assets including icon libraries
- **`tests/`**: Comprehensive test suite (unit, integration, E2E)
- **`dist/`**: Production build output (auto-generated)

### Architecture Highlights

- **Modular Design**: Components and utilities organized by feature domain
- **Type Safety**: Full TypeScript coverage with strict type checking
- **Test Coverage**: Comprehensive testing across all layers
- **Security First**: Input validation and security utilities throughout
- **Performance**: Optimized with lazy loading and efficient rendering

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm**: Latest version recommended
- **Google Gemini API Key**: Get one from [Google AI Studio](https://ai.google.dev/aistudio)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mermaid-diagram-generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

---

## 📖 Usage Guide

### Creating Your First Diagram

1. **Select a Template**: Choose from pre-built templates like AWS Cloud Architecture, Cisco Collaboration, or Kubernetes Deployment

2. **Use AI Generation**: Click "Generate..." and describe your diagram in natural language:
   ```
   Create a microservices architecture with API Gateway, three microservices,
   and a shared database. Include load balancers and monitoring components.
   ```

3. **Interactive Editing**: Click on any element in the preview to edit it directly

4. **Export Your Diagram**: Choose from SVG, PNG, or PDF export options

### Working with Icons

- **Built-in Icon Sets**: AWS, Azure, GCP, Kubernetes, Cisco, Microsoft
- **Custom Icons**: Upload your own SVG icons
- **Icon Integration**: Mention technologies in AI prompts to automatically include icons

### Advanced Features

#### AI Co-pilot Chat
- Interactive AI assistant for diagram modifications
- Natural language commands like "Make the layout top-to-bottom" or "Add a database connection"
- Real-time diagram updates as you chat

#### History Management
- Full undo/redo functionality
- Automatic saving to local storage
- Share diagrams via URL with encoded state

#### Export Options
- **SVG**: Scalable vector format, perfect for web and print
- **PNG**: Raster format with transparent background
- **PDF**: Vector format optimized for documents

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `GEMINI_API_KEY` | Google Gemini API key for AI features | Yes | - |
| `NODE_ENV` | Environment (development/production/test) | No | development |
| `VITE_APP_TITLE` | Application title | No | Mermaid Diagram Generator |

### Security Configuration

Security features are automatically configured:

- **Content Security Policy (CSP)**: Prevents XSS attacks
- **Security Headers**: X-Frame-Options, X-Content-Type-Options, etc.
- **Input Validation**: All user inputs are validated and sanitized
- **Rate Limiting**: API calls are rate-limited to prevent abuse

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

### Test Coverage

The application maintains >70% test coverage across:
- Unit tests for components, hooks, and utilities
- Integration tests for AI functionality
- End-to-end tests for complete user workflows

---

## 🔧 Troubleshooting

### Common Issues

#### API Key Issues
```
Error: GEMINI_API_KEY is required but not set
```
**Solution**: Ensure your `.env.local` file contains a valid Gemini API key starting with `AIza`

#### Build Errors
```
Error: Cannot find type definition file for 'node'
```
**Solution**: Run `npm install` to ensure all dependencies are installed

#### Diagram Rendering Issues
```
Error: Diagram contains syntax errors
```
**Solution**: Check your Mermaid syntax or use the AI formatter to fix issues

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/mermaid-diagram-generator.git`
3. Install dependencies: `npm install`
4. Create a feature branch: `git checkout -b feature/your-feature-name`
5. Make your changes and add tests
6. Run the test suite: `npm test`
7. Submit a pull request

---

## 📄 API Documentation

### Client-side APIs

#### AI Generation
```typescript
interface AIGenerationOptions {
  prompt: string;
  iconSet?: string;
  theme?: string;
}

const generateDiagram = async (options: AIGenerationOptions): Promise<string> => {
  // Returns Mermaid diagram code
}
```

#### Security Utilities
```typescript
import { inputValidation, rateLimit } from './utils/security';

// Validate user input
const result = inputValidation.validateTextInput(input, {
  maxLength: 1000,
  allowHtml: false
});

// Check rate limit
const canProceed = rateLimit.check('user_action', {
  maxAttempts: 10,
  windowMs: 60000
});
```

---

## 📋 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Made with ❤️ using React, TypeScript, and AI</p>
  <p>
    <a href="#mermaid-diagram-generator">Back to top</a>
  </p>
</div>
