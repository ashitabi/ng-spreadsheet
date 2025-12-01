# Row and Column Drag-and-Drop Reordering Implementation Guide

This document provides complete implementation details for adding drag-and-drop row and column reordering to ng-spreadsheet.

## Overview

This feature allows users to:
- Drag row headers to reorder rows
- Drag column headers to reorder columns
- See visual feedback during drag operations
- Automatically update formula references
- Undo/redo reordering operations

## Implementation Steps

### 1. Update HistoryEntry Interface

**File:** `projects/ng-spreadsheet/src/lib/services/spreadsheet-data.service.ts`

**Location:** Line 19 (HistoryEntry interface)

**Change:**
```typescript
interface HistoryEntry {
  type: 'cell-update' | 'cell-style' | 'row-height' | 'col-width' | 'row-reorder' | 'col-reorder';
  sheetId: string;
  row?: number;
  col?: number;
  oldValue?: any;
  newValue?: any;
  fromIndex?: number;  // NEW: For reordering operations
  toIndex?: number;    // NEW: For reordering operations
  timestamp: number;
}
```

### 2. Add Reordering Methods to SpreadsheetDataService

**File:** `projects/ng-spreadsheet/src/lib/services/spreadsheet-data.service.ts`

**Location:** Add these methods after the existing sheet management methods (around line 500)

