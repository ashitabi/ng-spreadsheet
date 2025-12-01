# React Implementation Plan for ng-spreadsheet

**Goal:** Create React support for ng-spreadsheet by extracting core logic and building React wrappers

**Timeline:** 6-8 weeks full-time

**Approach:** Framework-Agnostic Core + React Wrapper

---

## Architecture Overview

```
ng-spreadsheet (monorepo)
├── packages/
│   ├── core/                    # Framework-agnostic core (NEW)
│   │   ├── src/
│   │   │   ├── engine/
│   │   │   │   ├── FormulaEngine.ts
│   │   │   │   └── functions/
│   │   │   ├── state/
│   │   │   │   └── SpreadsheetState.ts
│   │   │   ├── models/
│   │   │   │   ├── types.ts
│   │   │   │   └── interfaces.ts
│   │   │   └── utils/
│   │   │       ├── cellUtils.ts
│   │   │       ├── rangeUtils.ts
│   │   │       └── formatUtils.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── angular/                 # Angular wrapper (EXISTING - refactored)
│   │   ├── src/
│   │   │   └── lib/
│   │   │       ├── components/
│   │   │       └── services/
│   │   └── package.json
│   │
│   └── react/                   # React wrapper (NEW)
│       ├── src/
│       │   ├── components/
│       │   │   ├── Spreadsheet.tsx
│       │   │   ├── Toolbar.tsx
│       │   │   ├── FormulaBar.tsx
│       │   │   ├── Grid.tsx
│       │   │   └── Cell.tsx
│       │   ├── hooks/
│       │   │   ├── useSpreadsheet.ts
│       │   │   ├── useFormulas.ts
│       │   │   ├── useSelection.ts
│       │   │   └── useClipboard.ts
│       │   ├── contexts/
│       │   │   └── SpreadsheetContext.tsx
│       │   ├── styles/
│       │   │   └── spreadsheet.css
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
└── apps/
    ├── demo-angular/            # Angular demo (EXISTING)
    └── demo-react/              # React demo (NEW)
        ├── src/
        │   ├── App.tsx
        │   ├── main.tsx
        │   └── index.html
        ├── package.json
        └── vite.config.ts
```

---

## Phase 1: Setup Monorepo Structure (Week 1, Days 1-2)

### 1.1 Initialize Monorepo

**Option A: Use npm workspaces** (Simplest)

```json
// Root package.json
{
  "name": "ng-spreadsheet-monorepo",
  "private": true,
  "workspaces": [
    "packages/*",
    "apps/*"
  ],
  "scripts": {
    "build:core": "npm run build --workspace=packages/core",
    "build:react": "npm run build --workspace=packages/react",
    "dev:react": "npm run dev --workspace=apps/demo-react"
  }
}
```

**Option B: Use Nx** (More features, better for larger projects)

```bash
npx create-nx-workspace@latest ng-spreadsheet --preset=npm
```

**Recommendation:** Start with npm workspaces for simplicity

### 1.2 Create Package Structure

```bash
# Create directory structure
mkdir -p packages/core/src/{engine,state,models,utils}
mkdir -p packages/react/src/{components,hooks,contexts,styles}
mkdir -p apps/demo-react/src
```

### 1.3 Setup TypeScript Configuration

Create shared `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

**Estimated Time:** 1 day

---

## Phase 2: Extract Core Logic (Week 1-2)

### 2.1 Extract Type Definitions

**File:** `packages/core/src/models/types.ts`

```typescript
export interface Cell {
  row: number;
  col: number;
  value: string | number | null;
  displayValue?: string | number;
  style?: CellStyle;
}

export interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
  horizontalAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  numberFormat?: NumberFormat;
  border?: BorderStyle;
  wrapText?: boolean;
}

export type NumberFormat = 'general' | 'number' | 'currency' | 'percentage' | 'date' | 'time';
export type BorderStyle = 'all' | 'outline' | 'top' | 'bottom' | 'left' | 'right' | 'none';

export interface Sheet {
  id: string;
  name: string;
  rows: number;
  cols: number;
  data: Cell[][];
  columnWidths: Record<number, number>;
  rowHeights: Record<number, number>;
}

export interface SpreadsheetData {
  sheets: Sheet[];
  activeSheetId: string;
}

