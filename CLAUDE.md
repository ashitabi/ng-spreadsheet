# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **Angular 20+ monorepo workspace** containing:
- **ng-spreadsheet**: A production-ready Excel-like spreadsheet component library
- **demo**: A demonstration application showcasing the library

The library provides a full-featured Excel-like spreadsheet with virtual scrolling, formula calculation, cell editing, and extensive keyboard/mouse interactions.

## Build & Development Commands

### Library Development
```bash
# Build the library (must be done before demo can use it)
npm run build ng-spreadsheet

# Build library in watch mode
npm run build ng-spreadsheet -- --watch

# Test the library
ng test ng-spreadsheet
```

### Demo Application
```bash
# Run demo (requires library to be built first)
npm start demo

# Run on specific port
ng serve demo --port 4201
```

### Critical Build Workflow
**The library MUST be rebuilt after any changes to `projects/ng-spreadsheet/src/**` before the demo app will reflect those changes.** The dev server does not hot-reload library changes - you must:
1. Stop the demo dev server
2. Run `npm run build ng-spreadsheet`
3. Restart `ng serve demo`

## Architecture

### State Management Pattern

The library uses **centralized reactive state management** via `SpreadsheetDataService`:

- All spreadsheet state lives in `SpreadsheetDataService` as RxJS `BehaviorSubject` streams
- Components **subscribe** to these streams and remain stateless presentation layers
- All state mutations flow through service methods (no direct state manipulation in components)
- Key observables: `data$`, `activeSheet$`, `selectedCell$`, `editingCell$`, `selectedRange$`

### Formula Calculation System

**Critical:** Formulas must recalculate whenever ANY cell changes:

- When `updateCell()` is called, it triggers `recalculateFormulasInSheet()` which evaluates ALL formulas
- Formula service (`FormulaService`) evaluates Excel-like expressions (`=SUM(A1:A10)`, `=B2*C2`)
- Formulas are stored in `cell.value` as strings starting with `=`
- Calculated results are stored in `cell.displayValue`
- Supported functions: SUM, AVERAGE, COUNT, MIN, MAX, plus basic arithmetic

### Component Architecture

**SpreadsheetComponent** is a complex component with multiple interconnected features:

- **Formula Bar**: Top input showing cell address and formula/value
- **Column Headers**: Horizontally scrolling headers (A, B, C...) with resize handles
- **Row Headers**: Vertically scrolling headers (1, 2, 3...) with resize handles
- **Cell Grid**: Main viewport using Angular CDK Virtual Scrolling
- **Context Menu**: Right-click menu for cut/copy/paste/insert/delete
- **Fill Handle**: Green square for Excel-like drag-to-fill

**Scroll Synchronization**: The component synchronizes scroll between 3 viewports:
- `cellsViewport` (main cell grid)
- `rowHeadersViewport` (row numbers)
- `columnHeadersContainer` (column letters)

Use `onCellsScroll()` to sync all viewports when the main grid scrolls.

### Cell Selection & Interaction

**Multiple selection mechanisms** must coexist:
- Single cell click: `onCellMouseDown()` + `dataService.selectCell()`
- Range drag: `isDragging` flag + `onCellMouseEnter()` + `dataService.selectRange()`
- Shift+click: Extends from `selectedCell` to clicked cell
- Fill handle drag: `isFilling` flag + `onFillHandleMouseDown()`

**State tracking for mouse operations:**
```typescript
isDragging: boolean          // Mouse drag for range selection
isResizingColumn: boolean    // Column resize in progress
isResizingRow: boolean       // Row resize in progress
isFilling: boolean           // Fill handle drag in progress
```

### Virtual Scrolling with Absolute Positioning

Cells use **absolute positioning** within each row for horizontal scrolling:
- Each cell has `[style.left.px]="getColumnLeft(col)"`
- `getTotalWidth()` calculates sum of all column widths
- This enables smooth horizontal scrolling with variable column widths
- Row heights use CDK's `itemSize` for vertical virtual scrolling

## Key Services

**SpreadsheetDataService** - Centralized state manager:
- Manages all spreadsheet data, selection, editing state
- Implements undo/redo stack
- Triggers formula recalculation on every cell update
- Provides getters for current state (never mutate directly)

**FormulaService** - Formula evaluation engine:
- Parses and evaluates Excel-like formulas
- Handles cell references (A1, B2) and ranges (A1:B10)
- Supports basic arithmetic and Excel functions

## Component Selector Prefix

The library uses the **`ngs-` prefix** (ng-spreadsheet):
- `<ngs-spreadsheet>` - Main component
- `<ngs-spreadsheet-toolbar>` - Toolbar component

## Styling Approach

