import { CellStyle } from './cell-style.model';

/**
 * Represents a single cell in the spreadsheet.
 * Contains both the display value and the underlying raw value/formula.
 */
export interface Cell {
  /** Row index (0-based) */
  row: number;

  /** Column index (0-based) */
  col: number;

  /** The raw value or formula stored in the cell (e.g., '=SUM(A1:A10)', '42', 'Hello') */
  value: any;

  /** The computed/display value shown to the user (result of formula evaluation) */
  displayValue?: string;

  /** Cell styling properties */
  style?: CellStyle;

  /** Whether this cell is currently being edited */
  isEditing?: boolean;

  /** Whether this cell is currently selected */
  isSelected?: boolean;

  /** Whether this cell is part of a range selection */
  isInRange?: boolean;

  /** Whether this cell is readonly (cannot be edited) */
  readonly?: boolean;

  /** Data type of the cell value */
  dataType?: 'string' | 'number' | 'boolean' | 'date' | 'formula' | 'error';

  /** Error message if cell contains an error (e.g., '#REF!', '#DIV/0!') */
  error?: string;
}

/**
 * Represents a cell address in A1 notation (e.g., 'A1', 'B5', 'AA10')
 */
export interface CellAddress {
  /** Row index (0-based) */
  row: number;

  /** Column index (0-based) */
  col: number;

  /** Whether the row is absolute (e.g., $A$1) */
  absoluteRow?: boolean;

  /** Whether the column is absolute (e.g., $A$1) */
  absoluteCol?: boolean;
}

/**
 * Represents a range of cells (e.g., A1:B10)
 */
export interface CellRange {
  /** Starting cell address */
  start: CellAddress;

  /** Ending cell address */
  end: CellAddress;

  /** Sheet name (for cross-sheet references like Sheet1!A1:B10) */
  sheet?: string;
}

/**
 * Creates an empty cell with default values
 */
export function createEmptyCell(row: number, col: number): Cell {
  return {
    row,
    col,
    value: '',
    displayValue: '',
    dataType: 'string',
    readonly: false,
  };
}

/**
 * Converts column index to Excel-style column letter (0 -> A, 25 -> Z, 26 -> AA)
 */
export function colIndexToLetter(colIndex: number): string {
  let letter = '';
  let temp = colIndex;

  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }

  return letter;
}

/**
 * Converts Excel-style column letter to column index (A -> 0, Z -> 25, AA -> 26)
 */
export function colLetterToIndex(colLetter: string): number {
  let index = 0;
  for (let i = 0; i < colLetter.length; i++) {
    index = index * 26 + (colLetter.charCodeAt(i) - 64);
  }
  return index - 1;
}

/**
 * Converts cell address to A1 notation (e.g., {row: 0, col: 0} -> 'A1')
 */
export function cellAddressToA1(address: CellAddress): string {
  const colPart = address.absoluteCol
    ? '$' + colIndexToLetter(address.col)
    : colIndexToLetter(address.col);
  const rowPart = address.absoluteRow
    ? '$' + (address.row + 1)
    : address.row + 1;
  return colPart + rowPart;
}

/**
 * Parses A1 notation to cell address (e.g., 'A1' -> {row: 0, col: 0})
 */
export function a1ToCellAddress(a1: string): CellAddress {
  const match = a1.match(/^(\$?)([A-Z]+)(\$?)(\d+)$/);
  if (!match) {
    throw new Error(`Invalid A1 notation: ${a1}`);
  }

  return {
    absoluteCol: match[1] === '$',
    col: colLetterToIndex(match[2]),
    absoluteRow: match[3] === '$',
    row: parseInt(match[4], 10) - 1,
  };
}
