# 🎨 Mermaid Diagram Generator

<div align="center">

  ### ✨ **Transform Ideas into Professional Diagrams with AI Power**

  ![Diagram Preview](https://img.shields.io/badge/Diagram%20Generator-Professional-blue?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDMTMuMSAyIDE0IDIuOSAxNCA0VjE2QzE0IDE3LjEgMTMuMSAxOCA5LjUgMThINy41QzYuNCAxOCA1LjUgMTcuMSA1LjUgMTZWNFY0QzUuNSAyLjkgNi40IDIgNy41IDJIMTJaTTEyIDMuNUgxMEgxMFYxN0gxM1Y5SDEzVjE3SDEwVjMuNVoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPg==)

</div>

<p align="center">
  <em>🚀 AI-Powered • 🎯 Professional • ⚡ Real-time • 🔒 Secure</em>
</p>

<p align="center">
  <a href="#-features">✨ Features</a> •
  <a href="#-quick-start">🚀 Quick Start</a> •
  <a href="#-usage-guide">📖 Usage</a> •
  <a href="#-configuration">⚙️ Config</a> •
  <a href="#-contributing">🤝 Contribute</a> •
  <a href="#-license">📄 License</a>
</p>

---

## 🚀 Features

### ✨ Core Features
- 🎯 **AI-Powered Generation**: Transform natural language prompts into professional diagrams instantly
- ⚡ **Real-time Preview**: Live rendering with instant visual feedback as you type
- 🎨 **Interactive Editing**: Click-to-edit nodes, labels, and icons directly on the canvas
- 📤 **Multiple Export Formats**: Export as SVG, PNG, or PDF for any use case
- 🎭 **Rich Icon Library**: Pre-built icon sets for AWS, Azure, GCP, Kubernetes, Cisco, and Microsoft
- 🖼️ **Custom Icon Upload**: Upload and integrate your own SVG/PNG icons seamlessly
- 🎨 **Professional Themes**: Multiple theme options for consistent documentation styling
- ⏪ **History Management**: Full undo/redo with automatic local storage persistence
- 💬 **AI Co-pilot Chat**: Interactive AI assistant for real-time diagram modifications
- 📱 **Responsive Design**: Optimized experience across desktop, tablet, and mobile devices

### 🔒 Security & Enterprise Features
- 🛡️ **Input Validation**: Enterprise-grade validation and sanitization of all user inputs
- 🔐 **Security Headers**: Comprehensive CSP, XSS protection, and security headers
- ⏱️ **Rate Limiting**: Configurable rate limits to prevent abuse and ensure stability
- 🚫 **Content Security Policy**: Strict CSP implementation to prevent XSS attacks
- 📁 **Secure File Uploads**: Validated and sanitized file uploads with type checking
- 🔑 **API Key Management**: Secure handling of AI service credentials

### 🧪 Quality & Development Excellence
- ✅ **Comprehensive Testing**: 70%+ test coverage across unit, integration, and E2E tests
- 🔷 **TypeScript**: Full type safety with strict TypeScript implementation
- 🎯 **ESLint**: Advanced code quality enforcement with custom linting rules
- 🚨 **Error Boundaries**: Graceful error handling with user-friendly error messages
- 📊 **Performance Monitoring**: Built-in performance tracking and optimization
- 🔧 **Modular Architecture**: Clean, maintainable codebase with clear separation of concerns

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

### 📋 Prerequisites

- 🟢 **Node.js**: Version 18.0.0 or higher
- 📦 **npm**: Latest version recommended
- 🤖 **AI API Key**: Obtain API key from your preferred AI service provider

### ⚡ Installation & Setup

1. **📥 Clone the repository**
   ```bash
   git clone https://github.com/veerababumanyam/MermaidDiagramGenerator.git
   cd mermaid-diagram-generator
   ```

2. **🔧 Install dependencies**
   ```bash
   npm install
   ```

3. **🔐 Configure environment**
   ```bash
   cp .env.example .env.local
   ```

   Add your AI service API key to `.env.local`:
   ```env
   AI_API_KEY=your_api_key_here
   ```

4. **▶️ Launch development server**
   ```bash
   npm run dev
   ```

5. **🌐 Access application**
   Navigate to `http://localhost:5173` in your browser

### 🎯 Ready to Create!
Your professional diagram generator is now running locally. Start creating stunning diagrams with AI assistance! 🎨✨

---

## 📖 Usage Guide

### 🎨 Creating Your First Diagram

1. **📋 Select a Template**: Choose from professionally designed templates:
   - ☁️ AWS Cloud Architecture
   - 🏢 Azure Enterprise Solutions
   - 🔧 Kubernetes Deployment Patterns
   - 🌐 Cisco Network Diagrams
   - 📊 Flowcharts & Process Maps

2. **🤖 AI-Powered Generation**: Click "✨ Generate..." and describe your diagram naturally:
   ```yaml
   Create a microservices architecture with API Gateway, three microservices,
   and a shared database. Include load balancers and monitoring components.
   ```

3. **🎯 Interactive Editing**: Click any element in the live preview to edit directly:
   - ✏️ Edit text labels and node content
   - 🎭 Swap icons from the icon library
   - 🔗 Modify connections and relationships

4. **📤 Professional Export**: Choose from multiple high-quality export formats:
   - 🖼️ **SVG**: Scalable vector format for web and print
   - 🖼️ **PNG**: High-resolution raster with transparent background
   - 📄 **PDF**: Professional document format

### 🎭 Working with Icons & Assets

- **🏗️ Built-in Icon Sets**: Comprehensive libraries for major platforms:
  - ☁️ AWS (EC2, S3, Lambda, RDS, etc.)
  - 🔵 Azure (VMs, Functions, Cosmos DB, etc.)
  - 🔴 GCP (Compute, Storage, BigQuery, etc.)
  - ⚓ Kubernetes (Pods, Services, Ingress, etc.)
  - 🖧 Cisco (Routers, Switches, Firewalls, etc.)
  - 🪟 Microsoft (Active Directory, Exchange, Teams, etc.)

- **🖼️ Custom Icon Upload**: Extend your diagram capabilities:
  - 📁 Bulk upload entire folders
  - 🔍 Search and filter your custom icon library
  - 🎨 Automatic icon integration in AI prompts

### 🚀 Advanced Features & Workflows

#### 💬 AI Co-pilot Chat
- 🤖 **Interactive Assistant**: Natural language diagram modifications
- 🎯 **Smart Commands**: "Add a load balancer" or "Change layout to horizontal"
- ⚡ **Real-time Updates**: Instant diagram transformations as you chat
- 💡 **Context Awareness**: AI understands your diagram's current state

#### ⏪ History & Version Control
- 🔄 **Full Undo/Redo**: Never lose your work
- 💾 **Auto-Save**: Persistent local storage
- 🔗 **Shareable URLs**: Encode diagrams for easy sharing
- 📚 **Version History**: Track all diagram changes

#### 📊 Export & Integration
- 🎨 **Multiple Formats**: SVG, PNG, PDF support
- 📏 **Custom Sizing**: Define exact dimensions
- 🎯 **High Resolution**: Print-ready quality
- 🔗 **Integration Ready**: Perfect for documentation and presentations

---

## ⚙️ Configuration & Security

### 🔧 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `AI_API_KEY` | AI service API key for diagram generation | Yes | - |
| `NODE_ENV` | Environment mode (development/production/test) | No | development |
| `VITE_APP_TITLE` | Application display title | No | Mermaid Diagram Generator |
| `VITE_API_RATE_LIMIT` | API rate limit per minute | No | 60 |
| `VITE_MAX_FILE_SIZE` | Maximum upload file size (MB) | No | 5 |

### 🔒 Enterprise Security Configuration

The application implements comprehensive security measures:

- 🛡️ **Content Security Policy (CSP)**: Strict CSP to prevent XSS attacks
- 🔐 **Security Headers**: X-Frame-Options, X-Content-Type-Options, HSTS
- ✅ **Input Validation**: Multi-layer validation and sanitization
- ⏱️ **Rate Limiting**: Configurable API rate limits with abuse protection
- 🔑 **Secure Credential Management**: Encrypted API key storage
- 🚫 **File Upload Security**: Type validation, size limits, and malware scanning
- 📊 **Audit Logging**: Comprehensive security event logging

---

## 🧪 Testing & Quality Assurance

### 🚀 Running Test Suites

```bash
# 📊 Run complete test suite
npm test

# 👀 Run tests in watch mode (auto-restart on changes)
npm run test:watch

# 📈 Generate detailed coverage report
npm run test:coverage

# 🌐 Run end-to-end tests (Playwright)
npm run test:e2e

# 🎭 Run E2E tests with interactive UI
npm run test:e2e:ui
```

### 📊 Test Coverage & Quality Metrics

The application maintains **>70% test coverage** across all layers:

- 🧩 **Unit Tests**: Components, hooks, utilities, and business logic
- 🔗 **Integration Tests**: AI functionality and API interactions
- 🌍 **End-to-End Tests**: Complete user workflows and critical paths
- 🔍 **Visual Regression**: UI consistency and responsive design
- ⚡ **Performance Tests**: Load testing and optimization validation

### 🎯 Testing Best Practices
- ✅ **Test-Driven Development**: New features require corresponding tests
- 🔄 **Continuous Integration**: Automated testing on every commit
- 📋 **Code Coverage Gates**: Minimum coverage requirements enforced
- 🐛 **Bug Regression Prevention**: Comprehensive regression test suite

---

## 🔧 Troubleshooting & Support

### 🚨 Common Issues & Solutions

#### 🔑 API Configuration Issues
```
Error: AI_API_KEY is required but not set
```
**✅ Solution**: Verify your `.env.local` file contains a valid API key:
```bash
# Check if .env.local exists
ls -la .env.local

# Verify API key format
cat .env.local
```

#### 🏗️ Build & Dependency Issues
```
Error: Cannot find type definition file for 'node'
```
**✅ Solutions**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear npm cache
npm cache clean --force
```

#### 🎨 Diagram Rendering Problems
```
Error: Diagram contains syntax errors
```
**✅ Solutions**:
- 🤖 Use the AI formatter to automatically fix syntax issues
- 📖 Check Mermaid.js documentation for syntax requirements
- 🔍 Enable syntax highlighting to identify errors visually

#### 🌐 Browser Compatibility
```
Error: Application not loading in browser
```
**✅ Solutions**:
- 🌐 Ensure you're using a modern browser (Chrome 90+, Firefox 88+, Safari 14+)
- 🚫 Disable browser extensions that might interfere
- 🧹 Clear browser cache and cookies

#### 📁 File Upload Issues
```
Error: File upload failed
```
**✅ Solutions**:
- 📏 Check file size limits (max 5MB)
- 🎭 Verify supported formats (SVG, PNG)
- 🔒 Ensure proper file permissions

---

## 🤝 Contributing to Excellence

We welcome contributions from developers, designers, and documentation specialists! 🌟

### 📋 Contribution Guidelines

- 📖 Read our [Contributing Guide](CONTRIBUTING.md) for detailed guidelines
- 🐛 Report bugs using the issue templates
- 💡 Propose features via GitHub Discussions
- 🔄 Follow our development workflow and coding standards

### 🚀 Development Workflow

#### 1. 🎯 **Setup Development Environment**
```bash
# Fork and clone the repository
git clone https://github.com/veerababumanyam/MermaidDiagramGenerator.git
cd mermaid-diagram-generator

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Add your API keys to .env.local
```

#### 2. 🌿 **Create Feature Branch**
```bash
# Create and switch to feature branch
git checkout -b feature/your-awesome-feature

# Or for bug fixes
git checkout -b fix/issue-description
```

#### 3. 🔧 **Development & Testing**
```bash
# Run development server
npm run dev

# Run tests continuously
npm run test:watch

# Generate coverage report
npm run test:coverage
```

#### 4. 📝 **Code Quality Standards**
- ✅ **TypeScript**: Full type safety required
- 🧪 **Testing**: 70%+ coverage mandatory
- 🎨 **ESLint**: All linting rules must pass
- 📚 **Documentation**: Update docs for new features

#### 5. 🔄 **Submit Your Contribution**
```bash
# Commit your changes
git add .
git commit -m "feat: add awesome new feature

- Description of changes
- Breaking changes (if any)
- Related issues"

# Push to your fork
git push origin feature/your-awesome-feature
```

#### 6. 🔀 **Create Pull Request**
- 🎯 Use descriptive PR titles and detailed descriptions
- 📋 Reference related issues
- ✅ Ensure all CI checks pass
- 👥 Request review from maintainers

### 🎖️ Recognition
Contributors will be recognized in:
- 📜 Repository contributors list
- 🏆 Special mentions in release notes
- 🤝 Exclusive contributor perks

---

## 📄 API Reference & Integration

### 🔌 Client-side APIs

#### 🤖 AI Generation API
```typescript
interface AIGenerationOptions {
  prompt: string;           // Natural language description
  iconSet?: string;         // Preferred icon library
  theme?: string;          // Visual theme preference
  layout?: 'vertical' | 'horizontal'; // Diagram orientation
}

const generateDiagram = async (options: AIGenerationOptions): Promise<{
  code: string;            // Mermaid diagram code
  metadata: {
    icons: string[];       // Icons used in diagram
    complexity: number;    // Diagram complexity score
    estimatedTime: number; // Generation time in ms
  };
}> => {
  // Returns complete diagram with metadata
}
```

#### 🔒 Security & Validation APIs
```typescript
import { inputValidation, rateLimit, fileSecurity } from './utils/security';

// 🛡️ Input Validation
const validation = inputValidation.validateTextInput(input, {
  maxLength: 10000,
  allowHtml: false,
  sanitize: true,
  checkXSS: true
});

// ⏱️ Rate Limiting
const rateLimit = rateLimit.createLimiter('ai_generation', {
  maxAttempts: 50,      // Max requests per window
  windowMs: 60000,      // Time window in milliseconds
  blockDuration: 300000  // Block duration for violations
});

// 📁 File Security
const fileValidation = fileSecurity.validateUpload(file, {
  maxSize: 5242880,     // 5MB in bytes
  allowedTypes: ['image/svg+xml', 'image/png'],
  scanForMalware: true
});
```

#### 🎨 Diagram Rendering API
```typescript
import { diagramRenderer } from './services/renderer';

// Render diagram with options
const result = await diagramRenderer.render(code, {
  theme: 'professional',
  format: 'svg',
  scale: 1.5,
  background: 'transparent'
});
```

#### 💾 State Management API
```typescript
import { useAppStore } from './store/useAppStore';

// Global state management
const {
  diagrams,
  currentDiagram,
  userPreferences,
  exportSettings
} = useAppStore();

// Actions available
const actions = {
  createDiagram: (options) => { /* ... */ },
  updateDiagram: (id, changes) => { /* ... */ },
  exportDiagram: (id, format) => { /* ... */ },
  saveToHistory: (diagram) => { /* ... */ }
};
```

---

## 📋 License & Legal

### 📄 MIT License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for complete details.

```text
MIT License - Free for personal and commercial use
✅ Modify and distribute
✅ Private and commercial use
✅ Include in your projects
⚠️  Keep copyright notice intact
```

### 🎯 License Benefits
- 🔓 **Freedom to Use**: Personal and commercial projects
- 🛠️ **Freedom to Modify**: Customize as needed
- 📦 **Freedom to Distribute**: Share your modifications
- ⚖️ **No Restrictions**: No royalties or usage limitations

---

<div align="center">

### 🌟 **Built with Excellence**

**Made with ❤️ using React, TypeScript, and AI**

---

### 📞 **Connect & Collaborate**

<div align="center">

[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?style=for-the-badge&logo=github)](https://github.com/veerababumanyam/MermaidDiagramGenerator)
[![Issues](https://img.shields.io/badge/Issues-Report-red?style=for-the-badge&logo=github)](https://github.com/veerababumanyam/MermaidDiagramGenerator/issues)
[![Discussions](https://img.shields.io/badge/Discussions-Join-blue?style=for-the-badge&logo=github)](https://github.com/veerababumanyam/MermaidDiagramGenerator/discussions)

</div>

---

<div align="center">

  <p>
    <strong>🎨 Transform Ideas into Professional Diagrams</strong>
  </p>

  <p>
    <a href="#-features">✨ Features</a> •
    <a href="#-quick-start">🚀 Quick Start</a> •
    <a href="#-usage-guide">📖 Usage</a> •
    <a href="#-contributing">🤝 Contribute</a>
  </p>

  <p>
    <em>⭐ Star this repository if you find it helpful!</em>
  </p>

</div>

---

<div align="center">
  <sub>Built with ❤️ by the open source community</sub>
</div>