export interface CellRange {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}
```

**Estimated Time:** 2 hours

### 2.2 Extract Formula Engine

**File:** `packages/core/src/engine/FormulaEngine.ts`

Copy from Angular `formula.service.ts` and make framework-agnostic:

```typescript
export class FormulaEngine {
  evaluate(
    formula: string,
    cells: Cell[][],
    currentRow: number,
    currentCol: number
  ): string | number {
    // Copy all logic from FormulaService
    // Remove Angular-specific decorators (@Injectable, etc.)
    // Keep all the formula evaluation logic
  }

  // All helper methods
  private evaluateSum(...): number { }
  private evaluateVlookup(...): string | number { }
  // ... all other formula functions
}
```

**Steps:**
1. Copy `formula.service.ts` content
2. Remove `@Injectable()` decorator
3. Remove dependency injection
4. Make all methods work with pure TypeScript
5. Add unit tests

**Estimated Time:** 3 days

### 2.3 Create Core State Management

**File:** `packages/core/src/state/SpreadsheetState.ts`

Create a simple event-emitter based state manager:

```typescript
type Listener<T> = (value: T) => void;

export class Observable<T> {
  private listeners: Set<Listener<T>> = new Set();

  constructor(private value: T) {}

  getValue(): T {
    return this.value;
  }

  setValue(newValue: T): void {
    this.value = newValue;
    this.notify();
  }

  subscribe(listener: Listener<T>): () => void {
    this.listeners.add(listener);
    listener(this.value); // Emit current value immediately

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach(listener => listener(this.value));
  }
}

export class SpreadsheetState {
  private data: Observable<SpreadsheetData>;
  private selectedCell: Observable<{ row: number; col: number } | null>;
  private selectedRange: Observable<CellRange | null>;
  private editingCell: Observable<{ row: number; col: number } | null>;
  private clipboard: Observable<Cell[][] | null>;
  private undoStack: Cell[][][];
  private redoStack: Cell[][][];

  private formulaEngine: FormulaEngine;

  constructor(initialData: SpreadsheetData) {
    this.data = new Observable(initialData);
    this.selectedCell = new Observable(null);
    this.selectedRange = new Observable(null);
    this.editingCell = new Observable(null);
    this.clipboard = new Observable(null);
    this.undoStack = [];
    this.redoStack = [];
    this.formulaEngine = new FormulaEngine();
  }

  // Observables (for subscriptions)
  data$ = this.data;
  selectedCell$ = this.selectedCell;
  selectedRange$ = this.selectedRange;
  editingCell$ = this.editingCell;
  clipboard$ = this.clipboard;

  // Methods
  updateCell(row: number, col: number, updates: Partial<Cell>): void {
    const currentData = this.data.getValue();
    const sheet = currentData.sheets.find(s => s.id === currentData.activeSheetId);
    if (!sheet) return;

    // Save to undo stack
    this.saveToUndoStack(sheet.data);

    // Update cell
    const cellRow = sheet.data[row] || [];
    const cell = cellRow[col] || { row, col, value: null };

    const updatedCell = { ...cell, ...updates };

    // If value is a formula, evaluate it
    if (typeof updatedCell.value === 'string' && updatedCell.value.startsWith('=')) {
      updatedCell.displayValue = this.formulaEngine.evaluate(
        updatedCell.value,
        sheet.data,
        row,
        col
      );
    } else {
      updatedCell.displayValue = updatedCell.value;
    }

    cellRow[col] = updatedCell;
    sheet.data[row] = cellRow;

    // Recalculate formulas
    this.recalculateFormulas(sheet);

    // Emit updated data
    this.data.setValue({ ...currentData });
  }

  selectCell(row: number, col: number): void {
    this.selectedCell.setValue({ row, col });
    this.selectedRange.setValue(null);
  }

  selectRange(range: CellRange): void {
    this.selectedRange.setValue(range);
  }

  startEditing(row: number, col: number): void {
    this.editingCell.setValue({ row, col });
  }

  stopEditing(): void {
    this.editingCell.setValue(null);
  }

  copy(): void {
    // Implementation
  }

  paste(): void {
    // Implementation
  }

  undo(): void {
    if (this.undoStack.length === 0) return;
    const previousState = this.undoStack.pop()!;
    const currentData = this.data.getValue();
    const sheet = currentData.sheets.find(s => s.id === currentData.activeSheetId);
    if (sheet) {
      this.redoStack.push([...sheet.data]);
      sheet.data = previousState;
      this.data.setValue({ ...currentData });
    }
  }