**Excel-like visual design:**
- Green accent color: `#217346` (Excel's signature green)
- Segoe UI font (Excel's default)
- Grey headers: `#f3f3f3`
- Border color: `#d4d4d4`

**CSS Grid Layout** for main structure:
- 2x2 grid: corner cell, column headers, row headers, cell grid
- Proper z-index layering for scroll synchronization

## TypeScript & Angular Patterns

- **Standalone components** (no NgModules)
- **OnPush change detection** for performance
- **Strict TypeScript** mode enabled
- **RxJS operators**: Use `takeUntil(destroy$)` for subscription cleanup
- **Immutable updates**: Always spread state (`...sheet`, `...cell`) when updating

## Testing Considerations

When testing, remember:
- Library must be built before running demo tests
- Virtual scrolling creates/destroys DOM elements dynamically
- Formula recalculation is triggered on every `updateCell()` call
- Mouse operations have multiple states (drag vs. fill vs. resize)

## Common Pitfalls

1. **Forgetting to rebuild library**: Changes to library code won't appear in demo until rebuilt
2. **Direct state mutation**: Always use service methods, never mutate BehaviorSubject values directly
3. **Missing formula recalculation**: When adding cell update features, ensure formulas recalculate
4. **Scroll sync issues**: When modifying viewports, verify all 3 scroll together correctly
5. **Mouse state conflicts**: Only one mouse operation (drag/fill/resize) should be active at once

## Implemented Features

### Core Spreadsheet Functionality
- **Virtual Scrolling**: Smooth handling of 10,000+ rows using Angular CDK Virtual Scroll
- **Cell Selection**: Single cell and range selection with mouse drag and Shift+click
- **Cell Editing**: Double-click or F2 to edit, inline editing with formula bar support
- **Keyboard Navigation**: Arrow keys, Tab, Enter, Shift+Tab for navigation
- **Row/Column Headers**: Interactive headers (A, B, C... and 1, 2, 3...)
- **Column Resizing**: Drag column borders to resize with mouse
- **Row Resizing**: Drag row borders to resize with mouse
- **Context Menu**: Right-click menu with Cut, Copy, Paste, Delete, Insert/Delete Row/Column
- **Fill Handle**: Excel-like green square for drag-to-fill functionality
- **Undo/Redo**: Full history tracking with Ctrl+Z and Ctrl+Y (up to 100 actions)

### Formula Engine (24 Functions)
**Mathematical Functions:**
- SUM, AVERAGE, COUNT, MIN, MAX, PRODUCT

**Statistical Functions:**
- COUNTA, COUNTBLANK, MEDIAN, MODE, STDEV, VAR, CORREL, PERCENTILE, QUARTILE, RANK

**Logical Functions:**
- IF, IFS, IFERROR, IFNA, AND, OR, NOT

**Lookup Functions:**
- VLOOKUP (exact and approximate match)

**Formula Features:**
- Cell references (A1, B2) and ranges (A1:B10)
- Formula autocomplete with function suggestions
- Parameter hints showing function syntax
- Automatic recalculation when dependencies change
- Circular reference detection

### Excel Ribbon
**Font Formatting:**
- Font family selection (Arial, Calibri, Times New Roman, etc.)
- Font size (10-24px)
- Bold, Italic, Underline
- Text color and background color pickers

**Number Formatting:**
- General, Number, Currency, Accounting, Percentage, Date, Time
- Increase/decrease decimal places

**Alignment:**
- Horizontal alignment (Left, Center, Right)
- Word wrap toggle

**Data Operations:**
- Sort ascending/descending
- Filter toggle
- Search/Find functionality

### State Management
- **RxJS-based reactive state**: All state flows through BehaviorSubject observables
- **Immutable updates**: Spread operators ensure change detection works correctly
- **TypeScript strict mode**: Full type safety across the codebase
- **Service-based architecture**: Centralized state management via SpreadsheetDataService
- **OnPush change detection**: Optimized performance with ChangeDetectionStrategy.OnPush

### Copy/Paste
- Ctrl+C / Cmd+C to copy selected cells
- Ctrl+V / Cmd+V to paste
- TSV (Tab-Separated Values) clipboard format
- Range copying and pasting support

## Upcoming Features

### Phase 1: Advanced Formatting
- Merge & Center cells
- Cell borders (all, outline, top, bottom, left, right)
- Vertical alignment (top, middle, bottom)
- Format Painter
- Paste Special (values, formats, formulas)
- Clear options (all, contents, formats)
- AutoFit column width

### Phase 2: Data Features
- Freeze panes (freeze rows/columns)
- Filter functionality
- Data validation
- Conditional formatting
- Cell comments/notes

### Phase 3: Import/Export
- Excel (.xlsx) import/export
- CSV import/export
- PDF export
- Print functionality

### Phase 4: Multiple Sheets
- Sheet tabs
- Add/delete/rename sheets
- Cross-sheet formula references
- Sheet protection

### Phase 5: Advanced Formulas
- Date/Time functions (NOW, TODAY, DATE, DATEVALUE, etc.)
- Text functions (CONCATENATE, LEFT, RIGHT, MID, LEN, TRIM, etc.)
- Additional lookup functions (HLOOKUP, INDEX, MATCH, XLOOKUP, etc.)
- Financial functions (NPV, IRR, PMT, FV, PV, etc.)

### Phase 6: Collaboration
- Real-time collaboration
- Change tracking
- Cell locking
- Version history
