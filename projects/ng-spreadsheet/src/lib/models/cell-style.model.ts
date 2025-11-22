/**
 * Represents the styling properties that can be applied to a spreadsheet cell.
 * Supports basic Excel-like formatting options for visual appearance.
 */
export interface CellStyle {
  /** Background color (e.g., '#FFFFFF', 'red', 'rgb(255,255,255)') */
  backgroundColor?: string;

  /** Text color (e.g., '#000000', 'blue', 'rgb(0,0,0)') */
  color?: string;

  /** Font weight (e.g., 'normal', 'bold', '700') */
  fontWeight?: string;

  /** Font style (e.g., 'normal', 'italic', 'oblique') */
  fontStyle?: string;

  /** Font size in pixels (e.g., '12px', '14px') */
  fontSize?: string;

  /** Font family (e.g., 'Arial', 'Helvetica', 'sans-serif') */
  fontFamily?: string;

  /** Text alignment horizontal (e.g., 'left', 'center', 'right') */
  textAlign?: 'left' | 'center' | 'right';

  /** Text alignment vertical (e.g., 'top', 'middle', 'bottom') */
  verticalAlign?: 'top' | 'middle' | 'bottom';

  /** Text decoration (e.g., 'none', 'underline', 'line-through') */
  textDecoration?: string;

  /** Border style (e.g., '1px solid #000') */
  border?: string;

  /** Individual border sides */
  borderTop?: string;
  borderRight?: string;
  borderBottom?: string;
  borderLeft?: string;

  /** Padding inside the cell */
  padding?: string;

  /** Word wrap (white-space CSS property) */
  whiteSpace?: 'normal' | 'nowrap' | 'pre' | 'pre-wrap' | 'pre-line';

  /** Number format type (e.g., 'general', 'number', 'currency', 'percentage', 'date', 'time', 'accounting') */
  numberFormat?: string;

  /** Number format pattern (e.g., '#,##0.00', '$#,##0.00', '0.00%') */
  numberFormatPattern?: string;

  /** Currency symbol for currency format */
  currencySymbol?: string;

  /** Number of decimal places */
  decimalPlaces?: number;

  /** Column span for merged cells (number of columns to span) */
  colSpan?: number;

  /** Row span for merged cells (number of rows to span) */
  rowSpan?: number;
}

/**
 * Default cell style applied to all cells if no custom style is specified
 */
export const DEFAULT_CELL_STYLE: CellStyle = {
  backgroundColor: '#ffffff',
  color: '#000000',
  fontWeight: 'normal',
  fontStyle: 'normal',
  fontSize: '12px',
  fontFamily: 'Arial, sans-serif',
  textAlign: 'left',
  verticalAlign: 'middle',
  textDecoration: 'none',
  border: '1px solid #d0d0d0',
  padding: '4px',
  whiteSpace: 'nowrap',
  numberFormat: 'general',
};