  redo(): void {
    // Similar to undo
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  private recalculateFormulas(sheet: Sheet): void {
    sheet.data.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell && typeof cell.value === 'string' && cell.value.startsWith('=')) {
          cell.displayValue = this.formulaEngine.evaluate(
            cell.value,
            sheet.data,
            rowIndex,
            colIndex
          );
        }
      });
    });
  }

  private saveToUndoStack(data: Cell[][]): void {
    this.undoStack.push(JSON.parse(JSON.stringify(data)));
    if (this.undoStack.length > 100) {
      this.undoStack.shift(); // Keep only last 100
    }
    this.redoStack = []; // Clear redo on new change
  }
}
```

**Estimated Time:** 3 days

### 2.4 Create Utility Functions

**Files:**
- `packages/core/src/utils/cellUtils.ts`
- `packages/core/src/utils/rangeUtils.ts`
- `packages/core/src/utils/formatUtils.ts`

Extract utility functions from Angular services:

```typescript
// cellUtils.ts
export function a1ToCellAddress(a1: string): { row: number; col: number } {
  // A1 → {row: 0, col: 0}
}

export function cellAddressToA1(row: number, col: number): string {
  // {row: 0, col: 0} → A1
}

export function columnNumberToLetter(col: number): string {
  // 0 → A, 1 → B, 25 → Z, 26 → AA
}

// rangeUtils.ts
export function parseRange(range: string): CellRange {
  // "A1:B10" → {startRow: 0, startCol: 0, endRow: 9, endCol: 1}
}

export function isInRange(row: number, col: number, range: CellRange): boolean {
  // Check if cell is within range
}

// formatUtils.ts
export function formatNumber(value: number, format: NumberFormat): string {
  // Format number according to format type
}

export function formatDate(value: number, format: string): string {
  // Format date
}
```

**Estimated Time:** 1 day

### 2.5 Create Core Package Config

**File:** `packages/core/package.json`

```json
{
  "name": "@ng-spreadsheet/core",
  "version": "0.1.0",
  "description": "Framework-agnostic spreadsheet engine",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "dev": "tsup src/index.ts --format cjs,esm --dts --watch",
    "test": "vitest"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0"
  },
  "keywords": ["spreadsheet", "excel", "formula", "grid"],
  "license": "MIT"
}
```

**File:** `packages/core/src/index.ts`

```typescript
// Export everything
export * from './models/types';
export * from './engine/FormulaEngine';
export * from './state/SpreadsheetState';
export * from './utils/cellUtils';
export * from './utils/rangeUtils';
export * from './utils/formatUtils';
```

**Estimated Time:** 1 day

**Phase 2 Total:** 2 weeks

---

## Phase 3: Build React Package (Week 3-4)

### 3.1 Setup React Package

**File:** `packages/react/package.json`

```json
{
  "name": "@ng-spreadsheet/react",
  "version": "0.1.0",
  "description": "React components for ng-spreadsheet",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    },
    "./styles": "./dist/spreadsheet.css"
  },
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts --external react --external react-dom",
    "dev": "tsup src/index.ts --format cjs,esm --dts --watch --external react --external react-dom"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "dependencies": {
    "@ng-spreadsheet/core": "workspace:*",
    "react-window": "^1.8.10"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/react-window": "^1.8.8",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tsup": "^8.0.0",
    "typescript": "^5.3.0"
  }
}
```

### 3.2 Create SpreadsheetContext

**File:** `packages/react/src/contexts/SpreadsheetContext.tsx`

```typescript
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { SpreadsheetState, SpreadsheetData, Cell, CellRange } from '@ng-spreadsheet/core';

