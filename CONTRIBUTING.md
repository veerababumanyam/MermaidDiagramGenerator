# Contributing to Mermaid Diagram Generator

Thank you for your interest in contributing to the Mermaid Diagram Generator! This document provides guidelines and information for contributors.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)

## 🤝 Code of Conduct

This project follows a code of conduct to ensure a welcoming environment for all contributors. By participating, you agree to:

- Be respectful and inclusive
- Focus on constructive feedback
- Accept responsibility for mistakes
- Show empathy towards other contributors
- Help create a positive community

## 🚀 Getting Started

### Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm**: Latest version recommended
- **Git**: Latest version
- **Google Gemini API Key**: For AI features

### Development Setup

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/mermaid-diagram-generator.git
   cd mermaid-diagram-generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Run tests**
   ```bash
   npm test
   ```

## 🔄 Development Workflow

### Branch Naming Convention

Use descriptive branch names following this pattern:
```
type/description-kebab-case

Examples:
feat/add-dark-mode-toggle
fix/resolve-mermaid-parsing-error
docs/update-api-documentation
test/add-e2e-test-coverage
```

### Types
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation updates
- `test`: Testing related changes
- `refactor`: Code refactoring
- `style`: Code style changes
- `chore`: Maintenance tasks

### Commit Messages

Follow the [Conventional Commits](https://conventionalcommits.org/) specification:

```
type(scope): description

[optional body]

[optional footer]
```

Examples:
```
feat(auth): add Google OAuth integration

- Implement OAuth2 flow
- Add user session management
- Update authentication middleware

Closes #123
```

```
fix(diagram): resolve SVG export issue

The SVG export was failing when diagrams contained special characters.
Fixed by properly escaping XML entities in the export function.
```

## 💻 Coding Standards

### TypeScript/JavaScript

- **TypeScript**: Use TypeScript for all new code
- **Strict Mode**: Enable strict type checking
- **Explicit Types**: Avoid `any`, use proper type definitions
- **Interfaces**: Prefer interfaces over types for object shapes
- **Naming**: Use PascalCase for components, camelCase for variables/functions

### Code Style

- **ESLint**: Follow the project's ESLint configuration
- **Prettier**: Code is automatically formatted
- **Imports**: Group imports (external, internal, types)
- **Comments**: Use JSDoc for public APIs
- **Error Handling**: Implement proper error boundaries

### React Best Practices

- **Functional Components**: Use functional components with hooks
- **Custom Hooks**: Extract reusable logic into custom hooks
- **Memoization**: Use `React.memo`, `useMemo`, `useCallback` appropriately
- **Keys**: Always provide stable keys for list items
- **Accessibility**: Implement ARIA attributes and semantic HTML

### Security

- **Input Validation**: Validate and sanitize all user inputs
- **XSS Prevention**: Use proper escaping and CSP headers
- **Authentication**: Implement secure authentication if needed
- **Dependencies**: Keep dependencies updated and audit for vulnerabilities

## 🧪 Testing

### Testing Strategy

The project uses a layered testing approach:

1. **Unit Tests**: Test individual functions and components
2. **Integration Tests**: Test component interactions and API calls
3. **End-to-End Tests**: Test complete user workflows

### Test Coverage

Maintain >70% test coverage across:
- Statements
- Branches
- Functions
- Lines

### Writing Tests

```typescript
// Unit test example
describe('useValidation Hook', () => {
  it('should validate email format', () => {
    const { result } = renderHook(() => useValidation(testEmail));
    expect(result.current.isValid).toBe(true);
  });
});

// E2E test example
test('should create diagram from template', async ({ page }) => {
  await page.goto('/');
  await page.selectOption('#template-select', 'flowchart');
  await expect(page.locator('svg')).toBeVisible();
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run specific test file
npm test -- useValidation.test.ts
```

## 📝 Submitting Changes

### Pull Request Process

1. **Create a branch** from `main`
2. **Make your changes** following the coding standards
3. **Add tests** for new features
4. **Update documentation** if needed
5. **Run the test suite**
6. **Commit with conventional format**
7. **Push your branch**
8. **Create a Pull Request**

### Pull Request Template

Use this template for your PR description:

```markdown
## Description
Brief description of the changes made.

## Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change
- [ ] Documentation update
- [ ] Refactoring

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective
- [ ] New and existing unit tests pass locally
- [ ] Any dependent changes have been merged and published

## Screenshots (if applicable)
Add screenshots to help reviewers understand the changes.

## Additional Notes
Any additional information or context.
```

### Review Process

1. **Automated Checks**: CI/CD pipeline runs tests and linting
2. **Peer Review**: At least one maintainer reviews the code
3. **Approval**: PR is approved and merged
4. **Deployment**: Changes are deployed to staging/production

## 🐛 Reporting Issues

### Bug Reports

Use the bug report template:

```markdown
**Bug Description**
Clear and concise description of the bug.

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen.

**Actual Behavior**
What actually happens.

**Screenshots**
Add screenshots if applicable.

**Environment**
- OS: [e.g., Windows 10]
- Browser: [e.g., Chrome 91]
- Version: [e.g., 1.0.0]

**Additional Context**
Any other context about the problem.
```

### Feature Requests

Use the feature request template:

```markdown
**Feature Summary**
Brief description of the proposed feature.

**Problem Statement**
What problem does this solve?

**Proposed Solution**
Describe the solution you'd like.

**Alternatives Considered**
Describe alternatives you've considered.

**Additional Context**
Any other context or screenshots.
```

## 📚 Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Mermaid Documentation](https://mermaid-js.github.io/)
- [Playwright Documentation](https://playwright.dev/)
- [Conventional Commits](https://conventionalcommits.org/)

## 📞 Getting Help

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **Documentation**: [Project Wiki](https://github.com/your-repo/wiki)

## 🙏 Recognition

Contributors are recognized in:
- [CONTRIBUTORS.md](CONTRIBUTORS.md) file
- GitHub's contributor insights
- Release notes

Thank you for contributing to the Mermaid Diagram Generator! 🎉