```typescript
/**
 * Reorders a row by moving it from one position to another
 * @param fromIndex - Source row index
 * @param toIndex - Target row index
 */
reorderRow(fromIndex: number, toIndex: number): void {
  const sheet = this.getActiveSheet();
  if (!sheet || fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
  if (fromIndex >= sheet.rowCount || toIndex >= sheet.rowCount) return;

  // Store for undo
  this.addToHistory({
    type: 'row-reorder',
    sheetId: sheet.id,
    fromIndex,
    toIndex,
    timestamp: Date.now(),
  });

  // Clear redo stack when new action is performed
  this.redoStack = [];

  // Reorder cells array
  const newCells = [...sheet.cells];
  const [movedRow] = newCells.splice(fromIndex, 1);
  newCells.splice(toIndex, 0, movedRow);

  // Update row indices in cells
  newCells.forEach((row, rowIdx) => {
    row.forEach(cell => {
      cell.row = rowIdx;
    });
  });

  // Reorder row heights
  const newRowHeights = [...(sheet.rowHeights || [])];
  if (newRowHeights.length > 0) {
    const [movedHeight] = newRowHeights.splice(fromIndex, 1);
    newRowHeights.splice(toIndex, 0, movedHeight);
  }

  // Update sheet
  const data = this.getData();
  const updatedSheets = data.sheets.map(s =>
    s.id === sheet.id
      ? { ...s, cells: newCells, rowHeights: newRowHeights }
      : s
  );

  this._data$.next({
    ...data,
    sheets: updatedSheets,
    metadata: {
      ...data.metadata,
      modifiedDate: new Date(),
    },
  });

  // Recalculate formulas with updated references
  this.updateFormulasAfterRowReorder(fromIndex, toIndex);
}

/**
 * Reorders a column by moving it from one position to another
 * @param fromIndex - Source column index
 * @param toIndex - Target column index
 */
reorderColumn(fromIndex: number, toIndex: number): void {
  const sheet = this.getActiveSheet();
  if (!sheet || fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
  if (fromIndex >= sheet.colCount || toIndex >= sheet.colCount) return;

  // Store for undo
  this.addToHistory({
    type: 'col-reorder',
    sheetId: sheet.id,
    fromIndex,
    toIndex,
    timestamp: Date.now(),
  });

  // Clear redo stack when new action is performed
  this.redoStack = [];

  // Reorder cells in each row
  const newCells = sheet.cells.map(row => {
    const newRow = [...row];
    const [movedCell] = newRow.splice(fromIndex, 1);
    newRow.splice(toIndex, 0, movedCell);

    // Update col indices
    newRow.forEach((cell, colIdx) => {
      cell.col = colIdx;
    });

    return newRow;
  });

  // Reorder column widths
  const newColumnWidths = [...(sheet.columnWidths || [])];
  if (newColumnWidths.length > 0) {
    const [movedWidth] = newColumnWidths.splice(fromIndex, 1);
    newColumnWidths.splice(toIndex, 0, movedWidth);
  }

  // Update sheet
  const data = this.getData();
  const updatedSheets = data.sheets.map(s =>
    s.id === sheet.id
      ? { ...s, cells: newCells, columnWidths: newColumnWidths }
      : s
  );

  this._data$.next({
    ...data,
    sheets: updatedSheets,
    metadata: {
      ...data.metadata,
      modifiedDate: new Date(),
    },
  });

  // Recalculate formulas with updated references
  this.updateFormulasAfterColumnReorder(fromIndex, toIndex);
}

/**
 * Updates formula references after a row reorder
 * @param fromIndex - Source row index
 * @param toIndex - Target row index
 */
private updateFormulasAfterRowReorder(fromIndex: number, toIndex: number): void {
  const sheet = this.getActiveSheet();
  if (!sheet) return;

  const data = this.getData();
  const updatedSheets = data.sheets.map(s => {
    if (s.id !== sheet.id) return s;

    const updatedCells = s.cells.map(row =>
      row.map(cell => {
        if (!cell.value || typeof cell.value !== 'string' || !cell.value.startsWith('=')) {
          return cell;
        }

        // Update cell references in formula
        const updatedFormula = this.updateRowReferencesInFormula(
          cell.value,
          fromIndex,
          toIndex
        );

        if (updated Formula === cell.value) return cell;

        // Recalculate with updated formula
        try {
          const result = this.formulaService.evaluate(updatedFormula, s.cells);
          return {
            ...cell,
            value: updatedFormula,
            displayValue: String(result),
            dataType: typeof result === 'number' ? 'number' as Cell['dataType'] : 'string' as Cell['dataType'],
          };
        } catch {
          return {
            ...cell,
            value: updatedFormula,
            displayValue: '#ERROR!',
            dataType: 'error' as Cell['dataType'],
          };
        }
      })
    );

    return { ...s, cells: updatedCells };
  });

  this._data$.next({ ...data, sheets: updatedSheets });
}

/**
 * Updates formula references after a column reorder
 * @param fromIndex - Source column index
 * @param toIndex - Target column index
 */
private updateFormulasAfterColumnReorder(fromIndex: number, toIndex: number): void {
  const sheet = this.getActiveSheet();
  if (!sheet) return;

  const data = this.getData();
  const updatedSheets = data.sheets.map(s => {
    if (s.id !== sheet.id) return s;

    const updatedCells = s.cells.map(row =>
      row.map(cell => {
        if (!cell.value || typeof cell.value !== 'string' || !cell.value.startsWith('=')) {
          return cell;
        }

        // Update cell references in formula
        const updatedFormula = this.updateColumnReferencesInFormula(
          cell.value,
          fromIndex,
          toIndex
        );

        if (updatedFormula === cell.value) return cell;

        // Recalculate with updated formula
        try {
          const result = this.formulaService.evaluate(updatedFormula, s.cells);
          return {
            ...cell,
            value: updatedFormula,
            displayValue: String(result),
            dataType: typeof result === 'number' ? 'number' as Cell['dataType'] : 'string' as Cell['dataType'],
          };
        } catch {
          return {
            ...cell,
            value: updatedFormula,
            displayValue: '#ERROR!',
            dataType: 'error' as Cell['dataType'],
          };
        }
      })
    );

    return { ...s, cells: updatedCells };
  });

  this._data$.next({ ...data, sheets: updatedSheets });
}

/**
 * Updates row references in a formula string
 * @param formula - Formula string (e.g., "=SUM(A1:A10)")
 * @param fromIndex - Source row index (0-based)
 * @param toIndex - Target row index (0-based)
 * @returns Updated formula string
 */
private updateRowReferencesInFormula(
  formula: string,
  fromIndex: number,
  toIndex: number
): string {
  // Match cell references like A1, B23, AA100
  const cellRefRegex = /([A-Z]+)(\d+)/g;

  return formula.replace(cellRefRegex, (match, col, row) => {
    const rowNum = parseInt(row, 10) - 1; // Convert to 0-based

    let newRowNum = rowNum;

    if (fromIndex < toIndex) {
      // Moving down
      if (rowNum === fromIndex) {
        newRowNum = toIndex;
      } else if (rowNum > fromIndex && rowNum <= toIndex) {
        newRowNum = rowNum - 1;
      }
    } else {
      // Moving up
      if (rowNum === fromIndex) {
        newRowNum = toIndex;
      } else if (rowNum >= toIndex && rowNum < fromIndex) {
        newRowNum = rowNum + 1;
      }
    }

    return `${col}${newRowNum + 1}`; // Convert back to 1-based
  });
}

/**
 * Updates column references in a formula string
 * @param formula - Formula string (e.g., "=SUM(A1:C10)")
 * @param fromIndex - Source column index (0-based)
 * @param toIndex - Target column index (0-based)
 * @returns Updated formula string
 */
private updateColumnReferencesInFormula(
  formula: string,
  fromIndex: number,
  toIndex: number
): string {
  // Match cell references like A1, B23, AA100
  const cellRefRegex = /([A-Z]+)(\d+)/g;

  return formula.replace(cellRefRegex, (match, col, row) => {
    const colIndex = this.columnLetterToIndex(col);

    let newColIndex = colIndex;

    if (fromIndex < toIndex) {
      // Moving right
      if (colIndex === fromIndex) {
        newColIndex = toIndex;
      } else if (colIndex > fromIndex && colIndex <= toIndex) {
        newColIndex = colIndex - 1;
      }
    } else {
      // Moving left
      if (colIndex === fromIndex) {
        newColIndex = toIndex;
      } else if (colIndex >= toIndex && colIndex < fromIndex) {
        newColIndex = colIndex + 1;
      }
    }

    return `${this.indexToColumnLetter(newColIndex)}${row}`;
  });
}

/**
 * Converts column letter to index (A=0, B=1, Z=25, AA=26, etc.)
 */
private columnLetterToIndex(letter: string): number {
  let result = 0;
  for (let i = 0; i < letter.length; i++) {
    result = result * 26 + (letter.charCodeAt(i) - 64);
  }
  return result - 1;
}

/**
 * Converts column index to letter (0=A, 1=B, 25=Z, 26=AA, etc.)
 */
private indexToColumnLetter(index: number): string {
  let letter = '';
  let num = index + 1;
  while (num > 0) {
    const remainder = (num - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    num = Math.floor((num - 1) / 26);
  }
  return letter;
}
```

