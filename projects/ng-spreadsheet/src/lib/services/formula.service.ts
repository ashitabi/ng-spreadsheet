import { Injectable } from '@angular/core';
import { Cell, a1ToCellAddress } from '../models';

/**
 * Service for evaluating spreadsheet formulas.
 * Handles basic arithmetic operations and simple functions.
 */
@Injectable({
  providedIn: 'root',
})
export class FormulaService {
  /**
   * Evaluates a formula and returns the calculated value
   */
  evaluateFormula(
    formula: string,
    cells: Cell[][],
    currentRow: number,
    currentCol: number
  ): string | number {
    try {
      // Remove the = sign
      const expression = formula.trim().substring(1);
      const upperExpr = expression.toUpperCase();

      // Mathematical & Statistical Functions
      if (upperExpr.startsWith('SUM(')) {
        return this.evaluateSum(expression, cells);
      } else if (upperExpr.startsWith('AVERAGE(')) {
        return this.evaluateAverage(expression, cells);
      } else if (upperExpr.startsWith('COUNT(')) {
        return this.evaluateCount(expression, cells);
      } else if (upperExpr.startsWith('COUNTA(')) {
        return this.evaluateCountA(expression, cells);
      } else if (upperExpr.startsWith('COUNTBLANK(')) {
        return this.evaluateCountBlank(expression, cells);
      } else if (upperExpr.startsWith('MIN(')) {
        return this.evaluateMin(expression, cells);
      } else if (upperExpr.startsWith('MAX(')) {
        return this.evaluateMax(expression, cells);
      } else if (upperExpr.startsWith('MEDIAN(')) {
        return this.evaluateMedian(expression, cells);
      } else if (upperExpr.startsWith('MODE(')) {
        return this.evaluateMode(expression, cells);
      } else if (upperExpr.startsWith('PRODUCT(')) {
        return this.evaluateProduct(expression, cells);
      } else if (upperExpr.startsWith('STDEV(')) {
        return this.evaluateStdev(expression, cells);
      } else if (upperExpr.startsWith('VAR(')) {
        return this.evaluateVar(expression, cells);
      } else if (upperExpr.startsWith('CORREL(')) {
        return this.evaluateCorrel(expression, cells);
      } else if (upperExpr.startsWith('PERCENTILE(')) {
        return this.evaluatePercentile(expression, cells);
      } else if (upperExpr.startsWith('QUARTILE(')) {
        return this.evaluateQuartile(expression, cells);
      } else if (upperExpr.startsWith('RANK(')) {
        return this.evaluateRank(expression, cells);
      }
      // Logical Functions
      else if (upperExpr.startsWith('IF(')) {
        return this.evaluateIf(expression, cells, currentRow, currentCol);
      } else if (upperExpr.startsWith('IFS(')) {
        return this.evaluateIfs(expression, cells, currentRow, currentCol);
      } else if (upperExpr.startsWith('IFERROR(')) {
        return this.evaluateIfError(expression, cells, currentRow, currentCol);
      } else if (upperExpr.startsWith('IFNA(')) {
        return this.evaluateIfNa(expression, cells, currentRow, currentCol);
      } else if (upperExpr.startsWith('AND(')) {
        return this.evaluateAnd(expression, cells, currentRow, currentCol) ? 1 : 0;
      } else if (upperExpr.startsWith('OR(')) {
        return this.evaluateOr(expression, cells, currentRow, currentCol) ? 1 : 0;
      } else if (upperExpr.startsWith('NOT(')) {
        return this.evaluateNot(expression, cells, currentRow, currentCol) ? 1 : 0;
      }
      // Lookup Functions
      else if (upperExpr.startsWith('VLOOKUP(')) {
        return this.evaluateVlookup(expression, cells, currentRow, currentCol);
      }

      // Replace cell references with their values
      const evaluatedExpression = this.replaceCellReferences(
        expression,
        cells,
        currentRow,
        currentCol
      );

      // Evaluate the expression
      const result = this.safeEval(evaluatedExpression);

      return result;
    } catch (error) {
      return '#ERROR!';
    }
  }

