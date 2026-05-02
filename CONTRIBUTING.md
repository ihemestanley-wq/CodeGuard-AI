# Contributing to CodeGuard AI

First off, thank you for considering contributing to CodeGuard AI! It's people like you that make CodeGuard AI such a great tool.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Enhancements](#suggesting-enhancements)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- Node.js >= 14.0.0
- npm >= 6.0.0
- Git

### Development Setup

1. **Fork the repository**
   ```bash
   # Click the 'Fork' button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/codeguard-ai.git
   cd codeguard-ai
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/original/codeguard-ai.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Create environment file**
   ```bash
   cp .env.example .env
   ```

6. **Run tests**
   ```bash
   npm test
   ```

7. **Start development server**
   ```bash
   npm run dev
   ```

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples**
- **Describe the behavior you observed and what you expected**
- **Include screenshots if applicable**
- **Include your environment details** (OS, Node version, etc.)

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md).

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the proposed feature**
- **Explain why this enhancement would be useful**
- **List any alternatives you've considered**

Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md).

### Your First Code Contribution

Unsure where to begin? Look for issues labeled:

- `good first issue` - Simple issues perfect for newcomers
- `help wanted` - Issues where we need community help
- `documentation` - Documentation improvements

### Pull Requests

1. **Create a branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make your changes**
   - Write clean, readable code
   - Follow our coding standards
   - Add tests for new features
   - Update documentation

3. **Commit your changes**
   ```bash
   git commit -m "feat: add amazing feature"
   ```
   
   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation changes
   - `style:` Code style changes (formatting, etc.)
   - `refactor:` Code refactoring
   - `test:` Adding or updating tests
   - `chore:` Maintenance tasks

4. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

5. **Open a Pull Request**
   - Use a clear title and description
   - Reference any related issues
   - Include screenshots for UI changes
   - Ensure all tests pass

## Coding Standards

### JavaScript Style Guide

We use ESLint with Airbnb base configuration. Key points:

- **Use 2 spaces for indentation**
- **Use single quotes for strings**
- **Add semicolons at the end of statements**
- **Use camelCase for variables and functions**
- **Use PascalCase for classes**
- **Maximum line length: 100 characters**

```javascript
// Good
const userName = 'John Doe';
function calculateRisk(data) {
  return data.score * 1.5;
}

// Bad
const user_name = "John Doe"
function calculate_risk(data) 
{
  return data.score*1.5
}
```

### Code Organization

- **Keep functions small and focused** (< 50 lines)
- **Use meaningful variable names**
- **Add JSDoc comments for public APIs**
- **Avoid deep nesting** (max 3 levels)
- **Extract complex logic into separate functions**

```javascript
/**
 * Calculate deployment risk score
 * @param {Object} analysisResults - Analysis results
 * @param {Array} parsedDiff - Parsed diff data
 * @returns {Object} Risk assessment with score and level
 */
function calculateRiskScore(analysisResults, parsedDiff) {
  // Implementation
}
```

### File Structure

```
src/
├── agent/          # Core analysis logic
├── pipeline/       # CI/CD integration
├── web/           # Web server and API
│   ├── routes/    # API routes
│   ├── middleware/# Express middleware
│   └── public/    # Frontend files
└── observability/ # Logging and monitoring
```

## Testing Guidelines

### Writing Tests

- **Write tests for all new features**
- **Maintain 80%+ code coverage**
- **Use descriptive test names**
- **Follow AAA pattern** (Arrange, Act, Assert)

```javascript
describe('RiskEngine', () => {
  describe('calculateRiskScore', () => {
    test('should return low risk for safe changes', () => {
      // Arrange
      const analysisResults = { securityFindings: [] };
      
      // Act
      const result = calculateRiskScore(analysisResults);
      
      // Assert
      expect(result.level).toBe('LOW');
    });
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- tests/unit/analyzer.test.js
```

### Test Types

1. **Unit Tests** (`tests/unit/`)
   - Test individual functions
   - Mock external dependencies
   - Fast execution

2. **Integration Tests** (`tests/integration/`)
   - Test API endpoints
   - Test component interactions
   - Use real dependencies where possible

3. **E2E Tests** (`tests/e2e/`)
   - Test complete workflows
   - Simulate real user scenarios

## Pull Request Process

1. **Ensure all tests pass**
   ```bash
   npm test
   npm run lint
   ```

2. **Update documentation**
   - Update README.md if needed
   - Add JSDoc comments
   - Update CHANGELOG.md

3. **Request review**
   - Assign reviewers
   - Address feedback promptly
   - Keep PR focused and small

4. **Merge requirements**
   - ✅ All tests passing
   - ✅ Code review approved
   - ✅ No merge conflicts
   - ✅ Documentation updated
   - ✅ CHANGELOG.md updated

## Code Review Guidelines

### For Authors

- **Keep PRs small** (< 400 lines)
- **Provide context** in the description
- **Respond to feedback** constructively
- **Update based on reviews**

### For Reviewers

- **Be respectful and constructive**
- **Focus on code quality and maintainability**
- **Ask questions rather than making demands**
- **Approve when satisfied**

## Development Workflow

```bash
# 1. Sync with upstream
git fetch upstream
git checkout main
git merge upstream/main

# 2. Create feature branch
git checkout -b feature/my-feature

# 3. Make changes and commit
git add .
git commit -m "feat: add my feature"

# 4. Push and create PR
git push origin feature/my-feature
```

## Additional Resources

- [Project README](README.md)
- [API Documentation](API.md)
- [Security Policy](SECURITY.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Changelog](CHANGELOG.md)

## Questions?

- Open an issue with the `question` label
- Join our discussions on GitHub
- Contact maintainers

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing to CodeGuard AI! 🎉

---

**Made with ❤️ by the CodeGuard AI Community**