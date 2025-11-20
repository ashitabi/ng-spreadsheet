import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  HostListener,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { SpreadsheetDataService } from '../services/spreadsheet-data.service';
import {
  Cell,
  CellAddress,
  SpreadsheetData,
  Sheet,
  colIndexToLetter,
} from '../models';

/**
 * Main spreadsheet component that displays an Excel-like grid with virtual scrolling.
 * Supports cell selection, editing, keyboard navigation, and Excel-like interactions.
 *
 * @example
 * ```html
 * <ngs-spreadsheet
 *   [data]="spreadsheetData"
 *   [height]="600"
 *   [width]="1000"
 *   (cellClick)="onCellClick($event)"
 *   (cellChange)="onCellChange($event)"
 * />
 * ```
 */
@Component({
  selector: 'ngs-spreadsheet',
  standalone: true,
  imports: [CommonModule, ScrollingModule],
  templateUrl: './spreadsheet.component.html',
  styleUrls: ['./spreadsheet.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpreadsheetComponent implements OnInit, OnDestroy {
  @ViewChild(CdkVirtualScrollViewport) viewport?: CdkVirtualScrollViewport;
  @ViewChild('cellInput') cellInput?: ElementRef<HTMLInputElement>;
  @ViewChild('formulaInput') formulaInput?: ElementRef<HTMLInputElement>;
  @ViewChild('cellsViewport') cellsViewport?: CdkVirtualScrollViewport;
  @ViewChild('rowHeadersViewport') rowHeadersViewport?: CdkVirtualScrollViewport;
  @ViewChild('columnHeadersContainer') columnHeadersContainer?: ElementRef<HTMLDivElement>;

  /**
   * Initial spreadsheet data
   */
  @Input() data?: SpreadsheetData;

  /**
   * Height of the spreadsheet container in pixels
   */
  @Input() height: number = 600;

  /**
   * Width of the spreadsheet container in pixels
   */
  @Input() width: number = 1000;

  /**
   * Whether the spreadsheet is readonly
   */
  @Input() readonly: boolean = false;

  /**
   * Emitted when a cell is clicked
   */
  @Output() cellClick = new EventEmitter<CellAddress>();

  /**
   * Emitted when a cell value changes
   */
  @Output() cellChange = new EventEmitter<{
    address: CellAddress;
    oldValue: any;
    newValue: any;
  }>();

  /**
   * Emitted when a cell is double-clicked
   */
  @Output() cellDoubleClick = new EventEmitter<CellAddress>();

  /**
   * Emitted when selection changes
   */
  @Output() selectionChange = new EventEmitter<CellAddress | null>();

  // Component state
  activeSheet: Sheet | null = null;
  selectedCell: CellAddress | null = null;
  editingCell: CellAddress | null = null;
  editingValue: string = '';

  // Range selection state
  isSelectingRange = false;
  isDragging = false;
  rangeStart: CellAddress | null = null;
  rangeEnd: CellAddress | null = null;

  // Virtual scrolling configuration
  readonly ROW_HEIGHT = 25;
  readonly HEADER_HEIGHT = 25;
  readonly FORMULA_BAR_HEIGHT = 28;
  readonly ROW_HEADER_WIDTH = 50;

  // Context menu state
  contextMenuVisible = false;
  contextMenuX = 0;
  contextMenuY = 0;

  // Column resizing state
  isResizingColumn = false;
  resizingColumnIndex = -1;
  columnResizeStartX = 0;
  columnResizeStartWidth = 0;

  // Row resizing state
  isResizingRow = false;
  resizingRowIndex = -1;
  rowResizeStartY = 0;
  rowResizeStartHeight = 0;

  // Fill handle state
  isFilling = false;
  fillStartRow = -1;
  fillStartCol = -1;
  fillEndRow = -1;
  fillEndCol = -1;

  // Formula autocomplete state
  showAutocomplete = false;
  autocompleteX = 0;
  autocompleteY = 0;
  autocompleteFormulas: Array<{ name: string; description: string; syntax: string }> = [];
  selectedAutocompleteIndex = 0;

  // Parameter hints state
  showParameterHint = false;
  parameterHintX = 0;
  parameterHintY = 0;
  parameterHintFormula: { name: string; syntax: string; description: string } | null = null;

  // Available formulas with descriptions
  readonly availableFormulas = [
    { name: 'SUM', description: 'Adds all numbers in a range', syntax: 'SUM(range)' },
    { name: 'AVERAGE', description: 'Returns the average of numbers', syntax: 'AVERAGE(range)' },
    { name: 'COUNT', description: 'Counts numbers in a range', syntax: 'COUNT(range)' },
    { name: 'COUNTA', description: 'Counts non-empty cells', syntax: 'COUNTA(range)' },
    { name: 'COUNTBLANK', description: 'Counts empty cells', syntax: 'COUNTBLANK(range)' },
    { name: 'MAX', description: 'Returns the maximum value', syntax: 'MAX(range)' },
    { name: 'MIN', description: 'Returns the minimum value', syntax: 'MIN(range)' },
    { name: 'MEDIAN', description: 'Returns the median value', syntax: 'MEDIAN(range)' },
    { name: 'MODE', description: 'Returns the most frequent value', syntax: 'MODE(range)' },
    { name: 'PRODUCT', description: 'Multiplies all numbers', syntax: 'PRODUCT(range)' },
    { name: 'STDEV', description: 'Standard deviation (sample)', syntax: 'STDEV(range)' },
    { name: 'VAR', description: 'Variance (sample)', syntax: 'VAR(range)' },
    { name: 'CORREL', description: 'Correlation coefficient', syntax: 'CORREL(array1, array2)' },
    { name: 'PERCENTILE', description: 'Returns kth percentile', syntax: 'PERCENTILE(array, k)' },
    { name: 'QUARTILE', description: 'Returns quartile value', syntax: 'QUARTILE(array, quart)' },
    { name: 'RANK', description: 'Ranks a number in a list', syntax: 'RANK(number, ref, [order])' },
    { name: 'IF', description: 'Conditional logic', syntax: 'IF(condition, value_if_true, value_if_false)' },
    { name: 'IFS', description: 'Multiple conditions', syntax: 'IFS(condition1, value1, ...)' },
    { name: 'IFERROR', description: 'Error handling', syntax: 'IFERROR(value, value_if_error)' },
    { name: 'IFNA', description: 'Handles #N/A errors', syntax: 'IFNA(value, value_if_na)' },
    { name: 'AND', description: 'All conditions must be true', syntax: 'AND(logical1, logical2, ...)' },
    { name: 'OR', description: 'Any condition must be true', syntax: 'OR(logical1, logical2, ...)' },
    { name: 'NOT', description: 'Reverses logic', syntax: 'NOT(logical)' },
  ];

  private destroy$ = new Subject<void>();

  constructor(public dataService: SpreadsheetDataService) {}

  ngOnInit(): void {
    // Load initial data if provided
    if (this.data) {
      this.dataService.loadData(this.data);
    }

    // Subscribe to active sheet changes
    this.dataService.activeSheet$
      .pipe(takeUntil(this.destroy$))
      .subscribe((sheet) => {
        this.activeSheet = sheet;
      });

    // Subscribe to selected cell changes
    this.dataService.selectedCell$
      .pipe(takeUntil(this.destroy$))
      .subscribe((cell) => {
        this.selectedCell = cell;
        this.selectionChange.emit(cell);
      });

    // Subscribe to editing cell changes
    this.dataService.editingCell$
      .pipe(takeUntil(this.destroy$))
      .subscribe((cell) => {
        this.editingCell = cell;

        // Focus input when entering edit mode
        if (cell) {
          setTimeout(() => this.cellInput?.nativeElement.focus(), 0);
        }
      });

    // Subscribe to range selection changes
    this.dataService.selectedRange$
      .pipe(takeUntil(this.destroy$))
      .subscribe((range) => {
        if (range) {
          this.rangeStart = range.start;
          this.rangeEnd = range.end;
        } else {
          this.rangeStart = null;
          this.rangeEnd = null;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Handles keyboard shortcuts
   */
  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    // Don't handle keyboard events if we're editing
    if (this.editingCell) {
      return;
    }

    const selected = this.selectedCell;
    if (!selected || !this.activeSheet) return;

    let handled = true;

    switch (event.key) {
      case 'ArrowUp':
        this.moveSelection(selected.row - 1, selected.col);
        break;

      case 'ArrowDown':
      case 'Enter':
        this.moveSelection(selected.row + 1, selected.col);
        break;

      case 'ArrowLeft':
        this.moveSelection(selected.row, selected.col - 1);
        break;

      case 'ArrowRight':
      case 'Tab':
        this.moveSelection(selected.row, selected.col + 1);
        break;

      case 'F2':
        this.startEditing(selected);
        break;

      case 'Delete':
      case 'Backspace':
        if (!this.readonly) {
          this.dataService.updateCell(selected.row, selected.col, '');
        }
        break;

      case 'z':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.dataService.undo();
        } else {
          handled = false;
        }
        break;

      case 'y':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.dataService.redo();
        } else {
          handled = false;
        }
        break;

      case 'c':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.handleCopy();
        } else {
          handled = false;
        }
        break;

      case 'v':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.handlePaste();
        } else {
          handled = false;
        }
        break;

      default:
        handled = false;
    }

    if (handled) {
      event.preventDefault();
    }
  }

  /**
   * Moves the selection to a new cell
   */
  private moveSelection(row: number, col: number): void {
    if (!this.activeSheet) return;

    // Clamp to valid range
    row = Math.max(0, Math.min(row, this.activeSheet.rowCount - 1));
    col = Math.max(0, Math.min(col, this.activeSheet.colCount - 1));

    this.dataService.selectCell({ row, col });
  }

  /**
   * Handles cell mousedown (start of click or drag)
   */
  onCellMouseDown(event: MouseEvent, row: number, col: number): void {
    event.preventDefault();
    event.stopPropagation();

    // Focus the spreadsheet container to enable keyboard navigation
    const container = (event.target as HTMLElement).closest('.spreadsheet-container') as HTMLElement;
    if (container) {
      container.focus();
    }

    const address: CellAddress = { row, col };

    // Handle range selection with Shift key (extend selection)
    if (event.shiftKey && this.selectedCell) {
      this.rangeStart = this.selectedCell;
      this.rangeEnd = address;
      this.dataService.selectRange({
        start: this.rangeStart,
        end: this.rangeEnd,
      });
    } else {
      // Start new selection
      this.isDragging = true;
      this.rangeStart = address;
      this.rangeEnd = address;
      this.dataService.selectCell(address);
      this.cellClick.emit(address);
    }
  }

  /**
   * Handles cell mouseenter (for hover effects)
   */
  onCellMouseEnter(event: MouseEvent, row: number, col: number): void {
    // Mouse enter is used for hover effects
    // Actual drag selection is handled by onCellMouseMove
  }

  /**
   * Handles cell mousemove (during drag)
   */
  onCellMouseMove(event: MouseEvent, row: number, col: number): void {
    // Prevent default to avoid text selection during drag
    if (this.isDragging || this.isFilling) {
      event.preventDefault();
    }

    // Handle drag selection
    if (this.isDragging && this.rangeStart) {
      this.rangeEnd = { row, col };

      // If drag covers more than one cell, switch to range selection
      if (this.rangeStart.row !== this.rangeEnd.row ||
          this.rangeStart.col !== this.rangeEnd.col) {
        this.dataService.selectRange({
          start: this.rangeStart,
          end: this.rangeEnd,
        });
      }
    }

    // Handle fill handle dragging
    if (this.isFilling && this.fillStartRow >= 0 && this.fillStartCol >= 0) {
      this.fillEndRow = row;
      this.fillEndCol = col;
    }
  }

  /**
   * Handles mouseup (end of drag)
   */
  @HostListener('window:mouseup')
  onMouseUp(): void {
    this.isDragging = false;

    // Handle end of fill operation
    if (this.isFilling) {
      this.completeFillOperation();
    }

    // Handle end of column resize
    if (this.isResizingColumn) {
      this.isResizingColumn = false;
      this.resizingColumnIndex = -1;
    }

    // Handle end of row resize
    if (this.isResizingRow) {
      this.isResizingRow = false;
      this.resizingRowIndex = -1;
    }
  }

  /**
   * Handles mouse move during resize operations
   */
  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.isResizingColumn && this.resizingColumnIndex >= 0) {
      const delta = event.clientX - this.columnResizeStartX;
      const newWidth = Math.max(30, this.columnResizeStartWidth + delta);
      this.dataService.setColumnWidth(this.resizingColumnIndex, newWidth);
    }

    if (this.isResizingRow && this.resizingRowIndex >= 0) {
      const delta = event.clientY - this.rowResizeStartY;
      const newHeight = Math.max(20, this.rowResizeStartHeight + delta);
      this.dataService.setRowHeight(this.resizingRowIndex, newHeight);
    }
  }

  /**
   * Handles cell click (for compatibility)
   */
  onCellClick(event: MouseEvent, row: number, col: number): void {
    // Most work is done in mousedown/mouseup, this is for compatibility
  }

  /**
   * Handles cell double-click to start editing
   */
  onCellDoubleClick(event: MouseEvent, row: number, col: number): void {
    event.stopPropagation();

    if (this.readonly) return;

    const address: CellAddress = { row, col };
    this.startEditing(address);
    this.cellDoubleClick.emit(address);
  }

  /**
   * Starts editing a cell
   */
  private startEditing(address: CellAddress): void {
    if (this.readonly) return;

    const cell = this.dataService.getCell(address.row, address.col);
    if (!cell || cell.readonly) return;

    this.editingValue = String(cell.value ?? '');
    this.dataService.setEditingCell(address);
  }

  /**
   * Handles input changes during editing
   */
  onEditingInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.editingValue = input.value;

    // Update autocomplete
    this.updateAutocomplete(input.value, event);

    // Update parameter hint
    this.updateParameterHint(input.value, event);
  }

  /**
   * Handles Enter key during editing
   */
  onEditingKeyDown(event: KeyboardEvent): void {
    // Handle autocomplete navigation first
    if (this.showAutocomplete && ['ArrowDown', 'ArrowUp', 'Escape'].includes(event.key)) {
      this.onAutocompleteKeyDown(event, false);
      return;
    }

    if (event.key === 'Tab' && this.showAutocomplete) {
      this.onAutocompleteKeyDown(event, false);
      return;
    }

    if (event.key === 'Enter') {
      // If autocomplete is showing, select the formula
      if (this.showAutocomplete) {
        event.preventDefault();
        this.selectAutocompleteFormula(false);
        return;
      }

      event.preventDefault();
      this.commitEdit();

      // Move to next row
      if (this.editingCell) {
        this.moveSelection(this.editingCell.row + 1, this.editingCell.col);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      if (this.showAutocomplete) {
        this.showAutocomplete = false;
      } else {
        this.cancelEdit();
      }
    } else if (event.key === 'Tab') {
      event.preventDefault();
      this.commitEdit();

      // Move to next column
      if (this.editingCell) {
        this.moveSelection(this.editingCell.row, this.editingCell.col + 1);
      }
    }
  }

  /**
   * Handles blur event during editing
   */
  onEditingBlur(): void {
    this.commitEdit();
  }

  /**
   * Commits the current edit
   */
  private commitEdit(): void {
    if (!this.editingCell) return;

    const cell = this.dataService.getCell(
      this.editingCell.row,
      this.editingCell.col
    );

    if (!cell) return;

    const oldValue = cell.value;
    const newValue = this.editingValue;

    if (oldValue !== newValue) {
      this.dataService.updateCell(
        this.editingCell.row,
        this.editingCell.col,
        newValue
      );

      this.cellChange.emit({
        address: this.editingCell,
        oldValue,
        newValue,
      });
    }

    this.dataService.setEditingCell(null);
    this.editingValue = '';
  }

  /**
   * Cancels the current edit
   */
  private cancelEdit(): void {
    this.dataService.setEditingCell(null);
    this.editingValue = '';
  }

  /**
   * Handles copy operation (Ctrl+C / Cmd+C)
   */
  private async handleCopy(): Promise<void> {
    const data = this.dataService.copy();
    if (data) {
      try {
        await navigator.clipboard.writeText(data);
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
      }
    }
  }

  /**
   * Handles paste operation (Ctrl+V / Cmd+V)
   */
  private async handlePaste(): Promise<void> {
    if (this.readonly) return;

    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        this.dataService.paste(text);
      }
    } catch (err) {
      console.error('Failed to paste from clipboard:', err);
    }
  }

  /**
   * Gets the display value for a cell
   */
  getCellDisplay(row: number, col: number): string {
    const cell = this.dataService.getCell(row, col);
    return cell?.displayValue ?? '';
  }

  /**
   * Checks if a cell is selected
   */
  isCellSelected(row: number, col: number): boolean {
    return (
      this.selectedCell?.row === row && this.selectedCell?.col === col
    );
  }

  /**
   * Checks if a cell is being edited
   */
  isCellEditing(row: number, col: number): boolean {
    return (
      this.editingCell?.row === row && this.editingCell?.col === col
    );
  }

  /**
   * Checks if a cell is in the selected range
   */
  isCellInRange(row: number, col: number): boolean {
    if (!this.rangeStart || !this.rangeEnd) return false;

    const minRow = Math.min(this.rangeStart.row, this.rangeEnd.row);
    const maxRow = Math.max(this.rangeStart.row, this.rangeEnd.row);
    const minCol = Math.min(this.rangeStart.col, this.rangeEnd.col);
    const maxCol = Math.max(this.rangeStart.col, this.rangeEnd.col);

    return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
  }

  /**
   * Gets the column header label (A, B, C, ...)
   */
  getColumnLabel(col: number): string {
    return colIndexToLetter(col);
  }

  /**
   * Gets the row header label (1, 2, 3, ...)
   */
  getRowLabel(row: number): string {
    return String(row + 1);
  }

  /**
   * Gets the width of a column
   */
  getColumnWidth(col: number): number {
    return this.activeSheet?.columnWidths?.[col] ?? this.activeSheet?.defaultColumnWidth ?? 100;
  }

  /**
   * Gets an array of column indices
   */
  getColumns(): number[] {
    if (!this.activeSheet) return [];
    return Array.from({ length: this.activeSheet.colCount }, (_, i) => i);
  }

  /**
   * Gets an array of row indices for virtual scrolling
   */
  getRows(): number[] {
    if (!this.activeSheet) return [];
    return Array.from({ length: this.activeSheet.rowCount }, (_, i) => i);
  }

  /**
   * Track by function for row rendering
   */
  trackByRow(index: number): number {
    return index;
  }

  /**
   * Track by function for column rendering
   */
  trackByCol(index: number): number {
    return index;
  }

  /**
   * Gets the selected cell name in A1 notation
   */
  getSelectedCellName(): string {
    if (!this.selectedCell) return '';
    return `${colIndexToLetter(this.selectedCell.col)}${this.selectedCell.row + 1}`;
  }

  /**
   * Gets the formula bar value (formula or cell value)
   */
  getFormulaBarValue(): string {
    if (!this.selectedCell) return '';
    const cell = this.dataService.getCell(this.selectedCell.row, this.selectedCell.col);
    if (!cell) return '';

    // Return the raw value (which may be a formula starting with '=')
    return String(cell.value ?? '');
  }

  /**
   * Handles formula bar input
   */
  onFormulaBarInput(event: Event): void {
    if (!this.selectedCell || this.readonly) return;

    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Update the cell value
    this.dataService.updateCell(this.selectedCell.row, this.selectedCell.col, value);

    // Update autocomplete
    this.updateAutocomplete(value, event);

    // Update parameter hint
    this.updateParameterHint(value, event);
  }

  /**
   * Handles formula bar key down
   */
  onFormulaBarKeyDown(event: KeyboardEvent): void {
    // Handle autocomplete navigation first
    if (this.showAutocomplete && ['ArrowDown', 'ArrowUp', 'Tab', 'Escape'].includes(event.key)) {
      this.onAutocompleteKeyDown(event, true);
      return;
    }

    if (event.key === 'Enter') {
      // If autocomplete is showing, select the formula
      if (this.showAutocomplete) {
        event.preventDefault();
        this.selectAutocompleteFormula(true);
        return;
      }

      event.preventDefault();

      // Commit the value and move down
      if (this.selectedCell) {
        const input = event.target as HTMLInputElement;
        this.dataService.updateCell(this.selectedCell.row, this.selectedCell.col, input.value);
        this.moveSelection(this.selectedCell.row + 1, this.selectedCell.col);
      }

      // Blur the formula input
      this.formulaInput?.nativeElement.blur();
    } else if (event.key === 'Escape') {
      event.preventDefault();

      // Revert and blur
      if (this.formulaInput) {
        this.formulaInput.nativeElement.value = this.getFormulaBarValue();
        this.formulaInput.nativeElement.blur();
      }
    }
  }

  /**
   * Handles formula bar focus
   */
  onFormulaBarFocus(): void {
    // Select all text when focused
    setTimeout(() => {
      this.formulaInput?.nativeElement.select();
    }, 0);
  }

  /**
   * Gets the total width of all columns
   */
  getTotalWidth(): number {
    if (!this.activeSheet) return 0;

    let totalWidth = 0;
    for (let col = 0; col < this.activeSheet.colCount; col++) {
      totalWidth += this.getColumnWidth(col);
    }
    return totalWidth;
  }

  /**
   * Gets the left position of a column
   */
  getColumnLeft(col: number): number {
    if (!this.activeSheet) return 0;

    let left = 0;
    for (let i = 0; i < col; i++) {
      left += this.getColumnWidth(i);
    }
    return left;
  }

  /**
   * Handles column headers scroll
   */
  onColumnHeadersScroll(event: Event): void {
    const target = event.target as HTMLElement;

    // Sync cells viewport horizontal scroll
    if (this.cellsViewport) {
      this.cellsViewport.elementRef.nativeElement.scrollLeft = target.scrollLeft;
    }
  }

  /**
   * Handles cells scroll
   */
  onCellsScroll(event: Event): void {
    const target = event.target as HTMLElement;

    // Sync column headers horizontal scroll
    if (this.columnHeadersContainer) {
      this.columnHeadersContainer.nativeElement.scrollLeft = target.scrollLeft;
    }

    // Sync row headers vertical scroll using scrollTo method
    if (this.rowHeadersViewport) {
      this.rowHeadersViewport.scrollTo({ top: target.scrollTop });
    }
  }

  /**
   * Handles column resizer mouse down
   */
  onColumnResizerMouseDown(event: MouseEvent, col: number): void {
    event.preventDefault();
    event.stopPropagation();

    this.isResizingColumn = true;
    this.resizingColumnIndex = col;
    this.columnResizeStartX = event.clientX;
    this.columnResizeStartWidth = this.getColumnWidth(col);
  }

  /**
   * Handles row resizer mouse down
   */
  onRowResizerMouseDown(event: MouseEvent, row: number): void {
    event.preventDefault();
    event.stopPropagation();

    this.isResizingRow = true;
    this.resizingRowIndex = row;
    this.rowResizeStartY = event.clientY;
    this.rowResizeStartHeight = this.ROW_HEIGHT; // Could be made dynamic per row
  }

  /**
   * Handles cell context menu
   */
  onCellContextMenu(event: MouseEvent, row: number, col: number): void {
    event.preventDefault();
    event.stopPropagation();

    // Select the cell if not already selected
    if (!this.isCellSelected(row, col)) {
      this.dataService.selectCell({ row, col });
    }

    // Show context menu at cursor position
    this.contextMenuX = event.clientX;
    this.contextMenuY = event.clientY;
    this.contextMenuVisible = true;
  }

  /**
   * Handles fill handle mouse down
   */
  onFillHandleMouseDown(event: MouseEvent, row: number, col: number): void {
    event.preventDefault();
    event.stopPropagation();

    this.isFilling = true;
    this.fillStartRow = row;
    this.fillStartCol = col;
    this.fillEndRow = row;
    this.fillEndCol = col;
  }

  /**
   * Completes the fill operation
   */
  private completeFillOperation(): void {
    if (!this.isFilling || this.fillStartRow < 0 || this.fillStartCol < 0) {
      this.isFilling = false;
      return;
    }

    // Get the source cell value
    const sourceCell = this.dataService.getCell(this.fillStartRow, this.fillStartCol);
    if (!sourceCell) {
      this.isFilling = false;
      return;
    }

    // Determine fill direction and range
    const minRow = Math.min(this.fillStartRow, this.fillEndRow);
    const maxRow = Math.max(this.fillStartRow, this.fillEndRow);
    const minCol = Math.min(this.fillStartCol, this.fillEndCol);
    const maxCol = Math.max(this.fillStartCol, this.fillEndCol);

    // Fill cells in the range
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        // Skip the source cell
        if (row === this.fillStartRow && col === this.fillStartCol) {
          continue;
        }

        // Copy the value
        this.dataService.updateCell(row, col, sourceCell.value);
      }
    }

    // Reset fill state
    this.isFilling = false;
    this.fillStartRow = -1;
    this.fillStartCol = -1;
    this.fillEndRow = -1;
    this.fillEndCol = -1;
  }

  /**
   * Context menu: Copy
   */
  onContextMenuCopy(): void {
    this.handleCopy();
    this.contextMenuVisible = false;
  }

  /**
   * Context menu: Cut
   */
  onContextMenuCut(): void {
    // Copy then clear
    this.handleCopy();
    if (this.selectedCell && !this.readonly) {
      this.dataService.updateCell(this.selectedCell.row, this.selectedCell.col, '');
    }
    this.contextMenuVisible = false;
  }

  /**
   * Context menu: Paste
   */
  onContextMenuPaste(): void {
    this.handlePaste();
    this.contextMenuVisible = false;
  }

  /**
   * Context menu: Delete
   */
  onContextMenuDelete(): void {
    if (this.readonly) {
      this.contextMenuVisible = false;
      return;
    }

    // Delete selected cell or range
    if (this.rangeStart && this.rangeEnd) {
      const minRow = Math.min(this.rangeStart.row, this.rangeEnd.row);
      const maxRow = Math.max(this.rangeStart.row, this.rangeEnd.row);
      const minCol = Math.min(this.rangeStart.col, this.rangeEnd.col);
      const maxCol = Math.max(this.rangeStart.col, this.rangeEnd.col);

      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          this.dataService.updateCell(row, col, '');
        }
      }
    } else if (this.selectedCell) {
      this.dataService.updateCell(this.selectedCell.row, this.selectedCell.col, '');
    }

    this.contextMenuVisible = false;
  }

  /**
   * Context menu: Insert Row
   */
  onContextMenuInsertRow(): void {
    // TODO: Implement insert row functionality
    this.contextMenuVisible = false;
  }

  /**
   * Context menu: Insert Column
   */
  onContextMenuInsertColumn(): void {
    // TODO: Implement insert column functionality
    this.contextMenuVisible = false;
  }

  /**
   * Context menu: Delete Row
   */
  onContextMenuDeleteRow(): void {
    // TODO: Implement delete row functionality
    this.contextMenuVisible = false;
  }

  /**
   * Context menu: Delete Column
   */
  onContextMenuDeleteColumn(): void {
    // TODO: Implement delete column functionality
    this.contextMenuVisible = false;
  }

  /**
   * Hides context menu when clicking outside
   */
  @HostListener('document:click')
  onDocumentClick(): void {
    this.contextMenuVisible = false;
  }

  /**
   * Gets the row height (could be made dynamic per row)
   */
  getRowHeight(row: number): number {
    return this.activeSheet?.rowHeights?.[row] ?? this.ROW_HEIGHT;
  }

  /**
   * Gets the top position of a row
   */
  getRowTop(row: number): number {
    if (!this.activeSheet) return 0;

    let top = 0;
    for (let i = 0; i < row; i++) {
      top += this.getRowHeight(i);
    }
    return top;
  }

  /**
   * Gets the total height of all rows
   */
  getTotalHeight(): number {
    if (!this.activeSheet) return 0;

    let totalHeight = 0;
    for (let row = 0; row < this.activeSheet.rowCount; row++) {
      totalHeight += this.getRowHeight(row);
    }
    return totalHeight;
  }

  // ========== FORMULA AUTOCOMPLETE METHODS ==========

  /**
   * Updates autocomplete suggestions based on input
   */
  updateAutocomplete(input: string, event?: Event): void {
    // Check if input starts with = and has at least one character after
    if (!input.startsWith('=') || input.length < 2) {
      this.showAutocomplete = false;
      return;
    }

    // Extract the formula name being typed (after = and before ()
    const match = input.match(/^=([A-Z]*)$/i);
    if (!match) {
      this.showAutocomplete = false;
      return;
    }

    const searchTerm = match[1].toUpperCase();

    // Filter formulas based on search term
    this.autocompleteFormulas = this.availableFormulas.filter(f =>
      f.name.startsWith(searchTerm)
    );

    if (this.autocompleteFormulas.length === 0) {
      this.showAutocomplete = false;
      return;
    }

    // Calculate position for autocomplete dropdown
    if (event) {
      const target = event.target as HTMLElement;
      const rect = target.getBoundingClientRect();
      this.autocompleteX = rect.left;
      this.autocompleteY = rect.bottom;
    }

    this.showAutocomplete = true;
    this.selectedAutocompleteIndex = 0;
  }

  /**
   * Handles autocomplete keyboard navigation
   */
  onAutocompleteKeyDown(event: KeyboardEvent, isFormulaBar: boolean = false): void {
    if (!this.showAutocomplete) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedAutocompleteIndex = Math.min(
          this.selectedAutocompleteIndex + 1,
          this.autocompleteFormulas.length - 1
        );
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.selectedAutocompleteIndex = Math.max(this.selectedAutocompleteIndex - 1, 0);
        break;

      case 'Tab':
      case 'Enter':
        if (event.key === 'Tab' || (event.key === 'Enter' && this.showAutocomplete)) {
          event.preventDefault();
          this.selectAutocompleteFormula(isFormulaBar);
        }
        break;

      case 'Escape':
        event.preventDefault();
        this.showAutocomplete = false;
        break;
    }
  }

  /**
   * Selects a formula from autocomplete
   */
  selectAutocompleteFormula(isFormulaBar: boolean = false): void {
    if (!this.showAutocomplete || this.autocompleteFormulas.length === 0) return;

    const selected = this.autocompleteFormulas[this.selectedAutocompleteIndex];
    const formulaText = `=${selected.name}(`;

    if (isFormulaBar) {
      // Update formula bar
      if (this.formulaInput) {
        this.formulaInput.nativeElement.value = formulaText;
        this.formulaInput.nativeElement.focus();
        // Trigger input event to update autocomplete
        const event = new Event('input', { bubbles: true });
        this.formulaInput.nativeElement.dispatchEvent(event);
      }
    } else {
      // Update cell input
      this.editingValue = formulaText;
      // Focus will remain on cell input
      setTimeout(() => {
        if (this.cellInput) {
          this.cellInput.nativeElement.focus();
        }
      });
    }

    this.showAutocomplete = false;
  }

  /**
   * Selects formula by clicking
   */
  onAutocompleteClick(index: number, isFormulaBar: boolean = false): void {
    this.selectedAutocompleteIndex = index;
    this.selectAutocompleteFormula(isFormulaBar);
  }

  // ========== PARAMETER HINT METHODS ==========

  /**
   * Updates parameter hint based on input
   */
  updateParameterHint(input: string, event?: Event): void {
    // Check if input contains a formula with opening parenthesis
    if (!input.startsWith('=')) {
      this.showParameterHint = false;
      return;
    }

    // Match pattern like =SUM( or =IF(A1>10,
    // Extract the formula name before the opening parenthesis
    const match = input.match(/=([A-Z]+)\(/i);
    if (!match) {
      this.showParameterHint = false;
      return;
    }

    const formulaName = match[1].toUpperCase();

    // Find the formula in available formulas
    const formula = this.availableFormulas.find(f => f.name === formulaName);

    if (!formula) {
      this.showParameterHint = false;
      return;
    }

    this.parameterHintFormula = formula;

    // Calculate position for parameter hint
    if (event) {
      const target = event.target as HTMLElement;
      const rect = target.getBoundingClientRect();
      this.parameterHintX = rect.left;
      this.parameterHintY = rect.top - 30; // Above the input
    }

    this.showParameterHint = true;
  }

  /**
   * Closes autocomplete when clicking outside
   */
  closeAutocomplete(): void {
    this.showAutocomplete = false;
  }
}
