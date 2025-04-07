# Contributing to HMCTS Task Manager

Thank you for your interest in contributing to the HMCTS Task Manager project! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
  - [Branching Strategy](#branching-strategy)
  - [Commit Messages](#commit-messages)
  - [Pull Requests](#pull-requests)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Issue Reporting](#issue-reporting)
- [Security Vulnerabilities](#security-vulnerabilities)

## Code of Conduct

This project adheres to the Contributor Covenant [code of conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [your-email@example.com](mailto:your-email@example.com).

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork to your local machine
3. Set up the development environment as described in the [README.md](README.md#getting-started)
4. Create a new branch for your contribution

## Development Process

### Branching Strategy

We follow a simplified Git flow:

- `main` - Production-ready code
- `develop` - Development branch for integrating features
- `feature/*` - Feature branches (e.g., `feature/user-authentication`)
- `bugfix/*` - Bug fix branches (e.g., `bugfix/login-error`)
- `hotfix/*` - Urgent fixes for production issues

### Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Types include:
- `feat` - New features
- `fix` - Bug fixes
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code changes that neither fix bugs nor add features
- `test` - Adding or updating tests
- `chore` - Changes to the build process or auxiliary tools

Examples:
```
feat(auth): add Google authentication option
fix(tasks): correct date formatting in task display
docs: update API endpoints in README
```

### Pull Requests

1. Update your feature branch with the latest changes from `develop`
2. Ensure your code passes all tests
3. Push your branch to your fork
4. Submit a pull request to the `develop` branch
5. Ensure the PR description clearly describes the changes and their purpose
6. Reference any related issues using the GitHub issue numbers

## Coding Standards

- **JavaScript/React**: Follow the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- **CSS**: Follow the [BEM methodology](http://getbem.com/) for class naming
- **File naming**: Use camelCase for JavaScript files, PascalCase for React components

### Code Formatting

We use ESLint and Prettier to maintain code quality and consistent formatting:

```bash
# Check for linting issues
npm run lint

# Fix auto-fixable linting issues
npm run lint:fix

# Format code with Prettier
npm run format
```

## Testing

All new features and bug fixes should include appropriate tests:

- **Frontend**: Use Jest and React Testing Library
- **Backend**: Use Jest for unit and integration tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

Aim for at least 70% code coverage for new features.

## Documentation

- Update the README.md if you change functionality or add features
- Document all public APIs, components, and functions
- Include JSDoc comments for all functions and complex code blocks
- Update API documentation when changing endpoints

## Issue Reporting

If you find a bug or want to request a new feature:

1. Check existing issues to avoid duplicates
2. Use the issue templates provided
3. Include clear steps to reproduce bugs
4. Provide screenshots or screen recordings if relevant
5. Suggest solutions if possible

## Security Vulnerabilities

If you discover a security vulnerability, please do NOT open an issue. Email [your-email@example.com](mailto:your-email@example.com) instead.

---

Thank you for contributing to the HMCTS Task Manager project! 