### 3. Update Undo/Redo Logic

**File:** `projects/ng-spreadsheet/src/lib/services/spreadsheet-data.service.ts`

**Location:** Find the `undo()` and `redo()` methods and add cases for row-reorder and col-reorder

In the `undo()` method (around line 900), add:

```typescript
case 'row-reorder':
  if (entry.fromIndex !== undefined && entry.toIndex !== undefined) {
    // Reverse the operation
    this.reorderRow(entry.toIndex, entry.fromIndex);
    // Pop the undo entry that was just added by reorderRow
    this.undoStack.pop();
  }
  break;

case 'col-reorder':
  if (entry.fromIndex !== undefined && entry.toIndex !== undefined) {
    // Reverse the operation
    this.reorderColumn(entry.toIndex, entry.fromIndex);
    // Pop the undo entry that was just added by reorderColumn
    this.undoStack.pop();
  }
  break;
```

In the `redo()` method, add similar cases:

```typescript
case 'row-reorder':
  if (entry.fromIndex !== undefined && entry.toIndex !== undefined) {
    this.reorderRow(entry.fromIndex, entry.toIndex);
    // Pop the redo entry that was just added
    this.redoStack.pop();
  }
  break;

case 'col-reorder':
  if (entry.fromIndex !== undefined && entry.toIndex !== undefined) {
    this.reorderColumn(entry.fromIndex, entry.toIndex);
    // Pop the redo entry that was just added
    this.redoStack.pop();
  }
  break;
```

### 4. Add Drag State to SpreadsheetComponent

**File:** `projects/ng-spreadsheet/src/lib/components/spreadsheet.component.ts`

**Location:** After the fill handle state (around line 162), add:

```typescript
// Row/Column drag-and-drop state
isDraggingRow = false;
isDraggingColumn = false;
draggingRowIndex = -1;
draggingColumnIndex = -1;
dragOverRowIndex = -1;
dragOverColumnIndex = -1;
```

### 5. Add Row Drag Handlers to SpreadsheetComponent

**File:** `projects/ng-spreadsheet/src/lib/components/spreadsheet.component.ts`

