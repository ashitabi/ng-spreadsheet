# ng-spreadsheet

<div align="center">

![ng-spreadsheet](https://img.shields.io/npm/v/ng-spreadsheet?style=flat-square)
![Angular](https://img.shields.io/badge/Angular-20+-red?style=flat-square&logo=angular)
![License](https://img.shields.io/github/license/ashitabi/ng-spreadsheet?style=flat-square)
![Build](https://img.shields.io/github/actions/workflow/status/ashitabi/ng-spreadsheet/build.yml?style=flat-square)

**A production-ready Angular spreadsheet component with Excel-like functionality**

[Features](#features) • [Installation](#installation) • [Demo](#demo) • [Documentation](#documentation) • [Contributing](#contributing)

</div>

---

## 🚀 Features

### Core Spreadsheet Functionality
- ✅ **Virtual Scrolling** - Smoothly handle 10,000+ rows with Angular CDK
- ✅ **Cell Selection** - Single cell and range selection with mouse drag and Shift+click
- ✅ **Cell Editing** - Double-click or F2 to edit, inline editing with formula bar
- ✅ **Keyboard Navigation** - Arrow keys, Tab, Enter, Shift+Tab for navigation
- ✅ **Row/Column Headers** - Interactive Excel-style headers (A, B, C... and 1, 2, 3...)
- ✅ **Column/Row Resizing** - Drag borders to resize with mouse
- ✅ **Context Menu** - Right-click menu with Cut, Copy, Paste, Delete, Insert/Delete operations
- ✅ **Fill Handle** - Excel-like drag-to-fill functionality
- ✅ **Undo/Redo** - Full history tracking with Ctrl+Z and Ctrl+Y (up to 100 actions)
- ✅ **Copy/Paste** - Standard clipboard operations with TSV format support

### Formula Engine (24 Functions)
- **Mathematical**: SUM, AVERAGE, COUNT, MIN, MAX, PRODUCT
- **Statistical**: COUNTA, COUNTBLANK, MEDIAN, MODE, STDEV, VAR, CORREL, PERCENTILE, QUARTILE, RANK
- **Logical**: IF, IFS, IFERROR, IFNA, AND, OR, NOT
- **Lookup**: VLOOKUP (exact and approximate match)
- **Features**: Cell references (A1, B2), ranges (A1:B10), autocomplete, parameter hints, circular reference detection

### Excel-like Ribbon Interface
- **Font Formatting**: Family, size, bold, italic, underline, colors
- **Number Formatting**: General, Number, Currency, Accounting, Percentage, Date, Time
- **Alignment**: Horizontal/vertical alignment, word wrap, merge & center
- **Borders**: All, outline, top, bottom, left, right, none
- **Data Operations**: Sort, filter, search/find
- **Format Painter**: Copy cell formatting
- **Professional SVG Icons**: Platform-independent vector icons

## 📦 Installation

```bash
npm install @ashitrai/ng-spreadsheet
```

## 🎯 Quick Start

### 1. Import the Component

```typescript
import { Component } from '@angular/core';
import { SpreadsheetComponent, SpreadsheetData } from '@ashitrai/ng-spreadsheet';

@Component({
  selector: 'app-root',
  imports: [SpreadsheetComponent],
  template: `
    <ngs-spreadsheet
      [data]="spreadsheetData"
      [height]="600"
      [width]="1200"
      (cellClick)="onCellClick($event)"
      (cellChange)="onCellChange($event)"
    />
  `
})
export class AppComponent {
  spreadsheetData: SpreadsheetData = {
    sheets: [{
      id: 'sheet_1',
      name: 'Sheet1',
      rowCount: 1000,
      colCount: 26,
      cells: this.initializeCells(),
      isActive: true,
    }],
    activeSheetIndex: 0,
  };

  private initializeCells() {
    // Initialize your cell data here
    return [];
  }

  onCellClick(address: any) {
    console.log('Cell clicked:', address);
  }

  onCellChange(event: any) {
    console.log('Cell changed:', event);
  }
}
```

### 2. See it in Action

Check out the [Live Demo](#demo) to see all features in action!

## 📖 Documentation

For complete API documentation, usage examples, and advanced features, visit:
- [Library README](projects/ng-spreadsheet/README.md) - Complete API reference
- [CHANGELOG](CHANGELOG.md) - Version history and changes

## 🎮 Demo

Run the demo application locally:

```bash
# Clone the repository
git clone https://github.com/ashitabi/ng-spreadsheet.git
cd ng-spreadsheet

# Install dependencies
npm install

# Build the library
npm run build:lib

# Run the demo
npm start demo
```

Then open http://localhost:4200 in your browser.

## 🛠️ Development

> **⚠️ Important**: When working with this repository, you **must build the library first** before running the demo app. The demo imports from the built library in `dist/ng-spreadsheet`.

### Building the Library

```bash
# Build once
npm run build:lib

# Build in watch mode (automatically rebuilds on changes)
npm run build:lib:watch
```

**After cloning the repository, always run `npm run build:lib` before starting the demo.**

### Running Tests

```bash
# Run library tests
npm run test:lib

# Run with coverage
npm run test:lib -- --code-coverage
```

### Publishing

```bash
# Test publish (dry run)
npm run publish:lib:dry-run

# Publish to npm
npm run publish:lib
```

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on:
- How to report bugs
- How to suggest features
- How to submit pull requests
- Development workflow
- Code standards

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

Built with:
- [Angular](https://angular.dev) - Web framework
- [Angular CDK](https://material.angular.io/cdk) - Component Dev Kit for virtual scrolling
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript

## 📞 Support

- 🐛 [Report a bug](https://github.com/ashitabi/ng-spreadsheet/issues/new?labels=bug)
- 💡 [Request a feature](https://github.com/ashitabi/ng-spreadsheet/issues/new?labels=enhancement)
- ❓ [Ask a question](https://github.com/ashitabi/ng-spreadsheet/discussions)

## ⭐ Show Your Support

If you find this project useful, please consider giving it a star on GitHub!

---

<div align="center">
Made with ❤️ by the ng-spreadsheet contributors
</div>