interface SpreadsheetContextValue {
  state: SpreadsheetState;
  data: SpreadsheetData;
  selectedCell: { row: number; col: number } | null;
  selectedRange: CellRange | null;
  editingCell: { row: number; col: number } | null;
  clipboard: Cell[][] | null;
  updateCell: (row: number, col: number, updates: Partial<Cell>) => void;
  selectCell: (row: number, col: number) => void;
  selectRange: (range: CellRange) => void;
  startEditing: (row: number, col: number) => void;
  stopEditing: () => void;
  copy: () => void;
  paste: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const SpreadsheetContext = createContext<SpreadsheetContextValue | null>(null);

export function SpreadsheetProvider({
  initialData,
  children
}: {
  initialData: SpreadsheetData;
  children: React.ReactNode;
}) {
  const [state] = useState(() => new SpreadsheetState(initialData));
  const [data, setData] = useState<SpreadsheetData>(initialData);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [selectedRange, setSelectedRange] = useState<CellRange | null>(null);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [clipboard, setClipboard] = useState<Cell[][] | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Subscribe to state changes
  useEffect(() => {
    const unsubData = state.data$.subscribe(setData);
    const unsubSelectedCell = state.selectedCell$.subscribe(setSelectedCell);
    const unsubSelectedRange = state.selectedRange$.subscribe(setSelectedRange);
    const unsubEditingCell = state.editingCell$.subscribe(setEditingCell);
    const unsubClipboard = state.clipboard$.subscribe(setClipboard);

    return () => {
      unsubData();
      unsubSelectedCell();
      unsubSelectedRange();
      unsubEditingCell();
      unsubClipboard();
    };
  }, [state]);

  // Update undo/redo state
  useEffect(() => {
    setCanUndo(state.canUndo());
    setCanRedo(state.canRedo());
  }, [data, state]);

  const updateCell = useCallback((row: number, col: number, updates: Partial<Cell>) => {
    state.updateCell(row, col, updates);
  }, [state]);

  const selectCell = useCallback((row: number, col: number) => {
    state.selectCell(row, col);
  }, [state]);

  const selectRange = useCallback((range: CellRange) => {
    state.selectRange(range);
  }, [state]);

  const startEditing = useCallback((row: number, col: number) => {
    state.startEditing(row, col);
  }, [state]);

  const stopEditing = useCallback(() => {
    state.stopEditing();
  }, [state]);

  const copy = useCallback(() => {
    state.copy();
  }, [state]);

  const paste = useCallback(() => {
    state.paste();
  }, [state]);

  const undo = useCallback(() => {
    state.undo();
  }, [state]);

  const redo = useCallback(() => {
    state.redo();
  }, [state]);

  const value: SpreadsheetContextValue = {
    state,
    data,
    selectedCell,
    selectedRange,
    editingCell,
    clipboard,
    updateCell,
    selectCell,
    selectRange,
    startEditing,
    stopEditing,
    copy,
    paste,
    undo,
    redo,
    canUndo,
    canRedo
  };

  return (
    <SpreadsheetContext.Provider value={value}>
      {children}
    </SpreadsheetContext.Provider>
  );
}

export function useSpreadsheet() {
  const context = useContext(SpreadsheetContext);
  if (!context) {
    throw new Error('useSpreadsheet must be used within SpreadsheetProvider');
  }
  return context;
}
```

**Estimated Time:** 1 day

### 3.3 Create Custom Hooks

**File:** `packages/react/src/hooks/useSpreadsheet.ts`

(Exported from context above)

**File:** `packages/react/src/hooks/useSelection.ts`

```typescript
import { useCallback } from 'react';
import { useSpreadsheet } from '../contexts/SpreadsheetContext';

export function useSelection() {
  const { selectedCell, selectedRange, selectCell, selectRange } = useSpreadsheet();

  const isSelected = useCallback((row: number, col: number): boolean => {
    if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
      return true;
    }
    if (selectedRange) {
      return row >= selectedRange.startRow &&
             row <= selectedRange.endRow &&
             col >= selectedRange.startCol &&
             col <= selectedRange.endCol;
    }
    return false;
  }, [selectedCell, selectedRange]);

  const isInRange = useCallback((row: number, col: number): boolean => {
    if (!selectedRange) return false;
    return row >= selectedRange.startRow &&
           row <= selectedRange.endRow &&
           col >= selectedRange.startCol &&
           col <= selectedRange.endCol;
  }, [selectedRange]);

  return {
    selectedCell,
    selectedRange,
    selectCell,
    selectRange,
    isSelected,
    isInRange
  };
}
```

**File:** `packages/react/src/hooks/useKeyboard.ts`

```typescript
import { useEffect } from 'react';
import { useSpreadsheet } from '../contexts/SpreadsheetContext';