**Location:** Add these methods near the existing mouse event handlers (around line 1200)

```typescript
/**
 * Handles row header drag start
 */
onRowHeaderDragStart(event: DragEvent, rowIndex: number): void {
  if (!event.dataTransfer) return;

  this.isDraggingRow = true;
  this.draggingRowIndex = rowIndex;

  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', rowIndex.toString());

  // Set drag image
  const target = event.target as HTMLElement;
  if (target) {
    event.dataTransfer.setDragImage(target, 0, 0);
  }

  this.cdr.markForCheck();
}

/**
 * Handles drag over row header
 */
onRowHeaderDragOver(event: DragEvent, rowIndex: number): void {
  if (!this.isDraggingRow) return;

  event.preventDefault();
  event.stopPropagation();

  this.dragOverRowIndex = rowIndex;

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }

  this.cdr.markForCheck();
}

/**
 * Handles drag leave on row header
 */
onRowHeaderDragLeave(event: DragEvent): void {
  event.stopPropagation();
  this.dragOverRowIndex = -1;
  this.cdr.markForCheck();
}

/**
 * Handles drop on row header
 */
onRowHeaderDrop(event: DragEvent, toIndex: number): void {
  event.preventDefault();
  event.stopPropagation();

  if (!this.isDraggingRow || this.draggingRowIndex === -1) return;

  const fromIndex = this.draggingRowIndex;

  if (fromIndex !== toIndex) {
    this.dataService.reorderRow(fromIndex, toIndex);
  }

  this.isDraggingRow = false;
  this.draggingRowIndex = -1;
  this.dragOverRowIndex = -1;

  this.cdr.markForCheck();
}

/**
 * Handles row header drag end
 */
onRowHeaderDragEnd(event: DragEvent): void {
  this.isDraggingRow = false;
  this.draggingRowIndex = -1;
  this.dragOverRowIndex = -1;
  this.cdr.markForCheck();
}
```

### 6. Add Column Drag Handlers to SpreadsheetComponent

**File:** `projects/ng-spreadsheet/src/lib/components/spreadsheet.component.ts`

**Location:** Add these methods after the row drag handlers

```typescript
/**
 * Handles column header drag start
 */
onColumnHeaderDragStart(event: DragEvent, colIndex: number): void {
  if (!event.dataTransfer) return;

  this.isDraggingColumn = true;
  this.draggingColumnIndex = colIndex;

  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', colIndex.toString());

  // Set drag image
  const target = event.target as HTMLElement;
  if (target) {
    event.dataTransfer.setDragImage(target, 0, 0);
  }

  this.cdr.markForCheck();
}

/**
 * Handles drag over column header
 */
onColumnHeaderDragOver(event: DragEvent, colIndex: number): void {
  if (!this.isDraggingColumn) return;

  event.preventDefault();
  event.stopPropagation();

  this.dragOverColumnIndex = colIndex;

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }

  this.cdr.markForCheck();
}

/**
 * Handles drag leave on column header
 */
onColumnHeaderDragLeave(event: DragEvent): void {
  event.stopPropagation();
  this.dragOverColumnIndex = -1;
  this.cdr.markForCheck();
}

/**
 * Handles drop on column header
 */
onColumnHeaderDrop(event: DragEvent, toIndex: number): void {
  event.preventDefault();
  event.stopPropagation();

  if (!this.isDraggingColumn || this.draggingColumnIndex === -1) return;

  const fromIndex = this.draggingColumnIndex;

  if (fromIndex !== toIndex) {
    this.dataService.reorderColumn(fromIndex, toIndex);
  }

  this.isDraggingColumn = false;
  this.draggingColumnIndex = -1;
  this.dragOverColumnIndex = -1;

  this.cdr.markForCheck();
}

/**
 * Handles column header drag end
 */
onColumnHeaderDragEnd(event: DragEvent): void {
  this.isDraggingColumn = false;
  this.draggingColumnIndex = -1;
  this.dragOverColumnIndex = -1;
  this.cdr.markForCheck();
}
```

### 7. Update HTML Template for Row Headers

**File:** `projects/ng-spreadsheet/src/lib/components/spreadsheet.component.html`

**Location:** Find the row header element (search for `row-header` class)

**Change:** Add draggable attributes and event handlers to row headers:

```html
<div
  class="row-header"
  [class.drag-over]="dragOverRowIndex === rowIndex"
  [class.dragging]="draggingRowIndex === rowIndex"
  draggable="true"
  (dragstart)="onRowHeaderDragStart($event, rowIndex)"
  (dragover)="onRowHeaderDragOver($event, rowIndex)"
  (dragleave)="onRowHeaderDragLeave($event)"
  (drop)="onRowHeaderDrop($event, rowIndex)"
  (dragend)="onRowHeaderDragEnd($event)"
  (mousedown)="onRowHeaderMouseDown($event, rowIndex)"
  (contextmenu)="onRowContextMenu($event, rowIndex)"
>
  {{ rowIndex + 1 }}
</div>
```

### 8. Update HTML Template for Column Headers

**File:** `projects/ng-spreadsheet/src/lib/components/spreadsheet.component.html`

**Location:** Find the column header element (search for `column-header` class)

**Change:** Add draggable attributes and event handlers to column headers:

```html
<div
  *ngFor="let col of getVisibleColumns(); trackBy: trackByIndex"
  class="column-header"
  [class.drag-over]="dragOverColumnIndex === col"
  [class.dragging]="draggingColumnIndex === col"
  draggable="true"
  (dragstart)="onColumnHeaderDragStart($event, col)"
  (dragover)="onColumnHeaderDragOver($event, col)"
  (dragleave)="onColumnHeaderDragLeave($event)"
  (drop)="onColumnHeaderDrop($event, col)"
  (dragend)="onColumnHeaderDragEnd($event)"
  [style.left.px]="getColumnLeft(col)"
  [style.width.px]="getColumnWidth(col)"
  (mousedown)="onColumnHeaderMouseDown($event, col)"
  (contextmenu)="onColumnContextMenu($event, col)"
>
  <span>{{ colIndexToLetter(col) }}</span>
  <div
    class="resize-handle"
    (mousedown)="onColumnResizeStart($event, col)"
  ></div>
</div>
```

### 9. Add CSS Styles for Drag Feedback

**File:** `projects/ng-spreadsheet/src/lib/components/spreadsheet.component.css`

**Location:** Add at the end of the file

```css
/* Drag and drop styles */
.row-header[draggable="true"],
.column-header[draggable="true"] {
  cursor: grab;
}

.row-header[draggable="true"]:active,
.column-header[draggable="true"]:active {
  cursor: grabbing;
}

.row-header.dragging,
.column-header.dragging {
  opacity: 0.5;
  background-color: #e3f2fd;
}

.row-header.drag-over,
.column-header.drag-over {
  border: 2px solid #217346;
  background-color: #f0f8f4;
}

.row-header.drag-over::before {
  content: '';
  position: absolute;
  left: 0;
  top: -2px;
  width: 100%;
  height: 2px;
  background-color: #217346;
}

.column-header.drag-over::before {
  content: '';
  position: absolute;
  left: -2px;
  top: 0;
  width: 2px;
  height: 100%;
  background-color: #217346;
}
```

## Testing

After implementing these changes:

1. Build the library:
   ```bash
   npm run build:lib
   ```

2. Test drag-and-drop:
   - Try dragging row headers up and down
   - Try dragging column headers left and right
   - Verify formulas update correctly
   - Test undo/redo (Ctrl+Z / Ctrl+Y)

3. Edge cases to test:
   - Dragging to the same position
   - Dragging first row/column
   - Dragging last row/column
   - Formulas that reference moved cells
   - Undo/redo multiple times

## Troubleshooting

If formulas don't update correctly:
- Check the `updateRowReferencesInFormula` and `updateColumnReferencesInFormula` methods
- Verify the regex pattern matches your formula syntax

If drag doesn't work:
- Ensure `draggable="true"` is set on headers
- Check browser console for errors
- Verify event handlers are properly bound

If undo/redo doesn't work:
- Check that history entries are being added correctly
- Verify the undo/redo switch cases handle reorder types
- Check that the undo stack pop logic is correct

## Future Enhancements

- Add visual ghost element during drag
- Support multi-row/column selection and drag
- Add confirmation dialog for large reorders
- Implement drag-to-edge auto-scroll
- Add keyboard shortcuts for reordering (Alt+Up/Down for rows, Alt+Left/Right for columns)
