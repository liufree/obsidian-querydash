# AGENTS.md - Obsidian QueryDash Plugin

This document provides essential information for AI agents working on the Obsidian QueryDash plugin codebase.

## Project Overview

Obsidian QueryDash is a plugin that provides enhanced views for Obsidian Bases and Dataview data, offering table, list, timeline, and memory card views with features similar to Notion databases.

## Build Commands

### Development
```bash
npm run dev          # Build with watch mode for development
```

### Production
```bash
npm run build        # Build for production
```

### Version Management
```bash
npm run version      # Bump version and update manifest.json
```

## Code Quality & Linting

### ESLint Configuration
- Uses TypeScript ESLint with recommended rules
- Run linting: `npx eslint . --ext .ts,.tsx`
- Configuration file: `.eslintrc`

### Key ESLint Rules
- `no-unused-vars`: Off (handled by TypeScript version)
- `@typescript-eslint/no-unused-vars`: Error (except function arguments)
- `@typescript-eslint/ban-ts-comment`: Off (allows TypeScript directives)
- `@typescript-eslint/no-empty-function`: Off

### Editor Configuration
- **Indentation**: Tabs (4 spaces width)
- **Line Endings**: LF
- **Charset**: UTF-8
- **Final Newline**: Required
- Configuration file: `.editorconfig`

## TypeScript Configuration

### Compiler Options (`tsconfig.json`)
- **Target**: ES6
- **Module**: ESNext
- **JSX**: React
- **Strict**: `noImplicitAny`, `strictNullChecks`
- **Module Resolution**: Node
- **Allow Synthetic Default Imports**: true
- **Lib**: DOM, ES5, ES6, ES7

### Type Checking
```bash
npx tsc --noEmit    # Type check without emitting files
```

## Code Style Guidelines

### File Structure
- Source code in `src/` directory
- Main entry point: `src/main.tsx`
- Pages/components in `src/pages/`
- Models in `src/models/`
- Components in `src/components/`

### Naming Conventions
- **Files**: PascalCase for components (e.g., `QueryDashView.tsx`), camelCase for utilities
- **Components**: PascalCase (e.g., `DashTableView`, `QueryDashView`)
- **Variables/Functions**: camelCase
- **Types/Interfaces**: PascalCase
- **Constants**: UPPER_SNAKE_CASE

### Import Organization
1. External dependencies (React, Obsidian)
2. Internal modules
3. Type imports
4. Style imports

Example:
```typescript
import React, {useEffect, useState} from 'react';
import {App} from "obsidian";
import TableView from "./tableview/TableView";
import {ConfigProvider, theme} from "antd";
```

### React Components
- Use functional components with TypeScript
- Define props interfaces with `interface` keyword
- Use `React.FC<Props>` type for components
- Prefer explicit return types for complex components

Example:
```typescript
interface QueryDashViewProps {
    app: App;
    source: string;
}

const QueryDashView: React.FC<QueryDashViewProps> = ({app, source}) => {
    // Component implementation
};
```

### TypeScript Usage
- Always use TypeScript strict mode
- Define explicit types for function parameters and return values
- Use interfaces for object shapes
- Avoid `any` type; use `unknown` or specific types
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safe property access

### Error Handling
- Use try-catch blocks for async operations
- Log errors with appropriate context
- Return meaningful error messages to users
- Validate inputs before processing

### State Management
- Use React hooks (`useState`, `useEffect`)
- Keep state as local as possible
- Lift state up when shared between components
- Use proper dependency arrays in `useEffect`

### Styling
- Use Ant Design components as primary UI library
- Theme follows Obsidian's dark/light mode
- Custom styles in CSS when needed
- Responsive design considerations

## Testing

### Current Status
- No formal test framework configured
- Manual testing through Obsidian plugin installation
- Consider adding Jest/Vitest for unit tests

### Recommended Test Structure
```bash
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
└── e2e/           # End-to-end tests
```

## Dependencies

### Core Dependencies
- **React**: UI library
- **Ant Design**: Component library
- **Obsidian API**: Plugin framework
- **Dataview**: Data querying

### Development Dependencies
- **TypeScript**: Type safety
- **ESLint**: Code linting
- **Vite**: Build tool
- **Husky**: Git hooks
- **lint-staged**: Pre-commit linting

## Git Workflow

### Commit Messages
- Use conventional commits format
- Start with type: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`
- Keep first line under 50 characters
- Provide detailed description in body

### Branch Strategy
- `main`: Production releases
- `dev`: Development branch
- Feature branches: `feature/description`
- Bug fix branches: `fix/issue-description`

### Pre-commit Hooks
- Husky configured for pre-commit hooks
- lint-staged runs ESLint on staged files
- Ensure code passes linting before commit

## Plugin Development Notes

### Obsidian Plugin API
- Extend `Plugin` class
- Register markdown code block processors
- Register Bases views when applicable
- Clean up resources in `onunload()`

### Build Output
- Main file: `main.js`
- Styles: `styles.css`
- Manifest: `manifest.json`
- Source maps in development mode

### Version Management
- Update `manifest.json` version
- Update `versions.json` for compatibility
- Use `npm run version` script

## Performance Considerations

- Use React.memo for expensive components
- Implement virtualization for large lists
- Lazy load heavy components
- Optimize re-renders with proper dependency arrays
- Monitor bundle size with Vite build

## Security Best Practices

- Sanitize user inputs
- Validate file paths and URLs
- Use Obsidian's safe APIs for file operations
- Avoid eval() or similar dangerous functions
- Keep dependencies updated

## Troubleshooting

### Common Issues
1. **Build failures**: Check TypeScript errors first
2. **Plugin not loading**: Verify manifest.json and main.js exist
3. **UI not rendering**: Check React component errors in console
4. **Type errors**: Ensure proper TypeScript configuration

### Debugging
- Use `console.log` with appropriate context
- Check browser developer tools
- Enable source maps in development
- Test in Obsidian's developer mode

## Contributing Guidelines

1. Follow existing code patterns and conventions
2. Add TypeScript types for new features
3. Update documentation when changing APIs
4. Test changes in Obsidian before committing
5. Keep bundle size minimal

## Resources

- [Obsidian Plugin Docs](https://docs.obsidian.md/Home)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Ant Design Components](https://ant.design/components/overview/)
- [Vite Documentation](https://vitejs.dev/guide/)