export function useKeyboard() {
  const {
    selectedCell,
    selectCell,
    startEditing,
    stopEditing,
    editingCell,
    copy,
    paste,
    undo,
    redo,
    data
  } = useSpreadsheet();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCell) return;

      const sheet = data.sheets.find(s => s.id === data.activeSheetId);
      if (!sheet) return;

      // If editing, only handle Escape and Enter
      if (editingCell) {
        if (e.key === 'Escape') {
          stopEditing();
          e.preventDefault();
        } else if (e.key === 'Enter') {
          stopEditing();
          selectCell(selectedCell.row + 1, selectedCell.col);
          e.preventDefault();
        }
        return;
      }

      // Navigation
      if (e.key === 'ArrowUp' && selectedCell.row > 0) {
        selectCell(selectedCell.row - 1, selectedCell.col);
        e.preventDefault();
      } else if (e.key === 'ArrowDown' && selectedCell.row < sheet.rows - 1) {
        selectCell(selectedCell.row + 1, selectedCell.col);
        e.preventDefault();
      } else if (e.key === 'ArrowLeft' && selectedCell.col > 0) {
        selectCell(selectedCell.row, selectedCell.col - 1);
        e.preventDefault();
      } else if (e.key === 'ArrowRight' && selectedCell.col < sheet.cols - 1) {
        selectCell(selectedCell.row, selectedCell.col + 1);
        e.preventDefault();
      }

      // Tab navigation
      else if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (selectedCell.col > 0) {
            selectCell(selectedCell.row, selectedCell.col - 1);
          }
        } else {
          if (selectedCell.col < sheet.cols - 1) {
            selectCell(selectedCell.row, selectedCell.col + 1);
          }
        }
        e.preventDefault();
      }

      // Enter to edit or move down
      else if (e.key === 'Enter') {
        if (e.shiftKey) {
          if (selectedCell.row > 0) {
            selectCell(selectedCell.row - 1, selectedCell.col);
          }
        } else {
          if (selectedCell.row < sheet.rows - 1) {
            selectCell(selectedCell.row + 1, selectedCell.col);
          }
        }
        e.preventDefault();
      }

      // F2 to edit
      else if (e.key === 'F2') {
        startEditing(selectedCell.row, selectedCell.col);
        e.preventDefault();
      }

      // Clipboard operations
      else if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        copy();
        e.preventDefault();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        paste();
        e.preventDefault();
      }

      // Undo/Redo
      else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        undo();
        e.preventDefault();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        redo();
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, editingCell, data, selectCell, startEditing, stopEditing, copy, paste, undo, redo]);
}
```

**Estimated Time:** 2 days

### 3.4 Create Cell Component

**File:** `packages/react/src/components/Cell.tsx`

```typescript
import React, { useState, useRef, useEffect } from 'react';
import { Cell as CellType } from '@ng-spreadsheet/core';
import { useSpreadsheet } from '../contexts/SpreadsheetContext';
import { useSelection } from '../hooks/useSelection';

interface CellProps {
  row: number;
  col: number;
  cell: CellType | null;
  width: number;
  height: number;
}

export function Cell({ row, col, cell, width, height }: CellProps) {
  const { updateCell, startEditing, stopEditing, editingCell } = useSpreadsheet();
  const { isSelected, selectCell } = useSelection();
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const isEditing = editingCell?.row === row && editingCell?.col === col;
  const selected = isSelected(row, col);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      setInputValue(cell?.value?.toString() || '');
    }
  }, [isEditing, cell?.value]);

  const handleClick = () => {
    selectCell(row, col);
  };

  const handleDoubleClick = () => {
    startEditing(row, col);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    updateCell(row, col, { value: inputValue });
    stopEditing();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      updateCell(row, col, { value: inputValue });
      stopEditing();
    } else if (e.key === 'Escape') {
      stopEditing();
    }
  };

  const displayValue = cell?.displayValue ?? cell?.value ?? '';

  return (
    <div
      className={`spreadsheet-cell ${selected ? 'selected' : ''}`}
      style={{
        width,
        height,
        fontWeight: cell?.style?.bold ? 'bold' : 'normal',
        fontStyle: cell?.style?.italic ? 'italic' : 'normal',
        textDecoration: cell?.style?.underline ? 'underline' : 'none',
        color: cell?.style?.color,
        backgroundColor: cell?.style?.backgroundColor,
        textAlign: cell?.style?.horizontalAlign || 'left',
        verticalAlign: cell?.style?.verticalAlign || 'middle',
        fontFamily: cell?.style?.fontFamily,
        fontSize: cell?.style?.fontSize ? `${cell.style.fontSize}px` : undefined
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          className="cell-input"
          style={{ width: '100%', height: '100%', border: 'none', outline: 'none' }}
        />
      ) : (
        <span>{displayValue}</span>
      )}
    </div>
  );
}
```

**Estimated Time:** 1 day

### 3.5 Create Grid Component with Virtual Scrolling

**File:** `packages/react/src/components/Grid.tsx`

```typescript
import React from 'react';
import { FixedSizeGrid as VirtualGrid } from 'react-window';
import { useSpreadsheet } from '../contexts/SpreadsheetContext';
import { Cell } from './Cell';

