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
