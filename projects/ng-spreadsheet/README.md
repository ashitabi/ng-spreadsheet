# ng-spreadsheet

A production-ready Angular spreadsheet component library with Excel-like functionality, built with Angular 20+ and Angular CDK.

## Features

### Phase 1 - Core Features (✅ Implemented)

- **Excel-like Grid Component**
  - ✅ Virtual scrolling for performance (handles 10,000+ rows smoothly)
  - ✅ Cell selection (single and range selection with mouse/keyboard)
  - ✅ Cell editing (double-click or F2 to edit)
  - ✅ Keyboard navigation (arrow keys, Tab, Enter)
  - ✅ Row and column headers (A, B, C... and 1, 2, 3...)
  - ✅ Undo/redo (Ctrl+Z, Ctrl+Y)
  - ⏳ Resizable columns and rows (coming soon)
  - ⏳ Cell styling (background color, font color, bold, italic, borders) (coming soon)
  - ⏳ Copy/paste functionality (Ctrl+C, Ctrl+V) (coming soon)

### Future Phases (⏳ Planned)

- **Phase 2: Formula Engine** - HyperFormula integration for Excel formulas
- **Phase 3: Styling & Formatting** - Cell styling, toolbar, number formatting
- **Phase 4: Import/Export** - Excel (.xlsx) and PDF support
- **Phase 5: Multiple Sheets** - Sheet tabs, cross-sheet references
- **Phase 6: Polish & Package** - Tests, documentation, npm publishing

## Installation

```bash
npm install ng-spreadsheet
```

Or if building from source:

```bash
npm install
npm run build ng-spreadsheet
```

## Quick Start

### 1. Import the Component

```typescript
import { Component } from '@angular/core';
import { SpreadsheetComponent, SpreadsheetData } from 'ng-spreadsheet';

@Component({
  selector: 'app-root',
  imports: [SpreadsheetComponent],
  template: `
    <ngs-spreadsheet
      [data]="spreadsheetData"
      [height]="600"
      [width]="1000"
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
    // See demo app for complete example
  }

  onCellClick(address: any) {
    console.log('Cell clicked:', address);
  }

  onCellChange(event: any) {
    console.log('Cell changed:', event);
  }
}
```

### 2. Basic Usage with Sample Data

```typescript
import { createDefaultSpreadsheet } from 'ng-spreadsheet';

export class AppComponent {
  // Create a default empty spreadsheet
  spreadsheetData = createDefaultSpreadsheet();
}
```

## API Reference

### SpreadsheetComponent

#### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `data` | `SpreadsheetData` | - | Initial spreadsheet data |
| `height` | `number` | `600` | Height of the spreadsheet in pixels |
| `width` | `number` | `1000` | Width of the spreadsheet in pixels |
| `readonly` | `boolean` | `false` | Whether the spreadsheet is read-only |

#### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `cellClick` | `EventEmitter<CellAddress>` | Emitted when a cell is clicked |
| `cellChange` | `EventEmitter<{address, oldValue, newValue}>` | Emitted when a cell value changes |
| `cellDoubleClick` | `EventEmitter<CellAddress>` | Emitted when a cell is double-clicked |
| `selectionChange` | `EventEmitter<CellAddress \| null>` | Emitted when cell selection changes |

### SpreadsheetDataService

Injectable service for managing spreadsheet state programmatically.

```typescript
import { SpreadsheetDataService } from 'ng-spreadsheet';