const DEFAULT_ROW_HEIGHT = 30;
const DEFAULT_COL_WIDTH = 100;

interface CellRendererProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
}

export function Grid() {
  const { data } = useSpreadsheet();

  const sheet = data.sheets.find(s => s.id === data.activeSheetId);
  if (!sheet) return null;

  const getColumnWidth = (col: number) => {
    return sheet.columnWidths[col] || DEFAULT_COL_WIDTH;
  };

  const getRowHeight = (row: number) => {
    return sheet.rowHeights[row] || DEFAULT_ROW_HEIGHT;
  };

  const CellRenderer = ({ columnIndex, rowIndex, style }: CellRendererProps) => {
    const cell = sheet.data[rowIndex]?.[columnIndex] || null;

    return (
      <div style={style}>
        <Cell
          row={rowIndex}
          col={columnIndex}
          cell={cell}
          width={getColumnWidth(columnIndex)}
          height={getRowHeight(rowIndex)}
        />
      </div>
    );
  };

  return (
    <VirtualGrid
      className="spreadsheet-grid"
      columnCount={sheet.cols}
      columnWidth={getColumnWidth}
      height={600}
      rowCount={sheet.rows}
      rowHeight={getRowHeight}
      width={800}
    >
      {CellRenderer}
    </VirtualGrid>
  );
}
```

**Estimated Time:** 2 days

### 3.6 Create Main Spreadsheet Component

**File:** `packages/react/src/components/Spreadsheet.tsx`

```typescript
import React from 'react';
import { SpreadsheetData } from '@ng-spreadsheet/core';
import { SpreadsheetProvider } from '../contexts/SpreadsheetContext';
import { Grid } from './Grid';
import { FormulaBar } from './FormulaBar';
import { Toolbar } from './Toolbar';
import { useKeyboard } from '../hooks/useKeyboard';
import '../styles/spreadsheet.css';

interface SpreadsheetProps {
  initialData: SpreadsheetData;
  onDataChange?: (data: SpreadsheetData) => void;
}

function SpreadsheetInner() {
  useKeyboard(); // Setup keyboard shortcuts

  return (
    <div className="spreadsheet-container">
      <Toolbar />
      <FormulaBar />
      <Grid />
    </div>
  );
}

export function Spreadsheet({ initialData, onDataChange }: SpreadsheetProps) {
  return (
    <SpreadsheetProvider initialData={initialData}>
      <SpreadsheetInner />
    </SpreadsheetProvider>
  );
}
```

**Estimated Time:** 1 day

### 3.7 Create FormulaBar Component

**File:** `packages/react/src/components/FormulaBar.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { useSpreadsheet } from '../contexts/SpreadsheetContext';
import { cellAddressToA1 } from '@ng-spreadsheet/core';

export function FormulaBar() {
  const { selectedCell, data, updateCell } = useSpreadsheet();
  const [value, setValue] = useState('');

  useEffect(() => {
    if (selectedCell) {
      const sheet = data.sheets.find(s => s.id === data.activeSheetId);
      if (sheet) {
        const cell = sheet.data[selectedCell.row]?.[selectedCell.col];
        setValue(cell?.value?.toString() || '');
      }
    }
  }, [selectedCell, data]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && selectedCell) {
      updateCell(selectedCell.row, selectedCell.col, { value });
    }
  };

  const cellAddress = selectedCell
    ? cellAddressToA1(selectedCell.row, selectedCell.col)
    : '';

  return (
    <div className="formula-bar">
      <div className="cell-address">{cellAddress}</div>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="formula-input"
        placeholder="Enter value or formula"
      />
    </div>
  );
}
```

**Estimated Time:** 1 day

### 3.8 Create Toolbar Component

**File:** `packages/react/src/components/Toolbar.tsx`

```typescript
import React from 'react';
import { useSpreadsheet } from '../contexts/SpreadsheetContext';

