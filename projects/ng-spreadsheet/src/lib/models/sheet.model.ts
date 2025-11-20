import { Cell } from './cell.model';

/**
 * Represents a single spreadsheet sheet/tab.
 * Contains a 2D grid of cells and sheet-level configuration.
 */
export interface Sheet {
  /** Unique identifier for the sheet */
  id: string;

  /** Display name of the sheet (shown in tab) */
  name: string;

  /** 2D array of cells [row][col] */
  cells: Cell[][];

  /** Number of rows in the sheet */
  rowCount: number;

  /** Number of columns in the sheet */
  colCount: number;

  /** Array of column widths in pixels (default: 100px) */
  columnWidths?: number[];

  /** Array of row heights in pixels (default: 25px) */
  rowHeights?: number[];

  /** Whether this sheet is currently active/visible */
  isActive?: boolean;

  /** Whether this sheet is hidden */
  isHidden?: boolean;

  /** Default column width for columns without explicit width */
  defaultColumnWidth?: number;

  /** Default row height for rows without explicit height */
  defaultRowHeight?: number;
}

/**
 * Represents the entire spreadsheet document with multiple sheets
 */
export interface SpreadsheetData {
  /** Array of sheets in the spreadsheet */
  sheets: Sheet[];

  /** Index of the currently active sheet */
  activeSheetIndex: number;

  /** Metadata about the spreadsheet */
  metadata?: {
    title?: string;
    author?: string;
    createdDate?: Date;
    modifiedDate?: Date;
  };
}

/**
 * Configuration options for creating a new sheet
 */
export interface SheetConfig {
  /** Sheet name (default: 'Sheet1') */
  name?: string;

  /** Number of rows (default: 1000) */
  rowCount?: number;

  /** Number of columns (default: 26) */
  colCount?: number;

  /** Default column width in pixels (default: 100) */
  defaultColumnWidth?: number;

  /** Default row height in pixels (default: 25) */
  defaultRowHeight?: number;

  /** Initial data to populate the sheet */
  data?: any[][];
}

/**
 * Creates a new empty sheet with the specified configuration
 */
export function createEmptySheet(config: SheetConfig = {}): Sheet {
  const {
    name = 'Sheet1',
    rowCount = 1000,
    colCount = 26,
    defaultColumnWidth = 100,
    defaultRowHeight = 25,
    data = [],
  } = config;

  // Initialize empty 2D array
  const cells: Cell[][] = [];
  for (let row = 0; row < rowCount; row++) {
    cells[row] = [];
    for (let col = 0; col < colCount; col++) {
      const value = data[row]?.[col] ?? '';
      cells[row][col] = {
        row,
        col,
        value,
        displayValue: String(value),
        dataType: typeof value === 'number' ? 'number' : 'string',
      };
    }
  }

  return {
    id: generateSheetId(),
    name,
    cells,
    rowCount,
    colCount,
    columnWidths: Array(colCount).fill(defaultColumnWidth),
    rowHeights: Array(rowCount).fill(defaultRowHeight),
    defaultColumnWidth,
    defaultRowHeight,
    isActive: false,
  };
}

/**
 * Generates a unique sheet ID
 */
function generateSheetId(): string {
  return `sheet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Creates a default spreadsheet with one empty sheet
 */
export function createDefaultSpreadsheet(): SpreadsheetData {
  const sheet = createEmptySheet({ name: 'Sheet1' });
  sheet.isActive = true;

  return {
    sheets: [sheet],
    activeSheetIndex: 0,
    metadata: {
      createdDate: new Date(),
      modifiedDate: new Date(),
    },
  };
}
