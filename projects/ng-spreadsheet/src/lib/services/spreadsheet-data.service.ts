import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Cell,
  CellAddress,
  CellRange,
  Sheet,
  SpreadsheetData,
  createDefaultSpreadsheet,
  createEmptyCell,
  createEmptySheet,
} from '../models';
import { FormulaService } from './formula.service';

/**
 * Represents a single change in spreadsheet history for undo/redo
 */
interface HistoryEntry {
  type: 'cell-update' | 'cell-style' | 'row-height' | 'col-width';
  sheetId: string;
  row?: number;
  col?: number;
  oldValue?: any;
  newValue?: any;
  timestamp: number;
}

/**
 * Service responsible for managing spreadsheet data state.
 * Handles all data operations, state management, and provides reactive streams.
 */
@Injectable({
  providedIn: 'root',
})
export class SpreadsheetDataService {
  private readonly _data$ = new BehaviorSubject<SpreadsheetData>(
    createDefaultSpreadsheet()
  );

  private readonly _selectedCell$ = new BehaviorSubject<CellAddress | null>(
    null
  );

  private readonly _selectedRange$ = new BehaviorSubject<CellRange | null>(
    null
  );

  private readonly _editingCell$ = new BehaviorSubject<CellAddress | null>(
    null
  );

  // Undo/Redo stacks
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];
  private readonly MAX_HISTORY = 100;

  // Public observables
  public readonly data$: Observable<SpreadsheetData> =
    this._data$.asObservable();
  public readonly selectedCell$: Observable<CellAddress | null> =
    this._selectedCell$.asObservable();
  public readonly selectedRange$: Observable<CellRange | null> =
    this._selectedRange$.asObservable();
  public readonly editingCell$: Observable<CellAddress | null> =
    this._editingCell$.asObservable();

  public readonly activeSheet$: Observable<Sheet | null> = this.data$.pipe(
    map((data) => data.sheets[data.activeSheetIndex] ?? null)
  );

  private formulaService = inject(FormulaService);

  constructor() {}

  /**
   * Gets the current spreadsheet data
   */
  getData(): SpreadsheetData {
    return this._data$.value;
  }

  /**
   * Gets the currently active sheet
   */
  getActiveSheet(): Sheet | null {
    const data = this.getData();
    return data.sheets[data.activeSheetIndex] ?? null;
  }

  /**
   * Gets a specific cell from the active sheet
   */
  getCell(row: number, col: number): Cell | null {
    const sheet = this.getActiveSheet();
    if (!sheet) return null;

    if (
      row < 0 ||
      row >= sheet.rowCount ||
      col < 0 ||
      col >= sheet.colCount
    ) {
      return null;
    }

    return sheet.cells[row]?.[col] ?? null;
  }

  /**
   * Formats a number value based on decimal places
   */
  private formatNumberValue(value: any, decimalPlaces?: number): string {
    if (typeof value !== 'number') {
      return String(value);
    }

    // If decimalPlaces is specified, format with that precision
    if (decimalPlaces !== undefined && decimalPlaces >= 0) {
      return value.toFixed(decimalPlaces);
    }

    // Otherwise return the number as-is
    return String(value);
  }

  /**
   * Updates a cell value in the active sheet
   */
  updateCell(row: number, col: number, value: any): void {
    const sheet = this.getActiveSheet();
    if (!sheet) return;

    const cell = this.getCell(row, col);
    if (!cell) return;

    // Store for undo
    this.addToHistory({
      type: 'cell-update',
      sheetId: sheet.id,
      row,
      col,
      oldValue: cell.value,
      newValue: value,
      timestamp: Date.now(),
    });

    // Determine data type
    let dataType: Cell['dataType'] = 'string';
    let displayValue: string;

    if (typeof value === 'string' && value.startsWith('=')) {
      dataType = 'formula';
      // Evaluate the formula
      try {
        const result = this.formulaService.evaluateFormula(
          value,
          sheet.cells,
          row,
          col
        );
        // Format the result if it's a number
        displayValue = this.formatNumberValue(result, cell.style?.decimalPlaces);
      } catch {
        displayValue = '#ERROR!';
        dataType = 'error';
      }
    } else if (typeof value === 'number') {
      dataType = 'number';
      // Apply decimal formatting if specified in cell style
      displayValue = this.formatNumberValue(value, cell.style?.decimalPlaces);
    } else if (typeof value === 'boolean') {
      dataType = 'boolean';
      displayValue = String(value);
    } else {
      displayValue = String(value);
    }

    // Update cell
    const updatedCell: Cell = {
      ...cell,
      value,
      displayValue,
      dataType,
    };

    // Update the sheet
    const updatedCells = [...sheet.cells];
    updatedCells[row] = [...updatedCells[row]];
    updatedCells[row][col] = updatedCell;

    let updatedSheet: Sheet = {
      ...sheet,
      cells: updatedCells,
    };

    // Recalculate ALL formulas since other cells might reference this one
    updatedSheet = this.recalculateFormulasInSheet(updatedSheet);

    this.updateSheet(updatedSheet);
  }

  /**
   * Recalculates all formulas in a single sheet
   */
  private recalculateFormulasInSheet(sheet: Sheet): Sheet {
    // Create a working copy of cells
    let workingCells = sheet.cells.map(row => [...row]);

    // Recalculate all formulas (do multiple passes to handle dependencies)
    // Maximum of 10 passes to avoid infinite loops
    for (let pass = 0; pass < 10; pass++) {
      let hasChanges = false;

      workingCells = workingCells.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          if (
            typeof cell.value === 'string' &&
            cell.value.startsWith('=')
          ) {
            try {
              const result = this.formulaService.evaluateFormula(
                cell.value,
                workingCells,
                rowIndex,
                colIndex
              );
              // Format the result if it's a number
              const newDisplayValue = this.formatNumberValue(result, cell.style?.decimalPlaces);

              // Check if value changed
              if (cell.displayValue !== newDisplayValue) {
                hasChanges = true;
              }

              return {
                ...cell,
                displayValue: newDisplayValue,
                dataType: 'formula' as Cell['dataType'],
              };
            } catch {
              return {
                ...cell,
                displayValue: '#ERROR!',
                dataType: 'error' as Cell['dataType'],
              };
            }
          }
          return cell;
        })
      );

      // If no changes in this pass, we're done
      if (!hasChanges) {
        break;
      }
    }

    return {
      ...sheet,
      cells: workingCells,
    };
  }

  /**
   * Updates cell style
   */
  updateCellStyle(row: number, col: number, style: Partial<Cell['style']>): void {
    const sheet = this.getActiveSheet();
    if (!sheet) return;

    const cell = this.getCell(row, col);
    if (!cell) return;

    const newStyle = { ...cell.style, ...style };

    // If decimalPlaces changed and cell has a numeric value, refresh displayValue
    let newDisplayValue = cell.displayValue;
    if (style && 'decimalPlaces' in style) {
      if (cell.dataType === 'number' && typeof cell.value === 'number') {
        newDisplayValue = this.formatNumberValue(cell.value, newStyle.decimalPlaces);
      } else if (cell.dataType === 'formula') {
        // For formulas, re-evaluate to get the result
        try {
          const result = this.formulaService.evaluateFormula(
            cell.value,
            sheet.cells,
            row,
            col
          );
          newDisplayValue = this.formatNumberValue(result, newStyle.decimalPlaces);
        } catch {
          newDisplayValue = '#ERROR!';
        }
      }
    }

    const updatedCell: Cell = {
      ...cell,
      style: newStyle,
      displayValue: newDisplayValue,
    };

    const updatedCells = [...sheet.cells];
    updatedCells[row] = [...updatedCells[row]];
    updatedCells[row][col] = updatedCell;

    const updatedSheet: Sheet = {
      ...sheet,
      cells: updatedCells,
    };

    this.updateSheet(updatedSheet);
  }

  /**
   * Sets the selected cell
   */
  selectCell(address: CellAddress | null): void {
    this._selectedCell$.next(address);

    // Clear range selection when selecting a single cell
    if (address) {
      this._selectedRange$.next(null);
    }
  }

  /**
   * Sets the selected range
   */
  selectRange(range: CellRange | null): void {
    this._selectedRange$.next(range);

    // Clear single cell selection when selecting a range
    if (range) {
      this._selectedCell$.next(null);
    }
  }

  /**
   * Sets the cell currently being edited
   */
  setEditingCell(address: CellAddress | null): void {
    this._editingCell$.next(address);
  }

  /**
   * Gets the currently selected cell address
   */
  getSelectedCell(): CellAddress | null {
    return this._selectedCell$.value;
  }

  /**
   * Gets the currently selected range
   */
  getSelectedRange(): CellRange | null {
    return this._selectedRange$.value;
  }

  /**
   * Gets the cell currently being edited
   */
  getEditingCell(): CellAddress | null {
    return this._editingCell$.value;
  }

  /**
   * Loads spreadsheet data
   */
  loadData(data: SpreadsheetData): void {
    // Recalculate all formulas in the loaded data
    const updatedData = this.recalculateAllFormulas(data);
    this._data$.next(updatedData);
    this.clearHistory();
  }

  /**
   * Recalculates all formulas in all sheets
   */
  private recalculateAllFormulas(data: SpreadsheetData): SpreadsheetData {
    const updatedSheets = data.sheets.map((sheet) => {
      const updatedCells = sheet.cells.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          if (
            typeof cell.value === 'string' &&
            cell.value.startsWith('=')
          ) {
            try {
              const result = this.formulaService.evaluateFormula(
                cell.value,
                sheet.cells,
                rowIndex,
                colIndex
              );
              return {
                ...cell,
                displayValue: String(result),
                dataType: 'formula' as Cell['dataType'],
              };
            } catch {
              return {
                ...cell,
                displayValue: '#ERROR!',
                dataType: 'error' as Cell['dataType'],
              };
            }
          }
          return cell;
        })
      );

      return {
        ...sheet,
        cells: updatedCells,
      };
    });

    return {
      ...data,
      sheets: updatedSheets,
    };
  }

  /**
   * Updates the active sheet
   */
  setActiveSheet(index: number): void {
    const data = this.getData();
    if (index < 0 || index >= data.sheets.length) return;

    const updatedSheets = data.sheets.map((sheet, i) => ({
      ...sheet,
      isActive: i === index,
    }));

    this._data$.next({
      ...data,
      sheets: updatedSheets,
      activeSheetIndex: index,
    });
  }

  /**
   * Adds a new sheet to the spreadsheet
   */
  addSheet(name?: string): void {
    const data = this.getData();
    const sheetNumber = data.sheets.length + 1;
    const sheetName = name || `Sheet${sheetNumber}`;

    const newSheet: Sheet = createEmptySheet({ name: sheetName });

    this._data$.next({
      ...data,
      sheets: [...data.sheets, newSheet],
      metadata: {
        ...data.metadata,
        modifiedDate: new Date(),
      },
    });
  }

  /**
   * Deletes a sheet from the spreadsheet
   */
  deleteSheet(index: number): void {
    const data = this.getData();

    // Can't delete if only one sheet remains
    if (data.sheets.length <= 1) return;

    // Can't delete invalid index
    if (index < 0 || index >= data.sheets.length) return;

    const updatedSheets = data.sheets.filter((_, i) => i !== index);

    // If we deleted the active sheet, activate another one
    let newActiveIndex = data.activeSheetIndex;
    if (index === data.activeSheetIndex) {
      // If deleted the last sheet, activate the new last sheet
      newActiveIndex = index >= updatedSheets.length ? updatedSheets.length - 1 : index;
    } else if (index < data.activeSheetIndex) {
      // If deleted a sheet before the active one, adjust the index
      newActiveIndex = data.activeSheetIndex - 1;
    }

    const sheetsWithActiveFlag = updatedSheets.map((sheet, i) => ({
      ...sheet,
      isActive: i === newActiveIndex,
    }));

    this._data$.next({
      ...data,
      sheets: sheetsWithActiveFlag,
      activeSheetIndex: newActiveIndex,
      metadata: {
        ...data.metadata,
        modifiedDate: new Date(),
      },
    });
  }

  /**
   * Renames a sheet
   */
  renameSheet(index: number, newName: string): void {
    const data = this.getData();

    if (index < 0 || index >= data.sheets.length) return;
    if (!newName || !newName.trim()) return;

    const updatedSheets = data.sheets.map((sheet, i) =>
      i === index ? { ...sheet, name: newName.trim() } : sheet
    );

    this._data$.next({
      ...data,
      sheets: updatedSheets,
      metadata: {
        ...data.metadata,
        modifiedDate: new Date(),
      },
    });
  }

  /**
   * Gets all sheets in the spreadsheet
   */
  getSheets(): Sheet[] {
    return this.getData().sheets;
  }

  /**
   * Updates a sheet in the spreadsheet
   */
  private updateSheet(updatedSheet: Sheet): void {
    const data = this.getData();
    const sheetIndex = data.sheets.findIndex((s) => s.id === updatedSheet.id);

    if (sheetIndex === -1) return;

    const updatedSheets = [...data.sheets];
    updatedSheets[sheetIndex] = updatedSheet;

    this._data$.next({
      ...data,
      sheets: updatedSheets,
      metadata: {
        ...data.metadata,
        modifiedDate: new Date(),
      },
    });
  }

  /**
   * Updates the cells of the active sheet (for sorting)
   */
  updateSheetCells(cells: Cell[][]): void {
    const sheet = this.getActiveSheet();
    if (!sheet) return;

    const updatedSheet: Sheet = {
      ...sheet,
      cells
    };

    this.updateSheet(updatedSheet);
  }

  /**
   * Updates column width
   */
  setColumnWidth(col: number, width: number): void {
    const sheet = this.getActiveSheet();
    if (!sheet || !sheet.columnWidths) return;

    const updatedWidths = [...sheet.columnWidths];
    updatedWidths[col] = width;

    const updatedSheet: Sheet = {
      ...sheet,
      columnWidths: updatedWidths,
    };

    this.updateSheet(updatedSheet);
  }

  /**
   * Updates row height
   */
  setRowHeight(row: number, height: number): void {
    const sheet = this.getActiveSheet();
    if (!sheet || !sheet.rowHeights) return;

    const updatedHeights = [...sheet.rowHeights];
    updatedHeights[row] = height;

    const updatedSheet: Sheet = {
      ...sheet,
      rowHeights: updatedHeights,
    };

    this.updateSheet(updatedSheet);
  }

  /**
   * Inserts a new row at the specified position
   */
  insertRow(atIndex: number): void {
    const sheet = this.getActiveSheet();
    if (!sheet) return;

    // Create a new empty row
    const newRow: Cell[] = [];
    for (let col = 0; col < sheet.colCount; col++) {
      newRow.push(createEmptyCell(atIndex, col));
    }

    // Insert the new row
    const updatedCells = [...sheet.cells];
    updatedCells.splice(atIndex, 0, newRow);

    // Update row indices for all rows after the inserted row
    for (let row = atIndex + 1; row < updatedCells.length; row++) {
      updatedCells[row] = updatedCells[row].map((cell) => ({
        ...cell,
        row,
      }));
    }

    // Insert default row height
    const updatedHeights = [...(sheet.rowHeights || [])];
    updatedHeights.splice(atIndex, 0, sheet.defaultRowHeight || 25);

    const updatedSheet: Sheet = {
      ...sheet,
      cells: updatedCells,
      rowCount: sheet.rowCount + 1,
      rowHeights: updatedHeights,
    };

    this.updateSheet(updatedSheet);
  }

  /**
   * Inserts a new column at the specified position
   */
  insertColumn(atIndex: number): void {
    const sheet = this.getActiveSheet();
    if (!sheet) return;

    // Insert a new cell in each row at the specified column index
    const updatedCells = sheet.cells.map((row, rowIndex) => {
      const newRow = [...row];
      const newCell = createEmptyCell(rowIndex, atIndex);
      newRow.splice(atIndex, 0, newCell);

      // Update column indices for all cells after the inserted column
      for (let col = atIndex + 1; col < newRow.length; col++) {
        newRow[col] = {
          ...newRow[col],
          col,
        };
      }

      return newRow;
    });

    // Insert default column width
    const updatedWidths = [...(sheet.columnWidths || [])];
    updatedWidths.splice(atIndex, 0, sheet.defaultColumnWidth || 100);

    const updatedSheet: Sheet = {
      ...sheet,
      cells: updatedCells,
      colCount: sheet.colCount + 1,
      columnWidths: updatedWidths,
    };

    this.updateSheet(updatedSheet);
  }

  /**
   * Deletes a row at the specified position
   */
  deleteRow(atIndex: number): void {
    const sheet = this.getActiveSheet();
    if (!sheet || sheet.rowCount <= 1) return;

    // Remove the row
    const updatedCells = [...sheet.cells];
    updatedCells.splice(atIndex, 1);

    // Update row indices for all rows after the deleted row
    for (let row = atIndex; row < updatedCells.length; row++) {
      updatedCells[row] = updatedCells[row].map((cell) => ({
        ...cell,
        row,
      }));
    }

    // Remove row height
    const updatedHeights = [...(sheet.rowHeights || [])];
    updatedHeights.splice(atIndex, 1);

    const updatedSheet: Sheet = {
      ...sheet,
      cells: updatedCells,
      rowCount: sheet.rowCount - 1,
      rowHeights: updatedHeights,
    };

    this.updateSheet(updatedSheet);
  }

  /**
   * Deletes a column at the specified position
   */
  deleteColumn(atIndex: number): void {
    const sheet = this.getActiveSheet();
    if (!sheet || sheet.colCount <= 1) return;

    // Remove the column from each row
    const updatedCells = sheet.cells.map((row) => {
      const newRow = [...row];
      newRow.splice(atIndex, 1);

      // Update column indices for all cells after the deleted column
      for (let col = atIndex; col < newRow.length; col++) {
        newRow[col] = {
          ...newRow[col],
          col,
        };
      }

      return newRow;
    });

    // Remove column width
    const updatedWidths = [...(sheet.columnWidths || [])];
    updatedWidths.splice(atIndex, 1);

    const updatedSheet: Sheet = {
      ...sheet,
      cells: updatedCells,
      colCount: sheet.colCount - 1,
      columnWidths: updatedWidths,
    };

    this.updateSheet(updatedSheet);
  }

  /**
   * Adds a new row at the end of the sheet
   */
  addRow(): void {
    const sheet = this.getActiveSheet();
    if (!sheet) return;
    this.insertRow(sheet.rowCount);
  }

  /**
   * Adds a new column at the end of the sheet
   */
  addColumn(): void {
    const sheet = this.getActiveSheet();
    if (!sheet) return;
    this.insertColumn(sheet.colCount);
  }

  /**
   * Copies the selected cell(s) to clipboard
   */
  copy(): string {
    const range = this.getSelectedRange();
    const sheet = this.getActiveSheet();
    if (!sheet) return '';

    let data: any[][] = [];

    if (range) {
      // Copy range
      const minRow = Math.min(range.start.row, range.end.row);
      const maxRow = Math.max(range.start.row, range.end.row);
      const minCol = Math.min(range.start.col, range.end.col);
      const maxCol = Math.max(range.start.col, range.end.col);

      for (let row = minRow; row <= maxRow; row++) {
        const rowData: any[] = [];
        for (let col = minCol; col <= maxCol; col++) {
          const cell = this.getCell(row, col);
          rowData.push(cell?.value ?? '');
        }
        data.push(rowData);
      }
    } else {
      // Copy single cell
      const selected = this.getSelectedCell();
      if (selected) {
        const cell = this.getCell(selected.row, selected.col);
        data = [[cell?.value ?? '']];
      }
    }

    // Convert to TSV format for clipboard
    const result = data.map(row => row.join('\t')).join('\n');
    return result;
  }

  /**
   * Pastes clipboard data into the spreadsheet
   */
  paste(clipboardData: string): void {
    const sheet = this.getActiveSheet();
    const selected = this.getSelectedCell();
    if (!sheet || !selected) return;

    // Parse TSV data
    const rows = clipboardData.split('\n').filter(line => line.trim());
    const data = rows.map(row => row.split('\t'));

    // Paste starting from selected cell
    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < data[i].length; j++) {
        const targetRow = selected.row + i;
        const targetCol = selected.col + j;

        if (targetRow < sheet.rowCount && targetCol < sheet.colCount) {
          this.updateCell(targetRow, targetCol, data[i][j]);
        }
      }
    }
  }

  /**
   * Undo last action
   */
  undo(): void {
    const entry = this.undoStack.pop();
    if (!entry) return;

    // Apply the undo
    if (entry.type === 'cell-update' && entry.row !== undefined && entry.col !== undefined) {
      const sheet = this.getActiveSheet();
      if (!sheet || sheet.id !== entry.sheetId) return;

      const cell = this.getCell(entry.row, entry.col);
      if (!cell) return;

      // Don't add to history when undoing
      const updatedCell: Cell = {
        ...cell,
        value: entry.oldValue,
        displayValue: String(entry.oldValue),
      };

      const updatedCells = [...sheet.cells];
      updatedCells[entry.row] = [...updatedCells[entry.row]];
      updatedCells[entry.row][entry.col] = updatedCell;

      const updatedSheet: Sheet = {
        ...sheet,
        cells: updatedCells,
      };

      this.updateSheet(updatedSheet);

      // Move to redo stack
      this.redoStack.push(entry);
    }
  }

  /**
   * Redo last undone action
   */
  redo(): void {
    const entry = this.redoStack.pop();
    if (!entry) return;

    // Apply the redo
    if (entry.type === 'cell-update' && entry.row !== undefined && entry.col !== undefined) {
      const sheet = this.getActiveSheet();
      if (!sheet || sheet.id !== entry.sheetId) return;

      const cell = this.getCell(entry.row, entry.col);
      if (!cell) return;

      const updatedCell: Cell = {
        ...cell,
        value: entry.newValue,
        displayValue: String(entry.newValue),
      };

      const updatedCells = [...sheet.cells];
      updatedCells[entry.row] = [...updatedCells[entry.row]];
      updatedCells[entry.row][entry.col] = updatedCell;

      const updatedSheet: Sheet = {
        ...sheet,
        cells: updatedCells,
      };

      this.updateSheet(updatedSheet);

      // Move back to undo stack
      this.undoStack.push(entry);
    }
  }

  /**
   * Adds an entry to the undo history
   */
  private addToHistory(entry: HistoryEntry): void {
    this.undoStack.push(entry);

    // Limit history size
    if (this.undoStack.length > this.MAX_HISTORY) {
      this.undoStack.shift();
    }

    // Clear redo stack when new action is performed
    this.redoStack = [];
  }

  /**
   * Clears undo/redo history
   */
  private clearHistory(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Checks if undo is available
   */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Checks if redo is available
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }
}
