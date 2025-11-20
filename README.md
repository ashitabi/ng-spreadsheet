# ng-spreadsheet Workspace

This is a monorepo workspace containing the ng-spreadsheet library and a demo application.

## Projects

### ng-spreadsheet (Library)

A production-ready Angular spreadsheet component library with Excel-like functionality.

📦 **Location**: `projects/ng-spreadsheet`
📚 **Documentation**: [Library README](projects/ng-spreadsheet/README.md)

### Demo Application

A demo application showcasing the ng-spreadsheet library features.

📦 **Location**: `projects/demo`

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Library

```bash
npm run build ng-spreadsheet
```

### 3. Run the Demo

```bash
npm start demo
```

Then open http://localhost:4200 in your browser.

## Development Workflow

### Building the Library

```bash
# Build once
npm run build ng-spreadsheet

# Watch mode (rebuild on changes)
npm run build ng-spreadsheet -- --watch
```

### Running the Demo

```bash
# Serve the demo app
npm start demo

# Or with specific port
ng serve demo --port 4200
```

### Testing

```bash
# Run tests for the library
ng test ng-spreadsheet

# Run tests for the demo
ng test demo
```

## Project Structure

```
ng-spreadsheet-workspace/
├── projects/
│   ├── ng-spreadsheet/          # Library source code
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── components/
│   │   │   │   ├── models/
│   │   │   │   └── services/
│   │   │   └── public-api.ts
│   │   ├── README.md
│   │   └── package.json
│   └── demo/                    # Demo application
│       ├── src/
│       │   └── app/
│       └── package.json
├── dist/
│   ├── ng-spreadsheet/          # Built library
│   └── demo/                    # Built demo app
├── angular.json
├── package.json
└── README.md
```

## Features Implemented (Phase 1)

- ✅ Virtual scrolling for 10,000+ rows
- ✅ Cell selection (single and range)
- ✅ Cell editing (double-click or F2)
- ✅ Keyboard navigation (arrows, Tab, Enter)
- ✅ Row and column headers (A, B, C... and 1, 2, 3...)
- ✅ Undo/redo (Ctrl+Z, Ctrl+Y)
- ✅ Reactive state management with RxJS
- ✅ TypeScript strict mode
- ✅ Standalone Angular components

## Upcoming Features

- ⏳ Column/row resizing
- ⏳ Cell styling (colors, borders, fonts)
- ⏳ Copy/paste functionality
- ⏳ HyperFormula integration for Excel formulas
- ⏳ Excel import/export (.xlsx)
- ⏳ PDF export
- ⏳ Multiple sheet support
- ⏳ Context menu
- ⏳ Toolbar with formatting options

## Technology Stack

- **Angular 20+** - Latest Angular framework
- **TypeScript** - Type-safe JavaScript
- **Angular CDK** - Component Dev Kit for virtual scrolling
- **RxJS** - Reactive state management

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT
