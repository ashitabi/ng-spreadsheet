# ng-spreadsheet

A production-ready Angular spreadsheet component library with Excel-like functionality, built with Angular 20+ and Angular CDK.

## Features

### Core Spreadsheet Functionality ✅

- **Virtual Scrolling**: Smooth handling of 10,000+ rows using Angular CDK Virtual Scroll
- **Cell Selection**: Single cell and range selection with mouse drag and Shift+click
- **Cell Editing**: Double-click or F2 to edit, inline editing with formula bar support
- **Keyboard Navigation**: Arrow keys, Tab, Enter, Shift+Tab for seamless navigation
- **Row/Column Headers**: Interactive headers (A, B, C... and 1, 2, 3...)
- **Column Resizing**: Drag column borders to resize with mouse
- **Row Resizing**: Drag row borders to resize with mouse
- **Context Menu**: Right-click menu with Cut, Copy, Paste, Delete, Insert/Delete Row/Column
- **Fill Handle**: Excel-like green square for drag-to-fill functionality
- **Undo/Redo**: Full history tracking with Ctrl+Z and Ctrl+Y (up to 100 actions)
- **Copy/Paste**: Ctrl+C/V support with TSV format

### Formula Engine ✅ (23 Functions)

**Mathematical Functions:**
- `SUM`, `AVERAGE`, `COUNT`, `MIN`, `MAX`, `PRODUCT`

**Statistical Functions:**
- `COUNTA`, `COUNTBLANK`, `MEDIAN`, `MODE`, `STDEV`, `VAR`, `CORREL`, `PERCENTILE`, `QUARTILE`, `RANK`

**Logical Functions:**
- `IF`, `IFS`, `IFERROR`, `IFNA`, `AND`, `OR`, `NOT`

**Formula Features:**
- Cell references (A1, B2) and ranges (A1:B10)
- Formula autocomplete with function suggestions
- Parameter hints showing function syntax
- Automatic recalculation when dependencies change
- Circular reference detection

### Excel-like Ribbon ✅

**Font Formatting:**
- Font family selection (Arial, Calibri, Times New Roman, Courier New, Verdana, Georgia)
- Font size (10-24px)
- Bold, Italic, Underline
- Text color and background color pickers

**Number Formatting:**
- Formats: General, Number, Currency, Accounting, Percentage, Date, Time
- Increase/decrease decimal places

**Alignment:**
- Horizontal alignment (Left, Center, Right)
- Word wrap toggle

**Data Operations:**
- Sort ascending/descending by column
- Filter toggle
- Search/Find functionality

### Coming Soon ⏳

- **Merge & Center** cells
- **Cell borders** (all, outline, top, bottom, left, right)
- **Vertical alignment** (top, middle, bottom)
- **Format Painter** to copy cell formatting
- **Paste Special** (values, formats, formulas)
- **Clear options** (all, contents, formats)
- **AutoFit column width** to content
- **Freeze panes**
- **Data validation**
- **Conditional formatting**
- **Excel (.xlsx) import/export**
- **Multiple sheet tabs**

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

**Completed:**
- [x] Column/row resizing
- [x] Cell styling (colors, fonts, alignment)
- [x] Copy/paste functionality
- [x] Formula engine (23 functions)
- [x] Context menu
- [x] Ribbon with formatting options
- [x] Undo/redo support

**In Progress:**
- [ ] Merge & Center cells
- [ ] Cell borders
- [ ] Vertical alignment
- [ ] Format Painter
- [ ] Paste Special
- [ ] Clear options
- [ ] AutoFit column width

**Planned:**
- [ ] Freeze panes
- [ ] Advanced filtering
- [ ] Data validation
- [ ] Conditional formatting
- [ ] Cell comments
- [ ] Excel import/export (.xlsx)
- [ ] CSV import/export
- [ ] PDF export
- [ ] Multiple sheet support with tabs
- [ ] Cross-sheet formula references
- [ ] Advanced formulas (VLOOKUP, HLOOKUP, INDEX, MATCH, etc.)
- [ ] Date/Time functions
- [ ] Text manipulation functions

## License

MIT

## Credits

Built with:
- [Angular](https://angular.dev) - Web framework
- [Angular CDK](https://material.angular.io/cdk) - Component Dev Kit for virtual scrolling
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript

## Support

For issues and feature requests, please use the [GitHub issue tracker](https://github.com/yourusername/ng-spreadsheet/issues).
