import { TestBed } from '@angular/core/testing';
import { SpreadsheetDataService } from './spreadsheet-data.service';
import { FormulaService } from './formula.service';
import { SpreadsheetData, CellAddress, CellRange } from '../models';

describe('SpreadsheetDataService', () => {
  let service: SpreadsheetDataService;
  let formulaService: FormulaService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SpreadsheetDataService, FormulaService]
    });
    service = TestBed.inject(SpreadsheetDataService);
    formulaService = TestBed.inject(FormulaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize with default data', () => {
      const data = service.getData();
      expect(data).toBeTruthy();
      expect(data.sheets).toBeDefined();
      expect(data.sheets.length).toBeGreaterThan(0);
    });

    it('should load custom data', () => {
      const customData: SpreadsheetData = {
        sheets: [{
          id: 'test-sheet',
          name: 'Test Sheet',
          rowCount: 10,
          colCount: 10,
          defaultColumnWidth: 120,
          defaultRowHeight: 25,
          isActive: true,
          cells: Array(10).fill(null).map((_, row) =>
            Array(10).fill(null).map((_, col) => ({
              row,
              col,
              value: '',
              displayValue: '',
              dataType: 'string' as const
            }))
          ),
          columnWidths: Array(10).fill(120),
          rowHeights: Array(10).fill(25)
        }],
        activeSheetIndex: 0,
        metadata: {
          title: 'Test',
          createdDate: new Date(),
          modifiedDate: new Date()
        }
      };

      service.loadData(customData);
      const data = service.getData();
      expect(data.sheets[0].id).toBe('test-sheet');
      expect(data.sheets[0].name).toBe('Test Sheet');
    });
  });

  describe('Cell Operations', () => {
    it('should update cell value', () => {
      service.updateCell(0, 0, 'Test Value');
      const cell = service.getCell(0, 0);
      expect(cell?.value).toBe('Test Value');
      expect(cell?.displayValue).toBe('Test Value');
    });

    it('should update cell with number', () => {
      service.updateCell(0, 0, 123);
      const cell = service.getCell(0, 0);
      expect(cell?.value).toBe(123);
      expect(cell?.displayValue).toBe('123');
      expect(cell?.dataType).toBe('number');
    });

    it('should evaluate formula when updating cell', () => {
      // Set up cells for formula
      service.updateCell(0, 0, 5);
      service.updateCell(1, 0, 10);
      service.updateCell(2, 0, '=SUM(A1:A2)');

      const cell = service.getCell(2, 0);
      expect(cell?.value).toBe('=SUM(A1:A2)');
      expect(cell?.displayValue).toBe('15');
      expect(cell?.dataType).toBe('formula');
    });

    it('should get cell by row/col', () => {
      service.updateCell(0, 0, 'A1 Value');
      const cell = service.getCell(0, 0);
      expect(cell?.value).toBe('A1 Value');
    });

    it('should return null for out of bounds cell', () => {
      const cell = service.getCell(1000, 1000);
      expect(cell).toBeNull();
    });
  });

  describe('Cell Selection', () => {
    it('should select a cell', () => {
      const address: CellAddress = { row: 2, col: 3 };
      service.selectCell(address);
      const selected = service.getSelectedCell();
      expect(selected).toEqual({ row: 2, col: 3 });
    });

    it('should select a range', () => {
      const range: CellRange = {
        start: { row: 0, col: 0 },
        end: { row: 2, col: 2 }
      };
      service.selectRange(range);
      const selectedRange = service.getSelectedRange();
      expect(selectedRange).toEqual({
        start: { row: 0, col: 0 },
        end: { row: 2, col: 2 }
      });
    });

    it('should clear range when selecting a cell', () => {
      const range: CellRange = {
        start: { row: 0, col: 0 },
        end: { row: 2, col: 2 }
      };
      service.selectRange(range);

      const address: CellAddress = { row: 1, col: 1 };
      service.selectCell(address);

      expect(service.getSelectedRange()).toBeNull();
      expect(service.getSelectedCell()).toEqual({ row: 1, col: 1 });
    });
  });

  describe('Undo/Redo', () => {
    it('should undo cell update', () => {
      service.updateCell(0, 0, 'Original');
      service.updateCell(0, 0, 'Modified');

      service.undo();

      const cell = service.getCell(0, 0);
      expect(cell?.value).toBe('Original');
    });

    it('should redo cell update', () => {
      service.updateCell(0, 0, 'Original');
      service.updateCell(0, 0, 'Modified');

      service.undo();
      service.redo();

      const cell = service.getCell(0, 0);
      expect(cell?.value).toBe('Modified');
    });

    it('should check if undo is available', () => {
      expect(service.canUndo()).toBe(false);

      service.updateCell(0, 0, 'Value');
      expect(service.canUndo()).toBe(true);
    });

    it('should check if redo is available', () => {
      expect(service.canRedo()).toBe(false);

      service.updateCell(0, 0, 'Value');
      service.undo();
      expect(service.canRedo()).toBe(true);
    });
  });

  describe('Row Operations', () => {
    it('should add a new row', () => {
      const initialRowCount = service.getData().sheets[0].rowCount;
      service.addRow();
      const newRowCount = service.getData().sheets[0].rowCount;
      expect(newRowCount).toBe(initialRowCount + 1);
    });

    it('should delete a row', () => {
      service.updateCell(2, 0, 'Row 2 Data');
      const initialRowCount = service.getData().sheets[0].rowCount;

      service.deleteRow(2);

      const newRowCount = service.getData().sheets[0].rowCount;
      expect(newRowCount).toBe(initialRowCount - 1);
    });

    it('should insert a row at specific position', () => {
      service.updateCell(0, 0, 'Row 0');
      service.updateCell(1, 0, 'Row 1');

      service.insertRow(1);

      const cell0 = service.getCell(0, 0);
      const cell1 = service.getCell(1, 0);
      const cell2 = service.getCell(2, 0);

      expect(cell0?.value).toBe('Row 0');
      expect(cell1?.value).toBe(''); // New empty row
      expect(cell2?.value).toBe('Row 1'); // Shifted down
    });

    it('should update row height', () => {
      service.setRowHeight(2, 50);
      const sheet = service.getActiveSheet();
      expect(sheet?.rowHeights?.[2]).toBe(50);
    });
  });

  describe('Column Operations', () => {
    it('should add a new column', () => {
      const initialColCount = service.getData().sheets[0].colCount;
      service.addColumn();
      const newColCount = service.getData().sheets[0].colCount;
      expect(newColCount).toBe(initialColCount + 1);
    });

    it('should delete a column', () => {
      service.updateCell(0, 2, 'Col 2 Data');
      const initialColCount = service.getData().sheets[0].colCount;

      service.deleteColumn(2);

      const newColCount = service.getData().sheets[0].colCount;
      expect(newColCount).toBe(initialColCount - 1);
    });

    it('should insert a column at specific position', () => {
      service.updateCell(0, 0, 'Col 0');
      service.updateCell(0, 1, 'Col 1');

      service.insertColumn(1);

      const cell0 = service.getCell(0, 0);
      const cell1 = service.getCell(0, 1);
      const cell2 = service.getCell(0, 2);

      expect(cell0?.value).toBe('Col 0');
      expect(cell1?.value).toBe(''); // New empty column
      expect(cell2?.value).toBe('Col 1'); // Shifted right
    });

    it('should update column width', () => {
      service.setColumnWidth(2, 200);
      const sheet = service.getActiveSheet();
      expect(sheet?.columnWidths?.[2]).toBe(200);
    });
  });

  describe('Cell Styling', () => {
    it('should apply style to cell', () => {
      const style = {
        fontWeight: 'bold',
        backgroundColor: '#ff0000',
        color: '#ffffff'
      };

      service.updateCellStyle(0, 0, style);
      const cell = service.getCell(0, 0);

      expect(cell?.style?.fontWeight).toBe('bold');
      expect(cell?.style?.backgroundColor).toBe('#ff0000');
      expect(cell?.style?.color).toBe('#ffffff');
    });

    it('should merge styles with existing styles', () => {
      service.updateCellStyle(0, 0, { fontWeight: 'bold' });
      service.updateCellStyle(0, 0, { color: '#ff0000' });

      const cell = service.getCell(0, 0);
      expect(cell?.style?.fontWeight).toBe('bold');
      expect(cell?.style?.color).toBe('#ff0000');
    });
  });

  describe('Copy/Paste Operations', () => {
    beforeEach(() => {
      service.updateCell(0, 0, 'Copy This');
      service.updateCellStyle(0, 0, { fontWeight: 'bold' });
    });

    it('should copy cell data', () => {
      const address: CellAddress = { row: 0, col: 0 };
      service.selectCell(address);

      const clipboard = service.copy();
      expect(clipboard).toBe('Copy This');
    });

    it('should paste cell data', () => {
      const sourceAddress: CellAddress = { row: 0, col: 0 };
      service.selectCell(sourceAddress);
      const clipboard = service.copy();

      const targetAddress: CellAddress = { row: 1, col: 1 };
      service.selectCell(targetAddress);
      service.paste(clipboard);

      const cell = service.getCell(1, 1);
      expect(cell?.value).toBe('Copy This');
    });

    it('should copy range of cells', () => {
      service.updateCell(0, 1, 'Cell B1');
      service.updateCell(1, 0, 'Cell A2');
      service.updateCell(1, 1, 'Cell B2');

      const range: CellRange = {
        start: { row: 0, col: 0 },
        end: { row: 1, col: 1 }
      };
      service.selectRange(range);

      const clipboard = service.copy();
      expect(clipboard).toContain('Copy This');
      expect(clipboard).toContain('Cell B1');
    });

    describe('Multi-Cell Range Copy (TSV Format)', () => {
      it('should copy 2x2 range in TSV format', () => {
        service.updateCell(0, 0, 'A1');
        service.updateCell(0, 1, 'B1');
        service.updateCell(1, 0, 'A2');
        service.updateCell(1, 1, 'B2');

        const range: CellRange = {
          start: { row: 0, col: 0 },
          end: { row: 1, col: 1 }
        };
        service.selectRange(range);

        const clipboard = service.copy();
        expect(clipboard).toBe('A1\tB1\nA2\tB2');
      });

      it('should copy 3x3 range in TSV format', () => {
        service.updateCell(0, 0, 'A1');
        service.updateCell(0, 1, 'B1');
        service.updateCell(0, 2, 'C1');
        service.updateCell(1, 0, 'A2');
        service.updateCell(1, 1, 'B2');
        service.updateCell(1, 2, 'C2');
        service.updateCell(2, 0, 'A3');
        service.updateCell(2, 1, 'B3');
        service.updateCell(2, 2, 'C3');

        const range: CellRange = {
          start: { row: 0, col: 0 },
          end: { row: 2, col: 2 }
        };
        service.selectRange(range);

        const clipboard = service.copy();
        expect(clipboard).toBe('A1\tB1\tC1\nA2\tB2\tC2\nA3\tB3\tC3');
      });

      it('should copy range with empty cells', () => {
        service.updateCell(0, 0, 'A1');
        // col 1 is empty
        service.updateCell(0, 2, 'C1');
        service.updateCell(1, 0, 'A2');
        service.updateCell(1, 1, 'B2');
        // col 2 is empty

        const range: CellRange = {
          start: { row: 0, col: 0 },
          end: { row: 1, col: 2 }
        };
        service.selectRange(range);

        const clipboard = service.copy();
        expect(clipboard).toBe('A1\t\tC1\nA2\tB2\t');
      });

      it('should copy range with numeric values', () => {
        service.updateCell(0, 0, 100);
        service.updateCell(0, 1, 200);
        service.updateCell(1, 0, 300);
        service.updateCell(1, 1, 400);

        const range: CellRange = {
          start: { row: 0, col: 0 },
          end: { row: 1, col: 1 }
        };
        service.selectRange(range);

        const clipboard = service.copy();
        expect(clipboard).toBe('100\t200\n300\t400');
      });

      it('should copy range with formulas showing display values', () => {
        service.updateCell(0, 0, 10);
        service.updateCell(0, 1, 20);
        service.updateCell(0, 2, '=A1+B1');

        const range: CellRange = {
          start: { row: 0, col: 0 },
          end: { row: 0, col: 2 }
        };
        service.selectRange(range);

        const clipboard = service.copy();
        // Should show display value (30) not formula
        expect(clipboard).toBe('10\t20\t30');
      });

      it('should copy single column range', () => {
        service.updateCell(0, 0, 'A1');
        service.updateCell(1, 0, 'A2');
        service.updateCell(2, 0, 'A3');

        const range: CellRange = {
          start: { row: 0, col: 0 },
          end: { row: 2, col: 0 }
        };
        service.selectRange(range);

        const clipboard = service.copy();
        expect(clipboard).toBe('A1\nA2\nA3');
      });

      it('should copy single row range', () => {
        service.updateCell(0, 0, 'A1');
        service.updateCell(0, 1, 'B1');
        service.updateCell(0, 2, 'C1');

        const range: CellRange = {
          start: { row: 0, col: 0 },
          end: { row: 0, col: 2 }
        };
        service.selectRange(range);

        const clipboard = service.copy();
        expect(clipboard).toBe('A1\tB1\tC1');
      });

      it('should handle inverted range (end before start)', () => {
        service.updateCell(0, 0, 'A1');
        service.updateCell(0, 1, 'B1');
        service.updateCell(1, 0, 'A2');
        service.updateCell(1, 1, 'B2');

        // Range selected from bottom-right to top-left
        const range: CellRange = {
          start: { row: 1, col: 1 },
          end: { row: 0, col: 0 }
        };
        service.selectRange(range);

        const clipboard = service.copy();
        // Should still copy correctly
        expect(clipboard).toBe('A1\tB1\nA2\tB2');
      });

      it('should return null when no selection exists', () => {
        // No cell or range selected
        const clipboard = service.copy();
        expect(clipboard).toBeNull();
      });

      it('should copy range with mixed data types', () => {
        service.updateCell(0, 0, 'Text');
        service.updateCell(0, 1, 123);
        service.updateCell(1, 0, true);
        service.updateCell(1, 1, '=A1');

        const range: CellRange = {
          start: { row: 0, col: 0 },
          end: { row: 1, col: 1 }
        };
        service.selectRange(range);

        const clipboard = service.copy();
        expect(clipboard).toContain('Text');
        expect(clipboard).toContain('123');
      });
    });
  });

  describe('Formula Recalculation', () => {
    it('should recalculate formulas when dependency changes', () => {
      service.updateCell(0, 0, 10);
      service.updateCell(1, 0, 20);
      service.updateCell(2, 0, '=A1+A2');

      let result = service.getCell(2, 0);
      expect(result?.displayValue).toBe('30');

      // Update dependency
      service.updateCell(0, 0, 5);

      result = service.getCell(2, 0);
      expect(result?.displayValue).toBe('25');
    });

    it('should handle multiple dependent formulas', () => {
      service.updateCell(0, 0, 10);
      service.updateCell(1, 0, '=A1*2');
      service.updateCell(2, 0, '=A2+10');

      let cell2 = service.getCell(2, 0);
      expect(cell2?.displayValue).toBe('30'); // (10*2)+10 = 30

      service.updateCell(0, 0, 5);

      cell2 = service.getCell(2, 0);
      expect(cell2?.displayValue).toBe('20'); // (5*2)+10 = 20
    });
  });

  describe('Active Sheet', () => {
    it('should get active sheet', () => {
      const sheet = service.getActiveSheet();
      expect(sheet).toBeTruthy();
      expect(sheet?.isActive).toBe(true);
    });

    it('should set active sheet', () => {
      const data = service.getData();
      if (data.sheets.length > 1) {
        service.setActiveSheet(1);
        const activeSheet = service.getActiveSheet();
        expect(activeSheet?.isActive).toBe(true);
        expect(data.sheets[1].isActive).toBe(true);
      }
    });
  });

  describe('Editing Cell', () => {
    it('should set editing cell', () => {
      const address: CellAddress = { row: 1, col: 2 };
      service.setEditingCell(address);
      const editing = service.getEditingCell();
      expect(editing).toEqual({ row: 1, col: 2 });
    });

    it('should clear editing cell', () => {
      const address: CellAddress = { row: 1, col: 2 };
      service.setEditingCell(address);
      service.setEditingCell(null);
      const editing = service.getEditingCell();
      expect(editing).toBeNull();
    });
  });
});