  /**
   * Replaces cell references (e.g., A1, B2) with their actual values
   */
  private replaceCellReferences(
    expression: string,
    cells: Cell[][],
    currentRow: number,
    currentCol: number
  ): string {
    // Match cell references like A1, B2, $A$1, etc.
    const cellRefRegex = /\$?([A-Z]+)\$?(\d+)/g;

    return expression.replace(cellRefRegex, (match, colLetter, rowNum) => {
      try {
        const address = a1ToCellAddress(match);
        const cell = cells[address.row]?.[address.col];

        if (!cell) {
          return '0';
        }

        // If the cell contains a formula, evaluate it recursively
        if (
          typeof cell.value === 'string' &&
          cell.value.startsWith('=')
        ) {
          // Prevent circular references
          if (address.row === currentRow && address.col === currentCol) {
            throw new Error('Circular reference');
          }

          const result = this.evaluateFormula(
            cell.value,
            cells,
            address.row,
            address.col
          );
          return String(result);
        }

        // Return the cell value
        const value = cell.value ?? 0;
        return typeof value === 'number' ? String(value) : `"${value}"`;
      } catch {
        return '0';
      }
    });
  }

  /**
   * Safely evaluates a mathematical expression
   */
  private safeEval(expression: string): number {
    try {
      // Remove any non-mathematical characters for safety
      const sanitized = expression.replace(/[^0-9+\-*/().]/g, '');

      // Use Function constructor for safer evaluation than eval()
      const result = new Function(`return ${sanitized}`)();

      if (typeof result !== 'number' || isNaN(result)) {
        return 0;
      }

      return result;
    } catch {
      throw new Error('Invalid expression');
    }
  }

  /**
   * Evaluates SUM function (e.g., SUM(A1:A10))
   */
  private evaluateSum(expression: string, cells: Cell[][]): number {
    const range = this.extractRange(expression);
    const values = this.getRangeValues(range, cells);
    return values.reduce((sum, val) => sum + val, 0);
  }

  /**
   * Evaluates AVERAGE function
   */
  private evaluateAverage(expression: string, cells: Cell[][]): number {
    const range = this.extractRange(expression);
    const values = this.getRangeValues(range, cells);
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Evaluates COUNT function
   */
  private evaluateCount(expression: string, cells: Cell[][]): number {
    const range = this.extractRange(expression);
    const values = this.getRangeValues(range, cells);
    return values.length;
  }

  /**
   * Evaluates MIN function
   */
  private evaluateMin(expression: string, cells: Cell[][]): number {
    const range = this.extractRange(expression);
    const values = this.getRangeValues(range, cells);
    if (values.length === 0) return 0;
    return Math.min(...values);
  }

  /**
   * Evaluates MAX function
   */
  private evaluateMax(expression: string, cells: Cell[][]): number {
    const range = this.extractRange(expression);
    const values = this.getRangeValues(range, cells);
    if (values.length === 0) return 0;
    return Math.max(...values);
  }

  /**
   * Extracts range from function expression (e.g., "SUM(A1:A10)" -> "A1:A10")
   */
  private extractRange(expression: string): string {
    const match = expression.match(/\(([^)]+)\)/);
    return match ? match[1] : '';
  }