export function Toolbar() {
  const { undo, redo, canUndo, canRedo, copy, paste } = useSpreadsheet();

  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <button onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
          ↶ Undo
        </button>
        <button onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)">
          ↷ Redo
        </button>
      </div>

      <div className="toolbar-section">
        <button onClick={copy} title="Copy (Ctrl+C)">
          📋 Copy
        </button>
        <button onClick={paste} title="Paste (Ctrl+V)">
          📄 Paste
        </button>
      </div>

      {/* Add more toolbar buttons as needed */}
    </div>
  );
}
```

**Estimated Time:** 1 day

### 3.9 Create Styles

**File:** `packages/react/src/styles/spreadsheet.css`

```css
.spreadsheet-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.toolbar {
  display: flex;
  gap: 10px;
  padding: 10px;
  background: #f3f3f3;
  border-bottom: 1px solid #d4d4d4;
}

.toolbar-section {
  display: flex;
  gap: 5px;
}

.toolbar button {
  padding: 6px 12px;
  border: 1px solid #d4d4d4;
  background: white;
  cursor: pointer;
  border-radius: 3px;
}

.toolbar button:hover:not(:disabled) {
  background: #e7e7e7;
}

.toolbar button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.formula-bar {
  display: flex;
  gap: 10px;
  padding: 8px;
  background: white;
  border-bottom: 1px solid #d4d4d4;
}

.cell-address {
  min-width: 60px;
  padding: 6px 12px;
  border: 1px solid #d4d4d4;
  border-radius: 3px;
  background: #f3f3f3;
  font-weight: bold;
}

.formula-input {
  flex: 1;
  padding: 6px 12px;
  border: 1px solid #d4d4d4;
  border-radius: 3px;
  font-family: monospace;
}

.spreadsheet-grid {
  flex: 1;
  overflow: auto;
}

.spreadsheet-cell {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  border: 1px solid #d4d4d4;
  background: white;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: cell;
}

.spreadsheet-cell.selected {
  outline: 2px solid #217346;
  outline-offset: -2px;
  z-index: 1;
}

.spreadsheet-cell:hover {
  background: #f9f9f9;
}

.cell-input {
  font-family: inherit;
  font-size: inherit;
  padding: 0;
  margin: 0;
}
```

**Estimated Time:** 1 day

**Phase 3 Total:** 2 weeks

---

## Phase 4: Create React Demo App (Week 5)

### 4.1 Setup Vite + React

```bash
cd apps
npm create vite@latest demo-react -- --template react-ts
cd demo-react
npm install
```

### 4.2 Install Dependencies

```bash
npm install @ng-spreadsheet/core @ng-spreadsheet/react
```

### 4.3 Create Demo App

**File:** `apps/demo-react/src/App.tsx`

```typescript
import { Spreadsheet } from '@ng-spreadsheet/react';
import { SpreadsheetData } from '@ng-spreadsheet/core';
import '@ng-spreadsheet/react/styles';
import './App.css';

const demoData: SpreadsheetData = {
  sheets: [{
    id: 'sheet1',
    name: 'Sales Data',
    rows: 1000,
    cols: 26,
    data: [
      [
        { row: 0, col: 0, value: 'Product', style: { bold: true, backgroundColor: '#217346', color: '#ffffff' } },
        { row: 0, col: 1, value: 'Price', style: { bold: true, backgroundColor: '#217346', color: '#ffffff' } },
        { row: 0, col: 2, value: 'Quantity', style: { bold: true, backgroundColor: '#217346', color: '#ffffff' } },
        { row: 0, col: 3, value: 'Total', style: { bold: true, backgroundColor: '#217346', color: '#ffffff' } }
      ],
      [
        { row: 1, col: 0, value: 'Laptop' },
        { row: 1, col: 1, value: 999.99 },
        { row: 1, col: 2, value: 50 },
        { row: 1, col: 3, value: '=B2*C2' }
      ],
      [
        { row: 2, col: 0, value: 'Mouse' },
        { row: 2, col: 1, value: 29.99 },
        { row: 2, col: 2, value: 200 },
        { row: 2, col: 3, value: '=B3*C3' }
      ],
      [
        { row: 3, col: 0, value: 'Total', style: { bold: true } },
        { row: 3, col: 1, value: '' },
        { row: 3, col: 2, value: '=SUM(C2:C3)' },
        { row: 3, col: 3, value: '=SUM(D2:D3)', style: { bold: true, numberFormat: 'currency' } }
      ]
    ],
    columnWidths: { 0: 150, 1: 100, 2: 100, 3: 120 },
    rowHeights: {}
  }],
  activeSheetId: 'sheet1'
};

function App() {
  return (
    <div className="app">
      <h1>ng-spreadsheet for React</h1>
      <div className="spreadsheet-wrapper">
        <Spreadsheet initialData={demoData} />
      </div>
    </div>
  );
}

export default App;
```

**Estimated Time:** 2 days

**Phase 4 Total:** 1 week

---

## Phase 5: Testing & Debugging (Week 6)

### 5.1 Unit Tests

- Test FormulaEngine
- Test SpreadsheetState
- Test utility functions
- Test React hooks

### 5.2 Integration Tests

- Test component interactions
- Test keyboard shortcuts
- Test clipboard operations
- Test undo/redo

### 5.3 E2E Tests

Use Playwright or Cypress:

```typescript
test('user can edit cell and formula calculates', async () => {
  // Test end-to-end workflows
});
```

### 5.4 Performance Testing

- Large dataset (10,000 rows)
- Formula recalculation performance
- Virtual scrolling smoothness

**Estimated Time:** 1 week

---

## Phase 6: Documentation & Publishing (Week 7-8)

### 6.1 Update Documentation

- README for React package
- API documentation
- Usage examples
- Migration guide

### 6.2 Setup Publishing

Configure package.json for publishing:

```json
{
  "publishConfig": {
    "access": "public"
  }
}
```

### 6.3 Publish Packages

```bash
# Publish core
cd packages/core
npm publish

# Publish React
cd packages/react
npm publish
```

**Estimated Time:** 1 week

---

## Summary Timeline

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| 1. Monorepo Setup | 1 day | Workspace structure, configs |
| 2. Extract Core | 2 weeks | @ng-spreadsheet/core package |
| 3. Build React | 2 weeks | @ng-spreadsheet/react package |
| 4. Demo App | 1 week | Working React demo |
| 5. Testing | 1 week | Unit/integration/E2E tests |
| 6. Documentation | 1 week | Docs, publishing |
| **Total** | **6-7 weeks** | Full React support |

---

## Next Steps

1. **Start with Phase 1**: Setup monorepo structure
2. **Extract core incrementally**: Start with formula engine
3. **Build minimal React wrapper**: Get basic functionality working
4. **Iterate**: Add features incrementally

---

## Key Decisions

### Technology Choices

- **Monorepo**: npm workspaces (simple) or Nx (advanced)
- **Build Tool**: tsup for packages, Vite for demo
- **Virtual Scrolling**: react-window
- **State Management**: Custom Observable (lightweight)
- **Testing**: Vitest + Playwright

### Architecture Principles

1. **Separation of Concerns**: Core logic separate from UI
2. **Framework Agnostic Core**: Pure TypeScript, no dependencies
3. **React-friendly Wrapper**: Hooks, Context, idiomatic patterns
4. **Performance First**: Virtual scrolling, memoization
5. **Type Safety**: Full TypeScript coverage

---

## Risk Mitigation

**Risk 1:** Formula engine doesn't port cleanly
- **Mitigation**: Extract and test formula engine first

**Risk 2:** Virtual scrolling performance issues
- **Mitigation**: Benchmark early, use react-window best practices

**Risk 3:** State management complexity
- **Mitigation**: Keep core state simple, add complexity only as needed

**Risk 4:** Timeline overruns
- **Mitigation**: Build MVP first, add features incrementally

---

## Success Criteria

✅ Core package compiles and passes tests
✅ React package compiles and passes tests
✅ Demo app runs and demonstrates key features
✅ Formula calculation works correctly
✅ Virtual scrolling handles 10,000 rows smoothly
✅ Keyboard shortcuts work as expected
✅ Copy/paste/undo/redo functional
✅ Documentation complete
✅ Published to npm

---

**Ready to start implementation? Begin with Phase 1!**
