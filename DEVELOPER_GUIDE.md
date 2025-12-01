# ng-spreadsheet Developer Guide

> Comprehensive developer documentation for the ng-spreadsheet library - A production-ready Angular spreadsheet component with Excel-like functionality.

**Version:** 0.2.2
**Angular Version:** 20+
**License:** MIT

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Installation](#installation)
4. [Quick Start](#quick-start)
5. [Features Overview](#features-overview)
6. [API Reference](#api-reference)
7. [Formula Reference](#formula-reference)
8. [Usage Examples](#usage-examples)
9. [Advanced Topics](#advanced-topics)
10. [Styling and Theming](#styling-and-theming)
11. [Keyboard Shortcuts](#keyboard-shortcuts)
12. [Performance Optimization](#performance-optimization)
13. [Browser Support](#browser-support)
14. [Troubleshooting](#troubleshooting)
15. [Contributing](#contributing)

---

## Introduction

ng-spreadsheet is a feature-rich, production-ready Angular component library that provides Excel-like spreadsheet functionality. Built with Angular 20+ and TypeScript, it offers virtual scrolling for handling large datasets, a comprehensive formula engine with 24 functions, and an intuitive Excel-like ribbon interface.

### Key Features

- **Virtual Scrolling**: Handle 10,000+ rows smoothly with Angular CDK Virtual Scroll
- **Formula Engine**: 24 built-in functions (mathematical, statistical, logical, lookup)
- **Excel-like UI**: Familiar ribbon interface with formatting, alignment, and data operations
- **Rich Editing**: Cell editing, copy/paste, undo/redo, drag-to-fill
- **Customizable**: Full TypeScript support with reactive state management
- **Performance**: OnPush change detection and optimized rendering

### Use Cases

- Data grids and tables with formula support
- Financial calculators and spreadsheets
- Data analysis and reporting tools
- Budget planning applications
- Inventory management systems
- Any application requiring Excel-like data manipulation

---

## Getting Started

### Prerequisites

Before installing ng-spreadsheet, ensure you have:

- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **Angular**: v20.0.0 or higher
- **Angular CDK**: v20.0.0 or higher

### System Requirements

- **TypeScript**: 5.9 or higher
- **RxJS**: 7.8 or higher
- **Browsers**: Chrome, Firefox, Safari, Edge (latest 2 versions)

---

## Installation

### Step 1: Install the Package

```bash
npm install @ashitrai/ng-spreadsheet
```

### Step 2: Install Peer Dependencies

If not already installed, add Angular CDK:

```bash
npm install @angular/cdk
```

### Step 3: Import the Component

ng-spreadsheet uses standalone components, so no module imports are needed.

```typescript
import { Component } from '@angular/core';
import { SpreadsheetComponent } from '@ashitrai/ng-spreadsheet';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SpreadsheetComponent],
  template: `<ngs-spreadsheet></ngs-spreadsheet>`
})
export class AppComponent {}
```

---

## Quick Start

### Basic Example

Here's a minimal example to get you started:

```typescript
import { Component } from '@angular/core';
import { SpreadsheetComponent, SpreadsheetData } from '@ashitrai/ng-spreadsheet';

@Component({
  selector: 'app-demo',
  standalone: true,
  imports: [SpreadsheetComponent],
  template: `
    <div style="height: 600px;">
      <ngs-spreadsheet [initialData]="spreadsheetData"></ngs-spreadsheet>
    </div>
  `
})
export class DemoComponent {
  spreadsheetData: SpreadsheetData = {
    sheets: [
      {
        id: 'sheet1',
        name: 'Sheet 1',
        rows: 1000,
        cols: 26,
        data: [
          [
            { row: 0, col: 0, value: 'Product' },
            { row: 0, col: 1, value: 'Price' },
            { row: 0, col: 2, value: 'Quantity' },
            { row: 0, col: 3, value: 'Total' }
          ],
          [
            { row: 1, col: 0, value: 'Apple' },
            { row: 1, col: 1, value: 2.5 },
            { row: 1, col: 2, value: 10 },
            { row: 1, col: 3, value: '=B2*C2' }
          ]
        ],
        columnWidths: {},
        rowHeights: {}
      }
    ],
    activeSheetId: 'sheet1'
  };
}
```

### With Custom Styling

```typescript
@Component({
  selector: 'app-styled-demo',
  standalone: true,
  imports: [SpreadsheetComponent],
  styles: [`
    .spreadsheet-container {
      height: 800px;
      width: 100%;
      border: 1px solid #d4d4d4;
      border-radius: 8px;
      overflow: hidden;
    }
  `],
  template: `
    <div class="spreadsheet-container">
      <ngs-spreadsheet [initialData]="data"></ngs-spreadsheet>
    </div>
  `
})
export class StyledDemoComponent {
  // ... data
}
```

---

## Features Overview

### Core Spreadsheet Features

#### 1. Cell Selection and Editing

- **Single Cell Selection**: Click on any cell
- **Range Selection**: Click and drag to select multiple cells
- **Shift+Click**: Extend selection from active cell
- **Cell Editing**: Double-click or press F2 to edit
- **Formula Bar**: View and edit cell content in the formula bar

#### 2. Keyboard Navigation

- **Arrow Keys**: Navigate between cells
- **Tab**: Move to next cell (Shift+Tab for previous)
- **Enter**: Move down (Shift+Enter for up)
- **Home**: Jump to column A
- **Ctrl+Home**: Jump to cell A1

#### 3. Copy/Paste Operations

- **Ctrl+C / Cmd+C**: Copy selected cells
- **Ctrl+V / Cmd+V**: Paste to active cell
- **Ctrl+X / Cmd+X**: Cut selected cells
- **Format**: TSV (Tab-Separated Values) for clipboard

#### 4. Fill Handle

- Drag the green square at the bottom-right of selection
- Auto-fills formulas and values
- Smart number sequences

#### 5. Undo/Redo

- **Ctrl+Z / Cmd+Z**: Undo last action
- **Ctrl+Y / Cmd+Y**: Redo last undone action
- **History Limit**: Up to 100 actions

#### 6. Context Menu

Right-click on cells for quick access to:
- Cut, Copy, Paste
- Delete Cell Contents
- Insert Row/Column
- Delete Row/Column

### Formula Engine Features

#### Formula Support

- **24 built-in functions** across 4 categories
- **Cell references**: A1, B2, $A$1 (absolute)
- **Range notation**: A1:B10
- **Formula autocomplete**: Type `=` and start typing function name
- **Parameter hints**: Shows function syntax while typing
- **Circular reference detection**: Prevents infinite loops
- **Automatic recalculation**: Updates when dependent cells change

### Formatting Features

#### Font Formatting

- **Font Family**: Arial, Calibri, Times New Roman, Georgia, Verdana, Courier New
- **Font Size**: 10px to 24px
- **Font Style**: Bold, Italic, Underline
- **Text Color**: Full color picker
- **Background Color**: Full color picker

#### Number Formatting

- General
- Number (with decimal precision)
- Currency ($)
- Accounting
- Percentage (%)
- Date (MM/DD/YYYY)
- Time (HH:MM:SS)

#### Alignment

- **Horizontal**: Left, Center, Right
- **Vertical**: Top, Middle, Bottom
- **Text Wrap**: Enable/disable word wrap
- **Merge Cells**: Merge & Center

#### Borders

- All Borders
- Outline Border
- Top, Bottom, Left, Right
- No Border

### Data Operations

- **Sort**: Ascending/Descending by selected column
- **Filter**: Toggle filter mode (UI only)
- **Find**: Search for text in spreadsheet
- **Clear**: Clear All, Contents, or Formats

---

## API Reference

### SpreadsheetComponent

The main component for rendering the spreadsheet.

#### Selector

```html
<ngs-spreadsheet></ngs-spreadsheet>
```

#### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `initialData` | `SpreadsheetData` | Empty sheet | Initial spreadsheet data |

#### Outputs

*Currently, the component uses a service-based approach. Direct outputs coming in future versions.*

#### Methods

Access component methods via `@ViewChild`:

```typescript
@ViewChild(SpreadsheetComponent) spreadsheet!: SpreadsheetComponent;

// Example methods available:
this.spreadsheet.selectCell(row, col);
this.spreadsheet.clearSelection();
```

### SpreadsheetDataService

Centralized reactive state management service.

#### Injection

```typescript
import { SpreadsheetDataService } from '@ashitrai/ng-spreadsheet';

constructor(private dataService: SpreadsheetDataService) {}
```

#### Observables

| Observable | Type | Description |
|------------|------|-------------|
| `data$` | `BehaviorSubject<SpreadsheetData>` | Complete spreadsheet data |
| `activeSheet$` | `Observable<Sheet \| null>` | Currently active sheet |
| `selectedCell$` | `Observable<{row: number, col: number} \| null>` | Selected cell coordinates |
| `selectedRange$` | `Observable<CellRange \| null>` | Selected range |
| `editingCell$` | `Observable<{row: number, col: number} \| null>` | Cell being edited |
| `clipboard$` | `BehaviorSubject<Cell[][] \| null>` | Clipboard data |

#### Methods

**Cell Operations**

```typescript
// Update a cell
updateCell(row: number, col: number, updates: Partial<Cell>): void

// Select a cell
selectCell(row: number, col: number): void

// Select a range
selectRange(range: CellRange): void

// Start editing
startEditing(row: number, col: number): void

// Stop editing
stopEditing(): void

// Clear cell contents
clearCell(row: number, col: number): void
```

**Row/Column Operations**

```typescript
// Insert row
insertRow(index: number): void

// Delete row
deleteRow(index: number): void

// Insert column
insertColumn(index: number): void

// Delete column
deleteColumn(index: number): void

// Set column width
setColumnWidth(col: number, width: number): void

// Set row height
setRowHeight(row: number, height: number): void
```

**Clipboard Operations**

```typescript
// Copy selected cells
copy(): void

// Cut selected cells
cut(): void

// Paste clipboard data
paste(): void
```

**Undo/Redo**

```typescript
// Undo last action
undo(): void

// Redo last undone action
redo(): void

// Check if undo is available
canUndo(): boolean

// Check if redo is available
canRedo(): boolean
```

**Data Management**

```typescript
// Get current data
getData(): SpreadsheetData

// Load new data
loadData(data: SpreadsheetData): void

// Get active sheet
getActiveSheet(): Sheet | null

// Get cell value
getCellValue(row: number, col: number): string | number | null
```

### FormulaService

Service for evaluating spreadsheet formulas.

#### Injection

```typescript
import { FormulaService } from '@ashitrai/ng-spreadsheet';

constructor(private formulaService: FormulaService) {}
```

#### Methods

```typescript
// Evaluate a formula
evaluateFormula(
  formula: string,
  cells: Cell[][],
  currentRow: number,
  currentCol: number
): string | number
```

**Example:**

```typescript
const result = this.formulaService.evaluateFormula(
  '=SUM(A1:A10)',
  sheetCells,
  5,
  5
);
console.log(result); // Returns sum of A1:A10
```

---

## Formula Reference

ng-spreadsheet includes 24 built-in functions across 4 categories.

### Mathematical Functions

#### SUM

Adds all numbers in a range.

```excel
=SUM(A1:A10)
=SUM(B2:B5)
```

**Parameters**: `range`
**Returns**: Sum of all numeric values
**Example**: `=SUM(A1:A10)` → 55 (if cells contain 1-10)

#### AVERAGE

Returns the average of numbers in a range.

```excel
=AVERAGE(A1:A10)
```

**Parameters**: `range`
**Returns**: Mean of all numeric values
**Example**: `=AVERAGE(A1:A10)` → 5.5

#### COUNT

Counts the number of numeric values in a range.

```excel
=COUNT(A1:A10)
```

**Parameters**: `range`
**Returns**: Count of numeric cells
**Example**: `=COUNT(A1:A10)` → 10

#### MIN

Returns the minimum value in a range.

```excel
=MIN(A1:A10)
```

**Parameters**: `range`
**Returns**: Smallest numeric value
**Example**: `=MIN(A1:A10)` → 1

#### MAX

Returns the maximum value in a range.

```excel
=MAX(A1:A10)
```

**Parameters**: `range`
**Returns**: Largest numeric value
**Example**: `=MAX(A1:A10)` → 10

#### PRODUCT

Multiplies all numbers in a range.

```excel
=PRODUCT(A1:A5)
```

**Parameters**: `range`
**Returns**: Product of all values
**Example**: `=PRODUCT(A1:A3)` → 6 (if cells contain 1, 2, 3)

### Statistical Functions

#### COUNTA

Counts non-empty cells in a range.

```excel
=COUNTA(A1:A10)
```

**Parameters**: `range`
**Returns**: Count of non-empty cells
**Example**: `=COUNTA(A1:A10)` → 8 (if 8 cells have content)

#### COUNTBLANK

Counts empty cells in a range.

```excel
=COUNTBLANK(A1:A10)
```

**Parameters**: `range`
**Returns**: Count of empty cells
**Example**: `=COUNTBLANK(A1:A10)` → 2

#### MEDIAN

Returns the median (middle) value.

```excel
=MEDIAN(A1:A10)
```

**Parameters**: `range`
**Returns**: Median value
**Example**: `=MEDIAN(A1:A5)` → 3 (for 1,2,3,4,5)

#### MODE

Returns the most frequently occurring value.

```excel
=MODE(A1:A10)
```

**Parameters**: `range`
**Returns**: Most frequent value
**Example**: `=MODE(A1:A10)` → 5 (if 5 appears most)

#### STDEV

Calculates the sample standard deviation.

```excel
=STDEV(A1:A10)
```

**Parameters**: `range`
**Returns**: Standard deviation
**Example**: `=STDEV(A1:A10)` → 3.02765...

#### VAR

Calculates the sample variance.

```excel
=VAR(A1:A10)
```

**Parameters**: `range`
**Returns**: Variance
**Example**: `=VAR(A1:A10)` → 9.16666...

#### CORREL

Calculates correlation coefficient between two ranges.

```excel
=CORREL(A1:A10, B1:B10)
```

**Parameters**: `array1, array2`
**Returns**: Correlation coefficient (-1 to 1)
**Example**: `=CORREL(A1:A5, B1:B5)` → 0.95 (strong positive correlation)

#### PERCENTILE

Returns the k-th percentile of values.

```excel
=PERCENTILE(A1:A10, 0.75)
```

**Parameters**: `array, k` (k is 0 to 1)
**Returns**: k-th percentile value
**Example**: `=PERCENTILE(A1:A10, 0.5)` → median value

#### QUARTILE

Returns the quartile of a dataset.

```excel
=QUARTILE(A1:A10, 1)
```

**Parameters**: `array, quart` (quart is 0-4)
**Returns**: Quartile value
**Example**: `=QUARTILE(A1:A10, 1)` → 25th percentile

#### RANK

Returns the rank of a number in a list.

```excel
=RANK(A2, A1:A10, 0)
```

**Parameters**: `number, ref, [order]` (order: 0=descending, 1=ascending)
**Returns**: Rank position
**Example**: `=RANK(95, A1:A10, 0)` → 2 (if 95 is 2nd highest)

### Logical Functions

#### IF

Returns one value if condition is true, another if false.

```excel
=IF(A1>10, "High", "Low")
```

**Parameters**: `condition, value_if_true, value_if_false`
**Returns**: value_if_true or value_if_false
**Example**: `=IF(A1>10, "Pass", "Fail")`

#### IFS

Tests multiple conditions.

```excel
=IFS(A1>90, "A", A1>80, "B", A1>70, "C")
```

**Parameters**: `condition1, value1, condition2, value2, ...`
**Returns**: First matching value
**Example**: `=IFS(A1>=90, "A", A1>=80, "B", TRUE, "F")`

#### IFERROR

Returns a value if error, otherwise returns the formula result.

```excel
=IFERROR(A1/B1, 0)
```

**Parameters**: `value, value_if_error`
**Returns**: value or value_if_error
**Example**: `=IFERROR(VLOOKUP(A1, B:C, 2, 0), "Not Found")`

#### IFNA

Returns a value if #N/A error, otherwise returns the formula result.

```excel
=IFNA(VLOOKUP(A1, B:D, 2, 0), "Not Found")
```

**Parameters**: `value, value_if_na`
**Returns**: value or value_if_na
**Example**: `=IFNA(VLOOKUP(A1, B:C, 2, 0), "N/A")`

#### AND

Returns TRUE if all conditions are true.

```excel
=AND(A1>10, B1<20)
```

**Parameters**: `logical1, logical2, ...`
**Returns**: TRUE or FALSE
**Example**: `=AND(A1>0, B1>0, C1>0)` → TRUE if all positive

#### OR

Returns TRUE if any condition is true.

```excel
=OR(A1>10, B1>10)
```

**Parameters**: `logical1, logical2, ...`
**Returns**: TRUE or FALSE
**Example**: `=OR(A1="Yes", B1="Yes")` → TRUE if any is "Yes"

#### NOT

Reverses the logic of its argument.

```excel
=NOT(A1>10)
```

**Parameters**: `logical`
**Returns**: TRUE or FALSE
**Example**: `=NOT(A1="")` → TRUE if A1 is not empty

### Lookup Functions

#### VLOOKUP

Looks up a value in the first column of a range and returns a value in the same row from another column.

```excel
=VLOOKUP(A2, B1:D10, 3, FALSE)
=VLOOKUP(100, A1:C50, 2, TRUE)
```

**Parameters**: `lookup_value, table_array, col_index_num, [range_lookup]`
- `lookup_value`: Value to search for
- `table_array`: Range to search in (e.g., B1:D10)
- `col_index_num`: Column number to return (1-based)
- `range_lookup`: FALSE for exact match, TRUE for approximate match (optional, default TRUE)

**Returns**: Value from the specified column
**Error Returns**: #N/A if not found, #ERROR! for invalid arguments

**Examples**:

```excel
// Exact match lookup
=VLOOKUP("Apple", A1:C10, 2, FALSE)
// Finds "Apple" in column A, returns value from column B

// Approximate match lookup (requires sorted first column)
=VLOOKUP(85, A1:B10, 2, TRUE)
// Finds largest value ≤ 85 in column A, returns from column B

// Using cell reference as lookup value
=VLOOKUP(A2, Products!B1:D100, 3, 0)
// Looks up value in A2, returns from 3rd column of range
```

**Tips**:
- First column of table_array must contain the lookup values
- col_index_num starts at 1 (first column of range)
- Use FALSE/0 for exact match, TRUE/1 for approximate match
- For approximate match, first column should be sorted ascending
- Returns #N/A if lookup_value not found

---

## Usage Examples

### Example 1: Basic Spreadsheet with Formulas

```typescript
import { Component } from '@angular/core';
import { SpreadsheetComponent, SpreadsheetData } from '@ashitrai/ng-spreadsheet';

@Component({
  selector: 'app-sales-report',
  standalone: true,
  imports: [SpreadsheetComponent],
  template: `
    <div class="report-container">
      <h2>Sales Report</h2>
      <ngs-spreadsheet [initialData]="salesData"></ngs-spreadsheet>
    </div>
  `,
  styles: [`
    .report-container {
      padding: 20px;
      height: 100vh;
    }
  `]
})
export class SalesReportComponent {
  salesData: SpreadsheetData = {
    sheets: [{
      id: 'sales',
      name: 'Q1 Sales',
      rows: 100,
      cols: 10,
      data: [
        [
          { row: 0, col: 0, value: 'Product', style: { bold: true } },
          { row: 0, col: 1, value: 'Units', style: { bold: true } },
          { row: 0, col: 2, value: 'Price', style: { bold: true } },
          { row: 0, col: 3, value: 'Total', style: { bold: true } }
        ],
        [
          { row: 1, col: 0, value: 'Laptop' },
          { row: 1, col: 1, value: 50 },
          { row: 1, col: 2, value: 999.99 },
          { row: 1, col: 3, value: '=B2*C2' }
        ],
        [
          { row: 2, col: 0, value: 'Mouse' },
          { row: 2, col: 1, value: 200 },
          { row: 2, col: 2, value: 29.99 },
          { row: 2, col: 3, value: '=B3*C3' }
        ],
        [
          { row: 3, col: 0, value: 'Keyboard' },
          { row: 3, col: 1, value: 150 },
          { row: 3, col: 2, value: 79.99 },
          { row: 3, col: 3, value: '=B4*C4' }
        ],
        [
          { row: 4, col: 0, value: 'Total', style: { bold: true } },
          { row: 4, col: 1, value: '=SUM(B2:B4)' },
          { row: 4, col: 2, value: '' },
          { row: 4, col: 3, value: '=SUM(D2:D4)', style: { bold: true } }
        ]
      ],
      columnWidths: { 0: 150, 1: 100, 2: 100, 3: 120 },
      rowHeights: {}
    }],
    activeSheetId: 'sales'
  };
}
```

### Example 2: Programmatic Data Access

```typescript
import { Component, OnInit } from '@angular/core';
import { SpreadsheetComponent, SpreadsheetDataService } from '@ashitrai/ng-spreadsheet';

@Component({
  selector: 'app-data-manager',
  standalone: true,
  imports: [SpreadsheetComponent],
  template: `
    <div>
      <button (click)="exportData()">Export Data</button>
      <button (click)="updateCell()">Update Cell</button>
      <button (click)="calculateSum()">Calculate Sum</button>
      <ngs-spreadsheet [initialData]="data"></ngs-spreadsheet>
    </div>
  `
})
export class DataManagerComponent implements OnInit {
  data!: SpreadsheetData;

  constructor(private dataService: SpreadsheetDataService) {}

  ngOnInit() {
    // Subscribe to data changes
    this.dataService.data$.subscribe(data => {
      console.log('Data updated:', data);
    });
  }

  exportData() {
    const currentData = this.dataService.getData();
    console.log('Exporting:', JSON.stringify(currentData, null, 2));
  }

  updateCell() {
    this.dataService.updateCell(0, 0, {
      value: 'Updated!',
      style: { bold: true, color: '#ff0000' }
    });
  }

  calculateSum() {
    const sheet = this.dataService.getActiveSheet();
    if (sheet) {
      const cells = sheet.data;
      let sum = 0;
      cells.forEach(row => {
        row.forEach(cell => {
          if (typeof cell.value === 'number') {
            sum += cell.value;
          }
        });
      });
      console.log('Sum of all numbers:', sum);
    }
  }
}
```

### Example 3: VLOOKUP Example

```typescript
import { Component } from '@angular/core';
import { SpreadsheetComponent, SpreadsheetData } from '@ashitrai/ng-spreadsheet';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [SpreadsheetComponent],
  template: `<ngs-spreadsheet [initialData]="inventoryData"></ngs-spreadsheet>`
})
export class InventoryComponent {
  inventoryData: SpreadsheetData = {
    sheets: [{
      id: 'inventory',
      name: 'Inventory Lookup',
      rows: 100,
      cols: 10,
      data: [
        // Product database (A1:C6)
        [
          { row: 0, col: 0, value: 'ID', style: { bold: true } },
          { row: 0, col: 1, value: 'Product', style: { bold: true } },
          { row: 0, col: 2, value: 'Price', style: { bold: true } }
        ],
        [
          { row: 1, col: 0, value: 101 },
          { row: 1, col: 1, value: 'Laptop' },
          { row: 1, col: 2, value: 999.99 }
        ],
        [
          { row: 2, col: 0, value: 102 },
          { row: 2, col: 1, value: 'Mouse' },
          { row: 2, col: 2, value: 29.99 }
        ],
        [
          { row: 3, col: 0, value: 103 },
          { row: 3, col: 1, value: 'Keyboard' },
          { row: 3, col: 2, value: 79.99 }
        ],
        [
          { row: 4, col: 0, value: 104 },
          { row: 4, col: 1, value: 'Monitor' },
          { row: 4, col: 2, value: 299.99 }
        ],
        [
          { row: 5, col: 0, value: 105 },
          { row: 5, col: 1, value: 'Webcam' },
          { row: 5, col: 2, value: 89.99 }
        ],

        // Lookup section (E1:G4)
        [
          { row: 0, col: 4, value: 'Lookup ID', style: { bold: true } },
          { row: 0, col: 5, value: 'Product Name', style: { bold: true } },
          { row: 0, col: 6, value: 'Price', style: { bold: true } }
        ],
        [
          { row: 1, col: 4, value: 102 },
          { row: 1, col: 5, value: '=VLOOKUP(E2, A2:C6, 2, FALSE)' },
          { row: 1, col: 6, value: '=VLOOKUP(E2, A2:C6, 3, FALSE)' }
        ],
        [
          { row: 2, col: 4, value: 104 },
          { row: 2, col: 5, value: '=VLOOKUP(E3, A2:C6, 2, 0)' },
          { row: 2, col: 6, value: '=VLOOKUP(E3, A2:C6, 3, 0)' }
        ],
        [
          { row: 3, col: 4, value: 999 },
          { row: 3, col: 5, value: '=VLOOKUP(E4, A2:C6, 2, FALSE)' },
          { row: 3, col: 6, value: '=IFERROR(VLOOKUP(E4, A2:C6, 3, FALSE), "Not Found")' }
        ]
      ],
      columnWidths: { 0: 80, 1: 120, 2: 100, 4: 100, 5: 150, 6: 100 },
      rowHeights: {}
    }],
    activeSheetId: 'inventory'
  };
}
```

### Example 4: Custom Styling

```typescript
import { Component } from '@angular/core';
import { SpreadsheetComponent, SpreadsheetData, CellStyle } from '@ashitrai/ng-spreadsheet';

@Component({
  selector: 'app-styled-sheet',
  standalone: true,
  imports: [SpreadsheetComponent],
  template: `<ngs-spreadsheet [initialData]="styledData"></ngs-spreadsheet>`
})
export class StyledSheetComponent {
  headerStyle: CellStyle = {
    bold: true,
    backgroundColor: '#217346',
    color: '#ffffff',
    horizontalAlign: 'center'
  };

  styledData: SpreadsheetData = {
    sheets: [{
      id: 'styled',
      name: 'Styled Sheet',
      rows: 50,
      cols: 10,
      data: [
        [
          { row: 0, col: 0, value: 'Header 1', style: this.headerStyle },
          { row: 0, col: 1, value: 'Header 2', style: this.headerStyle },
          { row: 0, col: 2, value: 'Header 3', style: this.headerStyle }
        ],
        [
          { row: 1, col: 0, value: 'Data 1', style: { backgroundColor: '#f0f0f0' } },
          { row: 1, col: 1, value: 123, style: { numberFormat: 'currency' } },
          { row: 1, col: 2, value: 0.85, style: { numberFormat: 'percentage' } }
        ]
      ],
      columnWidths: {},
      rowHeights: {}
    }],
    activeSheetId: 'styled'
  };
}
```

### Example 5: Event Handling and State Management

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { SpreadsheetComponent, SpreadsheetDataService } from '@ashitrai/ng-spreadsheet';

@Component({
  selector: 'app-event-handler',
  standalone: true,
  imports: [SpreadsheetComponent],
  template: `
    <div>
      <div class="info-panel">
        <p>Selected Cell: {{ selectedCellInfo }}</p>
        <p>Editing: {{ isEditing }}</p>
        <p>Can Undo: {{ canUndo }}</p>
        <p>Can Redo: {{ canRedo }}</p>
      </div>
      <ngs-spreadsheet [initialData]="data"></ngs-spreadsheet>
    </div>
  `
})
export class EventHandlerComponent implements OnInit, OnDestroy {
  selectedCellInfo = 'None';
  isEditing = false;
  canUndo = false;
  canRedo = false;
  data!: SpreadsheetData;

  private destroy$ = new Subject<void>();

  constructor(private dataService: SpreadsheetDataService) {}

  ngOnInit() {
    // Monitor selected cell
    this.dataService.selectedCell$
      .pipe(takeUntil(this.destroy$))
      .subscribe(cell => {
        this.selectedCellInfo = cell
          ? `Row ${cell.row}, Col ${cell.col}`
          : 'None';
      });

    // Monitor editing state
    this.dataService.editingCell$
      .pipe(takeUntil(this.destroy$))
      .subscribe(cell => {
        this.isEditing = cell !== null;
      });

    // Monitor undo/redo availability
    this.dataService.data$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.canUndo = this.dataService.canUndo();
        this.canRedo = this.dataService.canRedo();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

---

## Advanced Topics

### State Management

ng-spreadsheet uses a centralized reactive state management approach via `SpreadsheetDataService`. All state is stored in RxJS `BehaviorSubject` streams.

#### Architecture Pattern

```
Component (UI Layer)
    ↓ subscribes to
Service (State Layer)
    ↓ emits via
BehaviorSubject (Data Stream)
    ↓ triggers
Change Detection (Re-render)
```

#### Best Practices

1. **Never mutate state directly**: Always use service methods
2. **Subscribe with takeUntil**: Prevent memory leaks
3. **Use OnPush change detection**: Optimize performance
4. **Immutable updates**: Use spread operators

```typescript
// ❌ Bad - Direct mutation
const data = this.dataService.getData();
data.sheets[0].data[0][0].value = 'New value';

// ✅ Good - Using service method
this.dataService.updateCell(0, 0, { value: 'New value' });
```

### Formula Calculation Flow

1. User updates cell value
2. `updateCell()` called on service
3. Service updates cell in state
4. `recalculateFormulasInSheet()` triggered
5. FormulaService evaluates all formulas
6. Dependent cells updated
7. UI re-renders via change detection

### Custom Formula Implementation

To add custom formulas, extend the FormulaService:

```typescript
// In formula.service.ts

// 1. Add detection in evaluateFormula()
if (upperExpr.startsWith('MYFUNCTION(')) {
  return this.evaluateMyFunction(expression, cells);
}

// 2. Implement the function
private evaluateMyFunction(expression: string, cells: Cell[][]): number {
  const args = this.extractMultipleArgs(expression);
  // Your logic here
  return result;
}

// 3. Add to autocomplete in spreadsheet.component.ts
readonly availableFormulas = [
  // ... existing
  { name: 'MYFUNCTION', description: 'My custom function', syntax: 'MYFUNCTION(arg1, arg2)' }
];
```

### Performance Optimization

#### Virtual Scrolling

The spreadsheet uses Angular CDK Virtual Scroll, which only renders visible rows:

```typescript
// Configuration (internal)
<cdk-virtual-scroll-viewport
  [itemSize]="DEFAULT_ROW_HEIGHT"
  class="cells-viewport">
  // Only visible rows rendered
</cdk-virtual-scroll-viewport>
```

#### OnPush Change Detection

All components use `OnPush` strategy:

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
```

**Benefits**:
- Faster change detection
- Fewer unnecessary renders
- Better performance with large datasets

#### Tips for Large Datasets

1. **Limit initial data**: Load visible range first
2. **Lazy load**: Fetch data as user scrolls
3. **Debounce updates**: Batch multiple changes
4. **Disable formula recalc**: For bulk updates, disable then re-enable

```typescript
// Example: Bulk update optimization
this.dataService.updateCell(0, 0, { value: 'A' });
this.dataService.updateCell(0, 1, { value: 'B' });
// Each triggers recalculation

// Better approach would be to batch (future feature)
```

### Working with Large Formulas

For complex formula chains:

1. **Avoid circular references**: Service detects and returns #ERROR!
2. **Limit dependency depth**: Deep nesting impacts performance
3. **Use IFERROR**: Gracefully handle errors in formula chains

```excel
=IFERROR(VLOOKUP(A1, Sheet2!A:B, 2, 0),
  IFERROR(VLOOKUP(A1, Sheet3!A:B, 2, 0), "Not Found"))
```

---

## Styling and Theming

### Component Structure

The spreadsheet uses a CSS Grid layout:

```css
.spreadsheet {
  display: grid;
  grid-template-columns: [corner] 50px [row-headers] 50px [cells] 1fr;
  grid-template-rows: [formula-bar] auto [col-headers] 30px [cells] 1fr;
}
```

### Custom Theme

Override CSS variables:

```css
/* In your global styles or component styles */
ngs-spreadsheet {
  --spreadsheet-accent-color: #217346; /* Excel green */
  --spreadsheet-border-color: #d4d4d4;
  --spreadsheet-header-bg: #f3f3f3;
  --spreadsheet-selected-bg: #e7f4e4;
  --spreadsheet-font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}
```

### Cell Styling API

Use the `CellStyle` interface:

```typescript
interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
  horizontalAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  numberFormat?: 'general' | 'number' | 'currency' | 'percentage' | 'date' | 'time';
  border?: 'all' | 'outline' | 'top' | 'bottom' | 'left' | 'right' | 'none';
  wrapText?: boolean;
}
```

### Conditional Formatting (Manual)

```typescript
// Apply formatting based on value
data.forEach((row, rowIndex) => {
  row.forEach((cell, colIndex) => {
    if (typeof cell.value === 'number' && cell.value < 0) {
      this.dataService.updateCell(rowIndex, colIndex, {
        style: { color: '#ff0000', bold: true }
      });
    }
  });
});
```

---

## Keyboard Shortcuts

### Navigation

| Shortcut | Action |
|----------|--------|
| Arrow Keys | Move between cells |
| Tab | Move to next cell (right) |
| Shift + Tab | Move to previous cell (left) |
| Enter | Move down one cell |
| Shift + Enter | Move up one cell |
| Home | Jump to column A |
| Ctrl/Cmd + Home | Jump to cell A1 |

### Editing

| Shortcut | Action |
|----------|--------|
| F2 | Start editing selected cell |
| Double-click | Start editing cell |
| Escape | Cancel editing |
| Enter | Finish editing and move down |
| Tab (while editing) | Finish editing and move right |

### Selection

| Shortcut | Action |
|----------|--------|
| Click | Select single cell |
| Click + Drag | Select range |
| Shift + Click | Extend selection |
| Ctrl/Cmd + A | Select all |

### Clipboard

| Shortcut | Action |
|----------|--------|
| Ctrl/Cmd + C | Copy selection |
| Ctrl/Cmd + X | Cut selection |
| Ctrl/Cmd + V | Paste |

### Undo/Redo

| Shortcut | Action |
|----------|--------|
| Ctrl/Cmd + Z | Undo |
| Ctrl/Cmd + Y | Redo |

---

## Performance Optimization

### Recommended Limits

- **Rows**: Up to 10,000 (with virtual scrolling)
- **Columns**: Up to 100
- **Formulas**: Up to 1,000 per sheet
- **Undo history**: 100 actions (configurable)

### Optimization Techniques

#### 1. Minimize Formula Recalculation

```typescript
// Before bulk updates, consider disabling auto-recalc (future feature)
// For now, batch updates minimize recalculations
```

#### 2. Use Efficient Formulas

```excel
// ❌ Slow - Multiple VLOOKUP calls
=VLOOKUP(A1, Data!A:Z, 2, 0) + VLOOKUP(A1, Data!A:Z, 3, 0)

// ✅ Faster - Reference once
=VLOOKUP(A1, Data!A:Z, 2, 0)
// Then use: =B1 + C1
```

#### 3. Limit Range References

```excel
// ❌ Avoid entire column references
=SUM(A:A)

// ✅ Use specific ranges
=SUM(A1:A100)
```

#### 4. OnPush Change Detection

Always use OnPush in parent components:

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
```

---

## Browser Support

### Supported Browsers

| Browser | Minimum Version |
|---------|----------------|
| Chrome | 120+ |
| Firefox | 120+ |
| Safari | 17+ |
| Edge | 120+ |

### Required Features

- ES2022 support
- CSS Grid
- Flexbox
- Modern JavaScript (async/await, modules)
- Web APIs: Clipboard API, ResizeObserver

### Known Limitations

- **Clipboard API**: Requires HTTPS in production
- **Older browsers**: Not supported (IE11, older Safari)

---

## Troubleshooting

### Common Issues

#### 1. Formulas Not Calculating

**Problem**: Formulas showing as text
**Solution**: Ensure formula starts with `=`

```typescript
// ❌ Wrong
{ value: 'SUM(A1:A10)' }

// ✅ Correct
{ value: '=SUM(A1:A10)' }
```

#### 2. Module Not Found Error

**Problem**: `Cannot find module '@ashitrai/ng-spreadsheet'`
**Solution**: Check installation and imports

```bash
npm install @ashitrai/ng-spreadsheet @angular/cdk
```

```typescript
import { SpreadsheetComponent } from '@ashitrai/ng-spreadsheet';
```

#### 3. Virtual Scroll Not Working

**Problem**: All rows rendering at once
**Solution**: Ensure parent has fixed height

```css
/* ❌ Wrong - No height */
<div>
  <ngs-spreadsheet></ngs-spreadsheet>
</div>

/* ✅ Correct - Fixed height */
<div style="height: 600px;">
  <ngs-spreadsheet></ngs-spreadsheet>
</div>
```

#### 4. Clipboard Operations Not Working

**Problem**: Copy/paste not working
**Solution**:
- Ensure HTTPS in production
- Check browser permissions
- Verify Clipboard API support

#### 5. Performance Issues

**Problem**: Slow rendering with large dataset
**Solution**:
- Reduce number of formulas
- Use specific ranges instead of entire columns
- Enable OnPush change detection
- Limit initial data size

### Debugging Tips

#### Enable Debug Logging

```typescript
// In your component
this.dataService.data$.subscribe(data => {
  console.log('Spreadsheet data:', data);
});

this.dataService.selectedCell$.subscribe(cell => {
  console.log('Selected cell:', cell);
});
```

#### Inspect Formula Results

```typescript
import { FormulaService } from '@ashitrai/ng-spreadsheet';

constructor(private formulaService: FormulaService) {}

testFormula() {
  const result = this.formulaService.evaluateFormula(
    '=SUM(A1:A10)',
    this.getCurrentCells(),
    0,
    0
  );
  console.log('Formula result:', result);
}
```

---

## Contributing

We welcome contributions to ng-spreadsheet!

### Development Setup

1. **Clone the repository**

```bash
git clone https://github.com/ashitabi/ng-spreadsheet.git
cd ng-spreadsheet
```

2. **Install dependencies**

```bash
npm install
```

3. **Build the library**

```bash
npm run build:lib
```

4. **Run the demo**

```bash
npm start demo
```

5. **Run tests**

```bash
npm test
```

### Project Structure

```
ng-spreadsheet-workspace/
├── projects/
│   ├── ng-spreadsheet/          # Library source
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── components/  # UI components
│   │   │   │   ├── services/    # Business logic
│   │   │   │   ├── models/      # TypeScript interfaces
│   │   │   │   └── utils/       # Helper functions
│   │   │   └── public-api.ts    # Public exports
│   │   └── package.json
│   └── demo/                     # Demo application
├── dist/                         # Build output
└── package.json
```

### Adding a New Feature

1. **Create a feature branch**

```bash
git checkout -b feature/my-new-feature
```

2. **Make your changes**

Follow the existing code patterns:
- Use OnPush change detection
- Implement reactive patterns with RxJS
- Add TypeScript types
- Follow Angular style guide

3. **Test your changes**

```bash
npm run build:lib
npm start demo
```

4. **Submit a pull request**

Include:
- Description of changes
- Test results
- Screenshots (if UI changes)

### Coding Standards

- **TypeScript**: Strict mode enabled
- **Linting**: Follow Angular ESLint rules
- **Formatting**: Use Prettier (100 char line width, single quotes)
- **Comments**: JSDoc for public APIs
- **Naming**: camelCase for variables, PascalCase for classes

### Testing Guidelines

- Write unit tests for new features
- Test edge cases
- Maintain code coverage

---

## API Changelog

### Version 0.2.2 (2025-12-01)

**Added**:
- VLOOKUP function for vertical lookup operations
- Support for exact and approximate match in VLOOKUP
- Helper methods: `compareValues`, `getRangeAs2DArray`, `getCellValue`, `parseBooleanArg`

### Version 0.2.1 (2025-11-26)

**Added**:
- Row/column drag-and-drop functionality
- Enhanced formula persistence during drag operations

### Version 0.1.0 (2025-11-21)

**Initial Release**:
- Core spreadsheet functionality
- 23 formula functions
- Excel-like ribbon interface
- Virtual scrolling
- Copy/paste, undo/redo
- Full TypeScript support

---

## Resources

### Links

- **NPM Package**: https://www.npmjs.com/package/@ashitrai/ng-spreadsheet
- **GitHub Repository**: https://github.com/ashitabi/ng-spreadsheet
- **Issue Tracker**: https://github.com/ashitabi/ng-spreadsheet/issues
- **Changelog**: [CHANGELOG.md](./CHANGELOG.md)

### Related Documentation

- [Angular Documentation](https://angular.dev)
- [Angular CDK](https://material.angular.io/cdk/categories)
- [RxJS Documentation](https://rxjs.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Community

- Report bugs on [GitHub Issues](https://github.com/ashitabi/ng-spreadsheet/issues)
- Request features via [GitHub Discussions](https://github.com/ashitabi/ng-spreadsheet/discussions)
- Follow updates on GitHub

---

## License

MIT License - see [LICENSE](./LICENSE) file for details

Copyright (c) 2025 ng-spreadsheet contributors

---

## Acknowledgments

Built with:
- Angular 20+
- Angular CDK
- RxJS
- TypeScript

Inspired by:
- Microsoft Excel
- Google Sheets
- LibreOffice Calc

---

**Last Updated**: December 1, 2025
**Version**: 0.2.2
**Maintainer**: ng-spreadsheet contributors
