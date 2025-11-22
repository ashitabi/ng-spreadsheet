# Contributing to ng-spreadsheet

First off, thank you for considering contributing to ng-spreadsheet! It's people like you that make this library better for everyone.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Features](#suggesting-features)
  - [Submitting Pull Requests](#submitting-pull-requests)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please be respectful, considerate, and professional in all interactions.

### Our Standards

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the [existing issues](https://github.com/ashitabi/ng-spreadsheet/issues) to avoid duplicates.

When creating a bug report, please include as many details as possible:

**Use this template:**

```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
 - Browser: [e.g. Chrome 120]
 - Angular version: [e.g. 20.3.0]
 - ng-spreadsheet version: [e.g. 0.1.0]
 - OS: [e.g. macOS 14.0]

**Additional context**
Add any other context about the problem here.
```

**Submit your bug report:** [Create Bug Report](https://github.com/ashitabi/ng-spreadsheet/issues/new?labels=bug)

### Suggesting Features

We love to hear your ideas for new features! Before creating feature requests, please check the [existing issues](https://github.com/ashitabi/ng-spreadsheet/issues) to avoid duplicates.

**Use this template:**

```markdown
**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is. Ex. I'm always frustrated when [...]

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Would this be a breaking change?**
Yes/No - and explain why if yes.

**Additional context**
Add any other context, mockups, or screenshots about the feature request here.
```

**Submit your feature request:** [Request Feature](https://github.com/ashitabi/ng-spreadsheet/issues/new?labels=enhancement)

### Submitting Pull Requests

We actively welcome your pull requests!

**Before you start:**
1. Check if there's an existing issue for what you want to work on
2. If not, create an issue to discuss your proposed changes
3. Wait for maintainer feedback before starting significant work

## Development Setup

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Git

### Initial Setup

```bash
# 1. Fork the repository on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/ng-spreadsheet.git
cd ng-spreadsheet

# 3. Add upstream remote
git remote add upstream https://github.com/ashitabi/ng-spreadsheet.git

# 4. Install dependencies
npm install

# 5. Build the library
npm run build:lib
```

### Verify Setup

```bash
# Run tests to ensure everything is working
npm run test:lib

# Start the demo app
npm start demo
```

If the tests pass and the demo runs successfully, you're ready to start developing!

## Development Workflow

### 1. Create a Branch

```bash
# Update your fork with the latest changes
git checkout main
git pull upstream main

# Create a new branch
git checkout -b feature/my-new-feature
# or
git checkout -b fix/my-bug-fix
```

**Branch naming conventions:**
- `feature/` - For new features
- `fix/` - For bug fixes
- `docs/` - For documentation changes
- `refactor/` - For code refactoring
- `test/` - For adding or updating tests

### 2. Make Your Changes

```bash
# Make changes to the library code in projects/ng-spreadsheet/

# Build the library to see changes in demo
npm run build:lib

# OR use watch mode for automatic rebuilds
npm run build:lib:watch

# In another terminal, run the demo
npm start demo
```

### 3. Test Your Changes

```bash
# Run the test suite
npm run test:lib

# Run tests with coverage
npm run test:lib -- --code-coverage

# Write new tests for your changes if needed
```

### 4. Commit Your Changes

Follow our [Commit Message Guidelines](#commit-message-guidelines) below.

```bash
git add .
git commit -m "feat: add amazing new feature"
```

### 5. Push and Create PR

```bash
# Push to your fork
git push origin feature/my-new-feature

# Go to GitHub and create a Pull Request
```

## Coding Standards

### TypeScript

- Use **strict mode** (already configured)
- Prefer `const` over `let` when possible
- Use explicit types instead of `any`
- Use interfaces for object shapes
- Document complex logic with comments

### Angular

- Follow the [Angular Style Guide](https://angular.dev/style-guide)
- Use **standalone components** (no NgModules)
- Use **OnPush change detection** for performance
- Use RxJS `takeUntil` pattern for subscriptions
- Keep components focused and single-purpose

### Code Organization

```typescript
// Good: Clear, typed, and documented
interface CellAddress {
  row: number;
  col: number;
}

/**
 * Selects a cell at the given address
 * @param address The cell address to select
 */
selectCell(address: CellAddress): void {
  // Implementation
}

// Bad: Unclear types and no documentation
selectCell(addr: any) {
  // Implementation
}
```

### Formatting

We use **Prettier** for code formatting. It runs automatically on commit via Husky pre-commit hooks.

```bash
# Format all files
npm run format

# Check formatting without changing files
npm run format:check
```

## Testing Guidelines

### Test Structure

```typescript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = component.methodName(input);

      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Testing Best Practices

- Write tests for all new features
- Update existing tests when modifying features
- Aim for >80% code coverage
- Test edge cases and error conditions
- Keep tests focused and independent
- Use descriptive test names

### Running Tests

```bash
# Run all tests
npm run test:lib

# Run tests in watch mode
npm run test:lib -- --watch

# Run with coverage report
npm run test:lib -- --code-coverage

# Run specific test file
npm run test:lib -- --include='**/my-component.spec.ts'
```

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that don't affect code meaning (formatting, etc.)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding or updating tests
- `chore`: Changes to build process or auxiliary tools

### Examples

```bash
# Feature
git commit -m "feat(ribbon): add font color picker"

# Bug fix
git commit -m "fix(formula): resolve circular reference detection"

# Documentation
git commit -m "docs(readme): update installation instructions"

# Breaking change
git commit -m "feat(api): change cell address format

BREAKING CHANGE: Cell addresses now use {row, col} instead of A1 notation"
```

## Pull Request Process

### Before Submitting

- [ ] Tests pass locally (`npm run test:lib`)
- [ ] Code follows style guidelines
- [ ] Documentation is updated (if needed)
- [ ] CHANGELOG.md is updated (for significant changes)
- [ ] Commit messages follow guidelines
- [ ] Branch is up to date with main

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?
Describe the tests you ran and how to reproduce them.

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix/feature works
- [ ] New and existing unit tests pass locally
```

### Review Process

1. A maintainer will review your PR within a few days
2. Address any feedback or requested changes
3. Once approved, a maintainer will merge your PR
4. Your contribution will be included in the next release!

### After Your PR is Merged

- Delete your branch (GitHub can do this automatically)
- Update your local repository:
  ```bash
  git checkout main
  git pull upstream main
  ```
- Celebrate! 🎉 You've contributed to ng-spreadsheet!

## Questions?

If you have questions about contributing:

1. Check the [documentation](projects/ng-spreadsheet/README.md)
2. Search [existing issues](https://github.com/ashitabi/ng-spreadsheet/issues)
3. Ask in [Discussions](https://github.com/ashitabi/ng-spreadsheet/discussions)
4. Open a new issue with the `question` label

## Thank You!

Your contributions, whether big or small, make ng-spreadsheet better for everyone. We appreciate your time and effort! 🙏

---

**Happy Contributing!** 🚀