  /**
   * Gets all numeric values from a range (e.g., A1:B10)
   */
  private getRangeValues(range: string, cells: Cell[][]): number[] {
    const values: number[] = [];

    try {
      const [start, end] = range.split(':');
      const startAddr = a1ToCellAddress(start.trim());
      const endAddr = a1ToCellAddress(end.trim());

      const minRow = Math.min(startAddr.row, endAddr.row);
      const maxRow = Math.max(startAddr.row, endAddr.row);
      const minCol = Math.min(startAddr.col, endAddr.col);
      const maxCol = Math.max(startAddr.col, endAddr.col);

      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          const cell = cells[row]?.[col];
          if (cell) {
            const value = this.getCellNumericValue(cell, cells);
            if (!isNaN(value)) {
              values.push(value);
            }
          }
        }
      }
    } catch {
      // Invalid range
    }

    return values;
  }

  /**
   * Gets the numeric value of a cell, evaluating formulas if necessary
   */
  private getCellNumericValue(cell: Cell, cells: Cell[][]): number {
    if (typeof cell.value === 'number') {
      return cell.value;
    }

    if (typeof cell.value === 'string') {
      // If it's a formula, evaluate it
      if (cell.value.startsWith('=')) {
        const result = this.evaluateFormula(
          cell.value,
          cells,
          cell.row,
          cell.col
        );
        return typeof result === 'number' ? result : parseFloat(String(result)) || 0;
      }

      // Try to parse as number
      const num = parseFloat(cell.value);
      return isNaN(num) ? 0 : num;
    }

    return 0;
  }

  // ========== NEW STATISTICAL FUNCTIONS ==========

  /**
   * Evaluates COUNTA function - counts non-empty cells
   */
  private evaluateCountA(expression: string, cells: Cell[][]): number {
    const range = this.extractRange(expression);
    const allCells = this.getRangeCells(range, cells);
    return allCells.filter(cell => cell.value !== null && cell.value !== undefined && cell.value !== '').length;
  }

  /**
   * Evaluates COUNTBLANK function - counts empty cells
   */
  private evaluateCountBlank(expression: string, cells: Cell[][]): number {
    const range = this.extractRange(expression);
    const allCells = this.getRangeCells(range, cells);
    return allCells.filter(cell => !cell.value || cell.value === '').length;
  }

  /**
   * Evaluates MEDIAN function - finds middle value
   */
  private evaluateMedian(expression: string, cells: Cell[][]): number {
    const range = this.extractRange(expression);
    const values = this.getRangeValues(range, cells).sort((a, b) => a - b);
    if (values.length === 0) return 0;
    const mid = Math.floor(values.length / 2);
    return values.length % 2 === 0 ? (values[mid - 1] + values[mid]) / 2 : values[mid];
  }

  /**
   * Evaluates MODE function - finds most frequent value
   */
  private evaluateMode(expression: string, cells: Cell[][]): number {
    const range = this.extractRange(expression);
    const values = this.getRangeValues(range, cells);
    if (values.length === 0) return 0;

    const frequency: { [key: number]: number } = {};
    let maxFreq = 0;
    let mode = values[0];

    values.forEach(val => {
      frequency[val] = (frequency[val] || 0) + 1;
      if (frequency[val] > maxFreq) {
        maxFreq = frequency[val];
        mode = val;
      }
    });

    return mode;
  }

  /**
   * Evaluates PRODUCT function - multiplies numbers
   */
  private evaluateProduct(expression: string, cells: Cell[][]): number {
    const range = this.extractRange(expression);
    const values = this.getRangeValues(range, cells);
    if (values.length === 0) return 0;
    return values.reduce((product, val) => product * val, 1);
  }

  /**
   * Evaluates STDEV function - standard deviation (sample)
   */
  private evaluateStdev(expression: string, cells: Cell[][]): number {
    const range = this.extractRange(expression);
    const values = this.getRangeValues(range, cells);
    if (values.length < 2) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / (values.length - 1);
    return Math.sqrt(variance);
  }

  /**
   * Evaluates VAR function - variance (sample)
   */
  private evaluateVar(expression: string, cells: Cell[][]): number {
    const range = this.extractRange(expression);
    const values = this.getRangeValues(range, cells);
    if (values.length < 2) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / (values.length - 1);
  }

  /**
   * Evaluates CORREL function - correlation coefficient
   */
  private evaluateCorrel(expression: string, cells: Cell[][]): number {
    const args = this.extractMultipleArgs(expression);
    if (args.length !== 2) return 0;

    const values1 = this.getRangeValues(args[0], cells);
    const values2 = this.getRangeValues(args[1], cells);

    if (values1.length !== values2.length || values1.length === 0) return 0;

    const mean1 = values1.reduce((sum, val) => sum + val, 0) / values1.length;
    const mean2 = values2.reduce((sum, val) => sum + val, 0) / values2.length;

    let numerator = 0;
    let sumSq1 = 0;
    let sumSq2 = 0;

    for (let i = 0; i < values1.length; i++) {
      const diff1 = values1[i] - mean1;
      const diff2 = values2[i] - mean2;
      numerator += diff1 * diff2;
      sumSq1 += diff1 * diff1;
      sumSq2 += diff2 * diff2;
    }

    const denominator = Math.sqrt(sumSq1 * sumSq2);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Evaluates PERCENTILE function - kth percentile
   */
  private evaluatePercentile(expression: string, cells: Cell[][]): number {
    const args = this.extractMultipleArgs(expression);
    if (args.length !== 2) return 0;

    const values = this.getRangeValues(args[0], cells).sort((a, b) => a - b);
    const k = parseFloat(args[1]);

    if (values.length === 0 || k < 0 || k > 1) return 0;

    const index = k * (values.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    return values[lower] * (1 - weight) + values[upper] * weight;
  }

  /**
   * Evaluates QUARTILE function - quartile values
   */
  private evaluateQuartile(expression: string, cells: Cell[][]): number {
    const args = this.extractMultipleArgs(expression);
    if (args.length !== 2) return 0;

    const values = this.getRangeValues(args[0], cells).sort((a, b) => a - b);
    const quart = parseInt(args[1]);

    if (values.length === 0 || quart < 0 || quart > 4) return 0;

    const percentiles = [0, 0.25, 0.5, 0.75, 1];
    const k = percentiles[quart];
    const index = k * (values.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    return values[lower] * (1 - weight) + values[upper] * weight;
  }

  /**
   * Evaluates RANK function - ranks a number in a list
   */
  private evaluateRank(expression: string, cells: Cell[][]): number {
    const args = this.extractMultipleArgs(expression);
    if (args.length < 2) return 0;

    const number = parseFloat(args[0]);
    const values = this.getRangeValues(args[1], cells);
    const order = args.length > 2 ? parseInt(args[2]) : 0; // 0 = descending, 1 = ascending

    if (isNaN(number)) return 0;

    const sorted = order === 0
      ? [...values].sort((a, b) => b - a)  // Descending
      : [...values].sort((a, b) => a - b); // Ascending

    const rank = sorted.indexOf(number) + 1;
    return rank === 0 ? values.length + 1 : rank;
  }

  // ========== LOGICAL FUNCTIONS ==========

  /**
   * Evaluates IF function - conditional logic
   */
  private evaluateIf(expression: string, cells: Cell[][], currentRow: number, currentCol: number): string | number {
    const args = this.extractMultipleArgs(expression);
    if (args.length < 2) return '#ERROR!';

    const condition = this.evaluateCondition(args[0], cells, currentRow, currentCol);

    if (condition) {
      return this.evaluateExpression(args[1], cells, currentRow, currentCol);
    } else {
      return args.length > 2 ? this.evaluateExpression(args[2], cells, currentRow, currentCol) : '';
    }
  }

  /**
   * Evaluates IFS function - multiple conditions
   */
  private evaluateIfs(expression: string, cells: Cell[][], currentRow: number, currentCol: number): string | number {
    const args = this.extractMultipleArgs(expression);
    if (args.length < 2 || args.length % 2 !== 0) return '#ERROR!';

    for (let i = 0; i < args.length; i += 2) {
      const condition = this.evaluateCondition(args[i], cells, currentRow, currentCol);
      if (condition) {
        return this.evaluateExpression(args[i + 1], cells, currentRow, currentCol);
      }
    }

    return '#N/A';
  }

  /**
   * Evaluates IFERROR function - error handling
   */
  private evaluateIfError(expression: string, cells: Cell[][], currentRow: number, currentCol: number): string | number {
    const args = this.extractMultipleArgs(expression);
    if (args.length < 2) return '#ERROR!';

    try {
      const result = this.evaluateExpression(args[0], cells, currentRow, currentCol);
      if (String(result).startsWith('#')) {
        return this.evaluateExpression(args[1], cells, currentRow, currentCol);
      }
      return result;
    } catch {
      return this.evaluateExpression(args[1], cells, currentRow, currentCol);
    }
  }

  /**
   * Evaluates IFNA function - handles #N/A errors
   */
  private evaluateIfNa(expression: string, cells: Cell[][], currentRow: number, currentCol: number): string | number {
    const args = this.extractMultipleArgs(expression);
    if (args.length < 2) return '#ERROR!';

    const result = this.evaluateExpression(args[0], cells, currentRow, currentCol);
    if (result === '#N/A') {
      return this.evaluateExpression(args[1], cells, currentRow, currentCol);
    }
    return result;
  }

  /**
   * Evaluates AND function - all conditions must be true
   */
  private evaluateAnd(expression: string, cells: Cell[][], currentRow: number, currentCol: number): boolean {
    const args = this.extractMultipleArgs(expression);
    if (args.length === 0) return true;

    return args.every(arg => this.evaluateCondition(arg, cells, currentRow, currentCol));
  }

  /**
   * Evaluates OR function - any condition must be true
   */
  private evaluateOr(expression: string, cells: Cell[][], currentRow: number, currentCol: number): boolean {
    const args = this.extractMultipleArgs(expression);
    if (args.length === 0) return false;

    return args.some(arg => this.evaluateCondition(arg, cells, currentRow, currentCol));
  }

  /**
   * Evaluates NOT function - reverses logic
   */
  private evaluateNot(expression: string, cells: Cell[][], currentRow: number, currentCol: number): boolean {
    const args = this.extractMultipleArgs(expression);
    if (args.length !== 1) return false;

    return !this.evaluateCondition(args[0], cells, currentRow, currentCol);
  }

  // ========== HELPER FUNCTIONS ==========

  /**
   * Gets all cells from a range (not just numeric values)
   */
  private getRangeCells(range: string, cells: Cell[][]): Cell[] {
    const result: Cell[] = [];

    try {
      const [start, end] = range.split(':');
      const startAddr = a1ToCellAddress(start.trim());
      const endAddr = a1ToCellAddress(end.trim());

      const minRow = Math.min(startAddr.row, endAddr.row);
      const maxRow = Math.max(startAddr.row, endAddr.row);
      const minCol = Math.min(startAddr.col, endAddr.col);
      const maxCol = Math.max(startAddr.col, endAddr.col);

      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          const cell = cells[row]?.[col];
          if (cell) {
            result.push(cell);
          }
        }
      }
    } catch {
      // Invalid range
    }

    return result;
  }

  /**
   * Extracts multiple arguments from a function expression
   */
  private extractMultipleArgs(expression: string): string[] {
    const match = expression.match(/\((.+)\)/);
    if (!match) return [];

    const argsStr = match[1];
    const args: string[] = [];
    let currentArg = '';
    let parenDepth = 0;
    let inQuotes = false;

    for (let i = 0; i < argsStr.length; i++) {
      const char = argsStr[i];

      if (char === '"') {
        inQuotes = !inQuotes;
        currentArg += char;
      } else if (char === '(' && !inQuotes) {
        parenDepth++;
        currentArg += char;
      } else if (char === ')' && !inQuotes) {
        parenDepth--;
        currentArg += char;
      } else if (char === ',' && parenDepth === 0 && !inQuotes) {
        args.push(currentArg.trim());
        currentArg = '';
      } else {
        currentArg += char;
      }
    }

    if (currentArg) {
      args.push(currentArg.trim());
    }

    return args;
  }

  /**
   * Evaluates a condition expression (for IF, AND, OR, etc.)
   */
  private evaluateCondition(condition: string, cells: Cell[][], currentRow: number, currentCol: number): boolean {
    try {
      // Replace cell references
      const evaluated = this.replaceCellReferences(condition, cells, currentRow, currentCol);

      // Handle comparison operators
      if (evaluated.includes('>=')) {
        const [left, right] = evaluated.split('>=').map(s => parseFloat(s.trim()));
        return left >= right;
      } else if (evaluated.includes('<=')) {
        const [left, right] = evaluated.split('<=').map(s => parseFloat(s.trim()));
        return left <= right;
      } else if (evaluated.includes('<>')) {
        const [left, right] = evaluated.split('<>').map(s => s.trim().replace(/"/g, ''));
        return left !== right;
      } else if (evaluated.includes('>')) {
        const [left, right] = evaluated.split('>').map(s => parseFloat(s.trim()));
        return left > right;
      } else if (evaluated.includes('<')) {
        const [left, right] = evaluated.split('<').map(s => parseFloat(s.trim()));
        return left < right;
      } else if (evaluated.includes('=')) {
        const [left, right] = evaluated.split('=').map(s => s.trim().replace(/"/g, ''));
        return left === right;
      }

      // Try to parse as boolean or number
      const num = parseFloat(evaluated);
      return !isNaN(num) && num !== 0;
    } catch {
      return false;
    }
  }

  /**
   * Evaluates an expression (for IF return values)
   */
  private evaluateExpression(expr: string, cells: Cell[][], currentRow: number, currentCol: number): string | number {
    try {
      // Remove quotes if it's a string literal
      if (expr.startsWith('"') && expr.endsWith('"')) {
        return expr.slice(1, -1);
      }

      // Check if it's a nested function
      if (expr.toUpperCase().match(/^[A-Z]+\(/)) {
        return this.evaluateFormula('=' + expr, cells, currentRow, currentCol);
      }

      // Replace cell references and evaluate
      const evaluated = this.replaceCellReferences(expr, cells, currentRow, currentCol);
      const num = parseFloat(evaluated);
      return isNaN(num) ? evaluated : num;
    } catch {
      return '#ERROR!';
    }
  }

  // ========== LOOKUP FUNCTIONS ==========

  /**
   * Evaluates VLOOKUP function - vertical lookup
   * VLOOKUP(lookup_value, table_array, col_index_num, [range_lookup])
   */
  private evaluateVlookup(expression: string, cells: Cell[][], currentRow: number, currentCol: number): string | number {
    const args = this.extractMultipleArgs(expression);
    if (args.length < 3) return '#ERROR!';

    // Parse arguments
    const lookupValue = this.evaluateExpression(args[0], cells, currentRow, currentCol);
    const tableRange = args[1].trim();
    const colIndex = parseInt(args[2]);
    const rangeLookup = args.length > 3 ? this.parseBooleanArg(args[3]) : true;

    // Validate column index
    if (isNaN(colIndex) || colIndex < 1) {
      return '#ERROR!';
    }

    // Get table as 2D array
    const tableData = this.getRangeAs2DArray(tableRange, cells);
    if (tableData.length === 0 || tableData[0].length < colIndex) {
      return '#N/A';
    }

    // Perform lookup
    if (rangeLookup) {
      return this.vlookupApproximate(lookupValue, tableData, colIndex);
    } else {
      return this.vlookupExact(lookupValue, tableData, colIndex);
    }
  }

  /**
   * Performs exact match VLOOKUP
   */
  private vlookupExact(lookupValue: string | number, tableData: (string | number)[][], colIndex: number): string | number {
    for (let i = 0; i < tableData.length; i++) {
      const firstColValue = tableData[i][0];

      // Compare values (handle both string and number comparison)
      if (this.compareValues(firstColValue, lookupValue) === 0) {
        return tableData[i][colIndex - 1]; // colIndex is 1-based
      }
    }

    return '#N/A';
  }

  /**
   * Performs approximate match VLOOKUP (assumes first column is sorted ascending)
   */
  private vlookupApproximate(lookupValue: string | number, tableData: (string | number)[][], colIndex: number): string | number {
    let lastMatchIndex = -1;

    // Find the largest value that is less than or equal to lookup_value
    for (let i = 0; i < tableData.length; i++) {
      const firstColValue = tableData[i][0];
      const comparison = this.compareValues(firstColValue, lookupValue);

      if (comparison === 0) {
        // Exact match found
        return tableData[i][colIndex - 1];
      } else if (comparison < 0) {
        // Current value is less than lookup value
        lastMatchIndex = i;
      } else {
        // Current value is greater than lookup value, stop searching
        break;
      }
    }

    if (lastMatchIndex >= 0) {
      return tableData[lastMatchIndex][colIndex - 1];
    }

    return '#N/A';
  }

  /**
   * Compares two values for VLOOKUP matching
   * Returns: -1 if a < b, 0 if a === b, 1 if a > b
   */
  private compareValues(a: string | number, b: string | number): number {
    // Convert both to same type for comparison
    const aNum = typeof a === 'number' ? a : parseFloat(String(a));
    const bNum = typeof b === 'number' ? b : parseFloat(String(b));

    // If both are valid numbers, compare numerically
    if (!isNaN(aNum) && !isNaN(bNum)) {
      if (aNum < bNum) return -1;
      if (aNum > bNum) return 1;
      return 0;
    }

    // Otherwise compare as strings
    const aStr = String(a).toLowerCase();
    const bStr = String(b).toLowerCase();

    if (aStr < bStr) return -1;
    if (aStr > bStr) return 1;
    return 0;
  }

  /**
   * Gets a range as a 2D array of values
   */
  private getRangeAs2DArray(range: string, cells: Cell[][]): (string | number)[][] {
    const result: (string | number)[][] = [];

    try {
      const [start, end] = range.split(':');
      const startAddr = a1ToCellAddress(start.trim());
      const endAddr = a1ToCellAddress(end.trim());

      const minRow = Math.min(startAddr.row, endAddr.row);
      const maxRow = Math.max(startAddr.row, endAddr.row);
      const minCol = Math.min(startAddr.col, endAddr.col);
      const maxCol = Math.max(startAddr.col, endAddr.col);

      for (let row = minRow; row <= maxRow; row++) {
        const rowData: (string | number)[] = [];
        for (let col = minCol; col <= maxCol; col++) {
          const cell = cells[row]?.[col];
          const value = this.getCellValue(cell, cells);
          rowData.push(value);
        }
        result.push(rowData);
      }
    } catch {
      // Invalid range
    }

    return result;
  }

  /**
   * Gets the actual value from a cell (evaluates formulas)
   */
  private getCellValue(cell: Cell | undefined, cells: Cell[][]): string | number {
    if (!cell || cell.value === null || cell.value === undefined) {
      return '';
    }

    // If it's a formula, evaluate it
    if (typeof cell.value === 'string' && cell.value.startsWith('=')) {
      const result = this.evaluateFormula(cell.value, cells, cell.row, cell.col);
      return result;
    }

    return cell.value;
  }

  /**
   * Parses a boolean argument (TRUE/FALSE, 1/0)
   */
  private parseBooleanArg(arg: string): boolean {
    const upper = arg.trim().toUpperCase();
    if (upper === 'TRUE' || upper === '1') return true;
    if (upper === 'FALSE' || upper === '0') return false;

    // Try to parse as number
    const num = parseFloat(arg);
    return !isNaN(num) && num !== 0;
  }
}