constructor(private dataService: SpreadsheetDataService) {
  // Get current data
  const data = this.dataService.getData();

  // Update a cell
  this.dataService.updateCell(0, 0, 'Hello');

  // Select a cell
  this.dataService.selectCell({ row: 0, col: 0 });

  // Undo/Redo
  this.dataService.undo();
  this.dataService.redo();

  // Subscribe to changes
  this.dataService.activeSheet$.subscribe(sheet => {
    console.log('Active sheet:', sheet);
  });
}
```

### Data Models

#### Cell

```typescript
interface Cell {
  row: number;
  col: number;
  value: any;
  displayValue?: string;
  style?: CellStyle;
  isEditing?: boolean;
  isSelected?: boolean;
  readonly?: boolean;
  dataType?: 'string' | 'number' | 'boolean' | 'date' | 'formula' | 'error';
  error?: string;
}
```

#### Sheet

```typescript
interface Sheet {
  id: string;
  name: string;
  cells: Cell[][];
  rowCount: number;
  colCount: number;
  columnWidths?: number[];
  rowHeights?: number[];
  isActive?: boolean;
  defaultColumnWidth?: number;
  defaultRowHeight?: number;
}
```

#### SpreadsheetData

```typescript
interface SpreadsheetData {
  sheets: Sheet[];
  activeSheetIndex: number;
  metadata?: {
    title?: string;
    author?: string;
    createdDate?: Date;
    modifiedDate?: Date;
  };
}
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Arrow Keys | Navigate between cells |
| Tab | Move to next cell (right) |
| Shift + Tab | Move to previous cell (left) |
| Enter | Move to cell below |
| F2 | Start editing selected cell |
| Delete / Backspace | Clear cell content |
| Ctrl+Z / Cmd+Z | Undo last action |
| Ctrl+Y / Cmd+Y | Redo last undone action |
| Shift + Click | Select range of cells |
| Escape | Cancel editing |

## Advanced Usage

### Custom Cell Initialization

```typescript
import { Cell, createEmptyCell } from 'ng-spreadsheet';

function createCustomCell(row: number, col: number): Cell {
  const cell = createEmptyCell(row, col);
  cell.value = `R${row}C${col}`;
  cell.displayValue = cell.value;
  cell.style = {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
  };
  return cell;
}
```

### Working with Cell Addresses

```typescript
import {
  colIndexToLetter,
  colLetterToIndex,
  cellAddressToA1,
  a1ToCellAddress
} from 'ng-spreadsheet';

// Convert column index to letter
colIndexToLetter(0);  // 'A'
colIndexToLetter(25); // 'Z'
colIndexToLetter(26); // 'AA'

// Convert letter to column index
colLetterToIndex('A');  // 0
colLetterToIndex('Z');  // 25
colLetterToIndex('AA'); // 26

// Convert cell address to A1 notation
cellAddressToA1({ row: 0, col: 0 }); // 'A1'

// Parse A1 notation
a1ToCellAddress('B5'); // { row: 4, col: 1 }
```

## Performance

The library is designed for high performance:

- **Virtual Scrolling**: Uses Angular CDK Virtual Scroll to efficiently render only visible cells
- **Handles 10,000+ rows** smoothly with virtual scrolling
- **Immutable State**: Uses immutable patterns for efficient change detection
- **Lazy Rendering**: Only renders cells in the viewport

## Development

### Build the Library

```bash
npm run build ng-spreadsheet
```

### Run the Demo

```bash
npm start demo
```

Then open http://localhost:4200 in your browser.

### Project Structure

```
projects/ng-spreadsheet/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   └── spreadsheet.component.ts
│   │   ├── models/
│   │   │   ├── cell.model.ts
│   │   │   ├── cell-style.model.ts
│   │   │   └── sheet.model.ts
│   │   └── services/
│   │       └── spreadsheet-data.service.ts
│   └── public-api.ts
└── README.md
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Roadmap

- [ ] Column/row resizing
- [ ] Cell styling (colors, borders, fonts)
- [ ] Copy/paste functionality
- [ ] HyperFormula integration for Excel formulas
- [ ] Excel import/export (.xlsx)
- [ ] PDF export
- [ ] Multiple sheet support
- [ ] Context menu
- [ ] Toolbar with formatting options
- [ ] Cell comments
- [ ] Data validation
- [ ] Conditional formatting

## License

MIT

## Credits

Built with:
- [Angular](https://angular.dev) - Web framework
- [Angular CDK](https://material.angular.io/cdk) - Component Dev Kit for virtual scrolling
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript

## Support

For issues and feature requests, please use the [GitHub issue tracker](https://github.com/yourusername/ng-spreadsheet/issues).
