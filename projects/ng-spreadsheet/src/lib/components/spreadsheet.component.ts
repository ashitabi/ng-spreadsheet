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
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { SpreadsheetDataService } from '../services/spreadsheet-data.service';
import {
  Cell,
  CellAddress,
  CellRange,
  CellStyle,
  SpreadsheetData,
  Sheet,
  colIndexToLetter,
} from '../models';
import { SpreadsheetRibbonComponent, RibbonAction } from './spreadsheet-ribbon.component';
import { SheetTabsComponent } from './sheet-tabs.component';

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
  imports: [CommonModule, ScrollingModule, SpreadsheetRibbonComponent, SheetTabsComponent],
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

  // Saved range for multi-cell editing (preserved during edit mode)
  savedEditRange: { start: CellAddress; end: CellAddress } | null = null;

  // Virtual scrolling configuration
  readonly ROW_HEIGHT = 25;
  readonly HEADER_HEIGHT = 25;
  readonly FORMULA_BAR_HEIGHT = 28;
  readonly RIBBON_HEIGHT = 60;
  readonly ROW_HEADER_WIDTH = 50;

  // Context menu state
  contextMenuVisible = false;
  contextMenuX = 0;
  contextMenuY = 0;
  showPasteSpecialMenu = false;

  // Column header context menu state
  columnContextMenuVisible = false;
  columnContextMenuX = 0;
  columnContextMenuY = 0;
  contextMenuColumnIndex = -1;

  // Format painter state
  formatPainterActive = false;
  copiedCellStyle: Partial<CellStyle> | null = null;

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

  constructor(
    public dataService: SpreadsheetDataService,
    private cdr: ChangeDetectorRef
  ) {}

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
        this.cdr.markForCheck();
      });

    // Subscribe to selected cell changes
    this.dataService.selectedCell$
      .pipe(takeUntil(this.destroy$))
      .subscribe((cell) => {
        this.selectedCell = cell;
        this.selectionChange.emit(cell);
        this.cdr.markForCheck();
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
        this.cdr.markForCheck();
      });

    // Subscribe to range selection changes
    this.dataService.selectedRange$
      .pipe(takeUntil(this.destroy$))
      .subscribe((range) => {
        // Don't overwrite rangeStart/rangeEnd if we're in the middle of a drag
        if (!this.isDragging) {
          if (range) {
            this.rangeStart = range.start;
            this.rangeEnd = range.end;
          } else {
            this.rangeStart = null;
            this.rangeEnd = null;
          }
        }
        this.cdr.markForCheck();
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

    if (!this.activeSheet) return;

    const selected = this.selectedCell;
    let handled = true;

    switch (event.key) {
      case 'ArrowUp':
        if (!selected) { handled = false; break; }
        this.moveSelection(selected.row - 1, selected.col);
        break;

      case 'ArrowDown':
      case 'Enter':
        if (!selected) { handled = false; break; }
        this.moveSelection(selected.row + 1, selected.col);
        break;

      case 'ArrowLeft':
        if (!selected) { handled = false; break; }
        this.moveSelection(selected.row, selected.col - 1);
        break;

      case 'ArrowRight':
      case 'Tab':
        if (!selected) { handled = false; break; }
        this.moveSelection(selected.row, selected.col + 1);
        break;

      case 'F2':
        if (!selected) { handled = false; break; }
        this.startEditing(selected);
        break;

      case 'Delete':
      case 'Backspace':
        if (!this.readonly) {
          // Check if there's a range selection first
          if (this.rangeStart && this.rangeEnd) {
            // Delete all cells in the range
            const minRow = Math.min(this.rangeStart.row, this.rangeEnd.row);
            const maxRow = Math.max(this.rangeStart.row, this.rangeEnd.row);
            const minCol = Math.min(this.rangeStart.col, this.rangeEnd.col);
            const maxCol = Math.max(this.rangeStart.col, this.rangeEnd.col);

            for (let row = minRow; row <= maxRow; row++) {
              for (let col = minCol; col <= maxCol; col++) {
                this.dataService.updateCell(row, col, '');
              }
            }
          } else if (selected) {
            // Delete single selected cell
            this.dataService.updateCell(selected.row, selected.col, '');
          } else {
            handled = false;
          }
        } else {
          handled = false;
        }
        break;

      case 'z':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.dataService.undo();
        } else {
          const cellToEdit = selected || this.rangeStart;
          if (cellToEdit && !this.readonly) {
            // Start editing with 'z'
            event.preventDefault();
            this.editingValue = event.key;
            this.dataService.setEditingCell(cellToEdit);
            handled = true;
          } else {
            handled = false;
          }
        }
        break;

      case 'y':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.dataService.redo();
        } else {
          const cellToEdit = selected || this.rangeStart;
          if (cellToEdit && !this.readonly) {
            // Start editing with 'y'
            event.preventDefault();
            this.editingValue = event.key;
            this.dataService.setEditingCell(cellToEdit);
            handled = true;
          } else {
            handled = false;
          }
        }
        break;

      case 'c':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.handleCopy();
        } else {
          const cellToEdit = selected || this.rangeStart;
          if (cellToEdit && !this.readonly) {
            // Start editing with 'c'
            event.preventDefault();
            this.editingValue = event.key;
            this.dataService.setEditingCell(cellToEdit);
            handled = true;
          } else {
            handled = false;
          }
        }
        break;

      case 'v':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.handlePaste();
        } else {
          const cellToEdit = selected || this.rangeStart;
          if (cellToEdit && !this.readonly) {
            // Start editing with 'v'
            event.preventDefault();
            this.editingValue = event.key;
            this.dataService.setEditingCell(cellToEdit);
            handled = true;
          } else {
            handled = false;
          }
        }
        break;

      default:
        // Check if this is a printable character and no modifier keys are pressed
        // This allows typing to automatically start editing the cell (Excel-like behavior)
        // Use selectedCell if available, otherwise use rangeStart (when a range is selected)
        const cellToEdit = selected || this.rangeStart;
        if (cellToEdit && !this.readonly && !event.ctrlKey && !event.metaKey && !event.altKey) {
          // Check if it's a printable character (length = 1) or if it starts with '='
          if (event.key.length === 1 || event.key === '=') {
            event.preventDefault();
            // Save the range before starting to edit (for Ctrl+Enter multi-cell fill)
            if (this.rangeStart && this.rangeEnd) {
              this.savedEditRange = { start: this.rangeStart, end: this.rangeEnd };
              console.log('[DEBUG] Saved range for multi-cell edit:', this.savedEditRange);
            } else {
              this.savedEditRange = null;
              console.log('[DEBUG] No range to save, selectedCell:', this.selectedCell, 'rangeStart:', this.rangeStart);
            }
            // Start editing with the typed character
            this.editingValue = event.key;
            this.dataService.setEditingCell(cellToEdit);
            handled = true;
          } else {
            handled = false;
          }
        } else {
          handled = false;
        }
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

    // If we're currently editing a cell, commit the edit first
    if (this.editingCell) {
      this.commitEdit();
    }

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
      // Check if clicking inside an existing range
      const existingRange = this.dataService.getSelectedRange();
      let clickedInsideRange = false;

      if (existingRange) {
        const minRow = Math.min(existingRange.start.row, existingRange.end.row);
        const maxRow = Math.max(existingRange.start.row, existingRange.end.row);
        const minCol = Math.min(existingRange.start.col, existingRange.end.col);
        const maxCol = Math.max(existingRange.start.col, existingRange.end.col);
        clickedInsideRange = row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
      }

      if (clickedInsideRange) {
        // Clicking inside existing range - don't clear it, just prepare for potential drag
        this.isDragging = true;
        this.rangeStart = existingRange!.start;
        this.rangeEnd = existingRange!.end;
        // Don't call selectCell() to avoid clearing the range
      } else {
        // Start new selection
        this.isDragging = true;
        this.rangeStart = address;
        this.rangeEnd = address;
        this.dataService.selectCell(address);
        this.cellClick.emit(address);
      }
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
   * Handles mouse move during resize and drag operations
   */
  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    // Handle column resize
    if (this.isResizingColumn && this.resizingColumnIndex >= 0) {
      const delta = event.clientX - this.columnResizeStartX;
      const newWidth = Math.max(30, this.columnResizeStartWidth + delta);
      this.dataService.setColumnWidth(this.resizingColumnIndex, newWidth);
    }

    // Handle row resize
    if (this.isResizingRow && this.resizingRowIndex >= 0) {
      const delta = event.clientY - this.rowResizeStartY;
      const newHeight = Math.max(20, this.rowResizeStartHeight + delta);
      this.dataService.setRowHeight(this.resizingRowIndex, newHeight);
    }

    // Handle drag selection
    if (this.isDragging && this.rangeStart && this.cellsViewport) {
      event.preventDefault();

      // Get the cells viewport element
      const viewportEl = this.cellsViewport.elementRef.nativeElement;
      const rect = viewportEl.getBoundingClientRect();

      // Calculate mouse position relative to viewport
      const mouseX = event.clientX - rect.left + viewportEl.scrollLeft;
      const mouseY = event.clientY - rect.top + viewportEl.scrollTop;

      // Find which cell the mouse is over
      const cell = this.getCellAtPosition(mouseX, mouseY);

      if (cell) {
        this.rangeEnd = cell;

        // If drag covers more than one cell, switch to range selection
        if (this.rangeStart.row !== this.rangeEnd.row ||
            this.rangeStart.col !== this.rangeEnd.col) {
          this.dataService.selectRange({
            start: this.rangeStart,
            end: this.rangeEnd,
          });
        }
      }
    }

    // Handle fill handle dragging
    if (this.isFilling && this.fillStartRow >= 0 && this.fillStartCol >= 0 && this.cellsViewport) {
      // Get the cells viewport element
      const viewportEl = this.cellsViewport.elementRef.nativeElement;
      const rect = viewportEl.getBoundingClientRect();

      // Calculate mouse position relative to viewport
      const mouseX = event.clientX - rect.left + viewportEl.scrollLeft;
      const mouseY = event.clientY - rect.top + viewportEl.scrollTop;

      // Find which cell the mouse is over
      const cell = this.getCellAtPosition(mouseX, mouseY);
      if (cell) {
        this.fillEndRow = cell.row;
        this.fillEndCol = cell.col;
      }
    }
  }

  /**
   * Calculates which cell is at the given pixel position
   */
  private getCellAtPosition(x: number, y: number): CellAddress | null {
    if (!this.activeSheet) return null;

    // Calculate row (assumes fixed row height for now)
    const row = Math.floor(y / this.ROW_HEIGHT);

    // Calculate column (needs to account for variable widths)
    let col = 0;
    let currentX = 0;

    for (let c = 0; c < this.activeSheet.colCount; c++) {
      const colWidth = this.getColumnWidth(c);
      if (currentX + colWidth > x) {
        col = c;
        break;
      }
      currentX += colWidth;
      col = c + 1; // If we go past all columns, use the last one
    }

    // Clamp to valid range
    const clampedRow = Math.max(0, Math.min(row, this.activeSheet.rowCount - 1));
    const clampedCol = Math.max(0, Math.min(col, this.activeSheet.colCount - 1));

    return { row: clampedRow, col: clampedCol };
  }

  /**
   * Handles cell click (for compatibility and format painter)
   */
  onCellClick(event: MouseEvent, row: number, col: number): void {
    // Handle format painter
    if (this.formatPainterActive) {
      this.applyFormatPainterStyle(row, col);
    }
    // Most work is done in mousedown/mouseup
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

      // Check if Ctrl+Enter (or Cmd+Enter on Mac) - apply to all cells in range
      if (event.ctrlKey || event.metaKey) {
        this.commitEditToRange();
      } else {
        this.commitEdit();
        // Move to next row
        if (this.editingCell) {
          this.moveSelection(this.editingCell.row + 1, this.editingCell.col);
        }
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
   * Commits the current edit to all cells in the selected range
   * (Excel-like Ctrl+Enter behavior)
   */
  private commitEditToRange(): void {
    if (!this.editingCell) return;

    const newValue = this.editingValue;

    console.log('[DEBUG] commitEditToRange called, savedEditRange:', this.savedEditRange, 'newValue:', newValue);

    // If there's a saved range selection, apply to all cells in the range
    if (this.savedEditRange) {
      const minRow = Math.min(this.savedEditRange.start.row, this.savedEditRange.end.row);
      const maxRow = Math.max(this.savedEditRange.start.row, this.savedEditRange.end.row);
      const minCol = Math.min(this.savedEditRange.start.col, this.savedEditRange.end.col);
      const maxCol = Math.max(this.savedEditRange.start.col, this.savedEditRange.end.col);

      // Apply the value to all cells in the range
      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          const cell = this.dataService.getCell(row, col);
          if (cell && !cell.readonly) {
            const oldValue = cell.value;
            if (oldValue !== newValue) {
              this.dataService.updateCell(row, col, newValue);
              this.cellChange.emit({
                address: { row, col },
                oldValue,
                newValue,
              });
            }
          }
        }
      }
    } else {
      // No range selected, just commit to the single cell
      const cell = this.dataService.getCell(
        this.editingCell.row,
        this.editingCell.col
      );

      if (cell) {
        const oldValue = cell.value;
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
      }
    }

    // Clear saved range and edit state
    this.savedEditRange = null;
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
    if (this.selectedCell) {
      this.dataService.insertRow(this.selectedCell.row);
    }
    this.contextMenuVisible = false;
  }

  /**
   * Context menu: Insert Column
   */
  onContextMenuInsertColumn(): void {
    if (this.selectedCell) {
      this.dataService.insertColumn(this.selectedCell.col);
    }
    this.contextMenuVisible = false;
  }

  /**
   * Context menu: Delete Row
   */
  onContextMenuDeleteRow(): void {
    if (this.selectedCell) {
      this.dataService.deleteRow(this.selectedCell.row);
    }
    this.contextMenuVisible = false;
  }

  /**
   * Context menu: Delete Column
   */
  onContextMenuDeleteColumn(): void {
    if (this.selectedCell) {
      this.dataService.deleteColumn(this.selectedCell.col);
    }
    this.contextMenuVisible = false;
  }

  /**
   * Hides context menus when clicking outside
   */
  @HostListener('document:click')
  onDocumentClick(): void {
    this.contextMenuVisible = false;
    this.columnContextMenuVisible = false;
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

  // ========== RIBBON INTEGRATION METHODS ==========

  /**
   * Gets the current selected cell's or range's style
   */
  getCurrentCellStyle(): Partial<CellStyle> {
    // If single cell selected, return its style
    if (this.selectedCell) {
      const cell = this.dataService.getCell(this.selectedCell.row, this.selectedCell.col);
      return cell?.style || {};
    }

    // If range selected, return style from first cell in range
    const selectedRange = this.dataService.getSelectedRange();
    if (selectedRange) {
      const { start } = selectedRange;
      const cell = this.dataService.getCell(start.row, start.col);
      return cell?.style || {};
    }

    return {};
  }

  /**
   * Handles ribbon actions from the ribbon component
   */
  onRibbonAction(action: RibbonAction): void {
    switch (action.type) {
      case 'font':
      case 'format':
      case 'alignment':
        // Apply style to selected cell or range
        const hasSelection = this.selectedCell || this.dataService.getSelectedRange();
        if (hasSelection) {
          this.applyCellStyle(action.action, action.value);
        }
        break;
      case 'sort':
        this.sortData(action.action === 'ascending');
        break;
      case 'filter':
        this.toggleFilterRow();
        break;
      case 'search':
        this.searchCells(action.value);
        break;
      case 'merge':
        if (action.action === 'mergeAndCenter') {
          this.mergeAndCenterCells();
        }
        break;
      case 'border':
        if (this.selectedCell) {
          this.applyBorderStyle(action.action);
        }
        break;
      case 'formatPainter':
        this.handleFormatPainter(action.value);
        break;
      case 'clear':
        this.handleClear(action.action);
        break;
      case 'undo':
        this.dataService.undo();
        break;
      case 'redo':
        this.dataService.redo();
        break;
    }
  }

  /**
   * Applies a style property to the currently selected cell or range
   */
  private applyCellStyle(property: string, value: any): void {
    const selectedRange = this.dataService.getSelectedRange();

    // If there's a range selection, apply to all cells in range
    if (selectedRange) {
      const { start, end } = selectedRange;
      const minRow = Math.min(start.row, end.row);
      const maxRow = Math.max(start.row, end.row);
      const minCol = Math.min(start.col, end.col);
      const maxCol = Math.max(start.col, end.col);

      // Apply style to each cell in the range
      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          const cell = this.dataService.getCell(row, col);
          if (cell) {
            const currentStyle = cell.style || {};
            const newStyle = {
              ...currentStyle,
              [property]: value
            };
            this.dataService.updateCellStyle(row, col, newStyle);
          }
        }
      }
    }
    // Otherwise, apply to single selected cell
    else if (this.selectedCell) {
      const currentStyle = this.getCurrentCellStyle();
      const newStyle = {
        ...currentStyle,
        [property]: value
      };
      this.dataService.updateCellStyle(this.selectedCell.row, this.selectedCell.col, newStyle);
    }
  }

  /**
   * Sorts data based on the selected column
   */
  private sortData(ascending: boolean): void {
    if (!this.selectedCell) return;

    const col = this.selectedCell.col;
    const sheet = this.dataService.getActiveSheet();
    if (!sheet) return;

    // Get all rows (excluding header if first row)
    const dataRows = sheet.cells.slice(1);

    // Sort rows based on the selected column
    dataRows.sort((a, b) => {
      const aVal = a[col]?.displayValue || a[col]?.value || '';
      const bVal = b[col]?.displayValue || b[col]?.value || '';

      // Try to compare as numbers first
      const aNum = parseFloat(String(aVal));
      const bNum = parseFloat(String(bVal));

      if (!isNaN(aNum) && !isNaN(bNum)) {
        return ascending ? aNum - bNum : bNum - aNum;
      }

      // Compare as strings
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();

      if (ascending) {
        return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
      } else {
        return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
      }
    });

    // Reconstruct sheet with sorted data
    const newCells = [sheet.cells[0], ...dataRows];
    this.dataService.updateSheetCells(newCells);
  }

  /**
   * Toggles the filter row visibility (placeholder for now)
   */
  private toggleFilterRow(): void {
    // TODO: Implement filter functionality
  }

  /**
   * Searches for cells containing the specified text
   */
  private searchCells(searchText: string): void {
    const sheet = this.dataService.getActiveSheet();
    if (!sheet || !searchText) return;

    const lowerSearch = searchText.toLowerCase();

    // Find all cells matching the search
    for (let row = 0; row < sheet.cells.length; row++) {
      for (let col = 0; col < sheet.cells[row].length; col++) {
        const cell = sheet.cells[row][col];
        const cellText = String(cell.displayValue || cell.value || '').toLowerCase();

        if (cellText.includes(lowerSearch)) {
          // Select the first match
          this.dataService.selectCell({ row, col });
          return;
        }
      }
    }

    alert('No matches found');
  }

  /**
   * Gets the computed style for a cell
   */
  getCellStyle(row: number, col: number): any {
    const cell = this.dataService.getCell(row, col);
    const style = cell?.style || {};

    // Convert CellStyle properties to CSS style object
    const cssStyle: any = {};

    if (style.fontFamily) cssStyle['font-family'] = style.fontFamily;
    if (style.fontSize) cssStyle['font-size'] = style.fontSize;
    if (style.fontWeight) cssStyle['font-weight'] = style.fontWeight;
    if (style.fontStyle) cssStyle['font-style'] = style.fontStyle;
    if (style.textDecoration) cssStyle['text-decoration'] = style.textDecoration;
    if (style.color) cssStyle['color'] = style.color;
    if (style.backgroundColor) cssStyle['background-color'] = style.backgroundColor;
    if (style.textAlign) cssStyle['text-align'] = style.textAlign;
    if (style.verticalAlign) cssStyle['vertical-align'] = style.verticalAlign;
    if (style.whiteSpace) cssStyle['white-space'] = style.whiteSpace;
    if (style.padding) cssStyle['padding'] = style.padding;
    if (style.border) cssStyle['border'] = style.border;
    if (style.borderTop) cssStyle['border-top'] = style.borderTop;
    if (style.borderRight) cssStyle['border-right'] = style.borderRight;
    if (style.borderBottom) cssStyle['border-bottom'] = style.borderBottom;
    if (style.borderLeft) cssStyle['border-left'] = style.borderLeft;

    return cssStyle;
  }

  // ========== NEW FEATURE METHODS ==========

  /**
   * Merges and centers the selected range of cells
   */
  private mergeAndCenterCells(): void {
    if (!this.rangeStart || !this.rangeEnd) {
      alert('Please select a range of cells to merge');
      return;
    }

    const minRow = Math.min(this.rangeStart.row, this.rangeEnd.row);
    const maxRow = Math.max(this.rangeStart.row, this.rangeEnd.row);
    const minCol = Math.min(this.rangeStart.col, this.rangeEnd.col);
    const maxCol = Math.max(this.rangeStart.col, this.rangeEnd.col);

    const rowSpan = maxRow - minRow + 1;
    const colSpan = maxCol - minCol + 1;

    // Apply merge style to the top-left cell
    const currentStyle = this.getCurrentCellStyle();
    const newStyle = {
      ...currentStyle,
      rowSpan,
      colSpan,
      textAlign: 'center' as const,
    };

    this.dataService.updateCellStyle(minRow, minCol, newStyle);
  }

  /**
   * Applies border style to selected cell
   */
  private applyBorderStyle(type: string): void {
    if (!this.selectedCell) return;

    const currentStyle = this.getCurrentCellStyle();
    let newStyle: Partial<CellStyle> = { ...currentStyle };

    const borderValue = '1px solid #000';

    switch (type) {
      case 'all':
        newStyle.border = borderValue;
        break;
      case 'outline':
        newStyle.borderTop = borderValue;
        newStyle.borderRight = borderValue;
        newStyle.borderBottom = borderValue;
        newStyle.borderLeft = borderValue;
        break;
      case 'top':
        newStyle.borderTop = borderValue;
        break;
      case 'bottom':
        newStyle.borderBottom = borderValue;
        break;
      case 'left':
        newStyle.borderLeft = borderValue;
        break;
      case 'right':
        newStyle.borderRight = borderValue;
        break;
      case 'none':
        newStyle.border = 'none';
        newStyle.borderTop = 'none';
        newStyle.borderRight = 'none';
        newStyle.borderBottom = 'none';
        newStyle.borderLeft = 'none';
        break;
    }

    this.dataService.updateCellStyle(this.selectedCell.row, this.selectedCell.col, newStyle);
  }

  /**
   * Handles format painter toggle
   */
  private handleFormatPainter(active: boolean): void {
    this.formatPainterActive = active;

    if (active && this.selectedCell) {
      // Copy the current cell's style
      const cell = this.dataService.getCell(this.selectedCell.row, this.selectedCell.col);
      this.copiedCellStyle = cell?.style || null;
    } else {
      this.copiedCellStyle = null;
    }
  }

  /**
   * Handles cell click when format painter is active
   */
  private applyFormatPainterStyle(row: number, col: number): void {
    if (this.formatPainterActive && this.copiedCellStyle) {
      this.dataService.updateCellStyle(row, col, this.copiedCellStyle);
      // Deactivate format painter after one use
      this.formatPainterActive = false;
      this.copiedCellStyle = null;
    }
  }

  /**
   * Handles clear operations
   */
  private handleClear(action: string): void {
    if (!this.selectedCell) return;

    const sheet = this.dataService.getActiveSheet();
    if (!sheet) return;

    // Determine the range to clear
    let minRow = this.selectedCell.row;
    let maxRow = this.selectedCell.row;
    let minCol = this.selectedCell.col;
    let maxCol = this.selectedCell.col;

    if (this.rangeStart && this.rangeEnd) {
      minRow = Math.min(this.rangeStart.row, this.rangeEnd.row);
      maxRow = Math.max(this.rangeStart.row, this.rangeEnd.row);
      minCol = Math.min(this.rangeStart.col, this.rangeEnd.col);
      maxCol = Math.max(this.rangeStart.col, this.rangeEnd.col);
    }

    // Clear cells in the range
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        switch (action) {
          case 'all':
            this.dataService.updateCell(row, col, '');
            this.dataService.updateCellStyle(row, col, {});
            break;
          case 'contents':
            this.dataService.updateCell(row, col, '');
            break;
          case 'formats':
            this.dataService.updateCellStyle(row, col, {});
            break;
        }
      }
    }
  }

  /**
   * Handles paste special operations
   */
  onContextMenuPasteSpecial(type: 'values' | 'formats' | 'formulas'): void {
    this.contextMenuVisible = false;
    this.showPasteSpecialMenu = false;

    // Get clipboard data
    navigator.clipboard.readText().then(text => {
      if (!text || !this.selectedCell) return;

      const sheet = this.dataService.getActiveSheet();
      if (!sheet) return;

      // Parse TSV data
      const rows = text.split('\n').filter(line => line.trim());
      const data = rows.map(row => row.split('\t'));

      // Paste starting from selected cell
      for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].length; j++) {
          const targetRow = this.selectedCell.row + i;
          const targetCol = this.selectedCell.col + j;

          if (targetRow < sheet.rowCount && targetCol < sheet.colCount) {
            if (type === 'values') {
              // Paste values only (no formulas)
              const value = data[i][j];
              const processedValue = value.startsWith('=') ? value.substring(1) : value;
              this.dataService.updateCell(targetRow, targetCol, processedValue);
            } else if (type === 'formulas') {
              // Paste formulas only
              this.dataService.updateCell(targetRow, targetCol, data[i][j]);
            } else if (type === 'formats') {
              // Paste formats only - would need to copy cell styles
              // TODO: Implement full paste formats functionality
            }
          }
        }
      }
    }).catch(err => {
      console.error('Failed to read clipboard:', err);
    });
  }

  /**
   * Handles column header context menu
   */
  /**
   * Handles column header click to select entire column
   */
  onColumnHeaderClick(event: MouseEvent, col: number): void {
    // Don't select if clicking on the resizer
    const target = event.target as HTMLElement;
    if (target.classList.contains('column-resizer')) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const sheet = this.dataService.getActiveSheet();
    if (!sheet) return;

    // Select entire column (from row 0 to last row)
    const range: CellRange = {
      start: { row: 0, col },
      end: { row: sheet.rowCount - 1, col }
    };

    this.dataService.selectRange(range);
  }

  /**
   * Handles row header click to select entire row
   */
  onRowHeaderClick(event: MouseEvent, row: number): void {
    // Don't select if clicking on the resizer
    const target = event.target as HTMLElement;
    if (target.classList.contains('row-resizer')) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const sheet = this.dataService.getActiveSheet();
    if (!sheet) return;

    // Select entire row (from col 0 to last col)
    const range: CellRange = {
      start: { row, col: 0 },
      end: { row, col: sheet.colCount - 1 }
    };

    this.dataService.selectRange(range);
  }

  onColumnHeaderContextMenu(event: MouseEvent, col: number): void {
    event.preventDefault();
    event.stopPropagation();

    this.columnContextMenuX = event.clientX;
    this.columnContextMenuY = event.clientY;
    this.contextMenuColumnIndex = col;
    this.columnContextMenuVisible = true;

    // Hide cell context menu
    this.contextMenuVisible = false;
  }

  /**
   * Handles column resizer double-click to auto-fit
   */
  onColumnResizerDoubleClick(event: MouseEvent, col: number): void {
    event.preventDefault();
    event.stopPropagation();
    this.autoFitColumn(col);
  }

  /**
   * Auto-fits column width to content
   */
  private autoFitColumn(col: number): void {
    const sheet = this.dataService.getActiveSheet();
    if (!sheet) return;

    let maxWidth = 50; // Minimum width

    // Measure content width for all cells in the column
    for (let row = 0; row < sheet.rowCount; row++) {
      const cell = this.dataService.getCell(row, col);
      if (cell && cell.displayValue) {
        // Rough estimate: 8px per character + 16px padding
        const contentWidth = cell.displayValue.length * 8 + 16;
        maxWidth = Math.max(maxWidth, contentWidth);
      }
    }

    // Cap at a reasonable maximum
    maxWidth = Math.min(maxWidth, 400);

    this.dataService.setColumnWidth(col, maxWidth);
  }

  /**
   * Context menu: AutoFit column
   */
  onColumnContextMenuAutoFit(): void {
    if (this.contextMenuColumnIndex >= 0) {
      this.autoFitColumn(this.contextMenuColumnIndex);
    }
    this.columnContextMenuVisible = false;
  }

  /**
   * Context menu: Insert column
   */
  onColumnContextMenuInsert(): void {
    if (this.contextMenuColumnIndex >= 0) {
      this.dataService.insertColumn(this.contextMenuColumnIndex);
    }
    this.columnContextMenuVisible = false;
  }

  /**
   * Context menu: Delete column
   */
  onColumnContextMenuDelete(): void {
    if (this.contextMenuColumnIndex >= 0) {
      this.dataService.deleteColumn(this.contextMenuColumnIndex);
    }
    this.columnContextMenuVisible = false;
  }

}
