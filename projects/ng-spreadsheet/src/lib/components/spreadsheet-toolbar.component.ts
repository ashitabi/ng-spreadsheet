import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Toolbar component for spreadsheet operations.
 * Provides buttons for common actions like add/delete rows/columns.
 */
@Component({
  selector: 'ngs-spreadsheet-toolbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toolbar">
      <div class="toolbar-section">
        <span class="toolbar-label">Rows:</span>
        <button
          class="toolbar-button"
          (click)="addRowClick.emit()"
          title="Add Row (Ctrl+Shift+=)"
        >
          <span class="icon">+</span> Add Row
        </button>
        <button
          class="toolbar-button"
          (click)="deleteRowClick.emit()"
          title="Delete Selected Row (Ctrl+Shift+-)"
        >
          <span class="icon">−</span> Delete Row
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-section">
        <span class="toolbar-label">Columns:</span>
        <button
          class="toolbar-button"
          (click)="addColumnClick.emit()"
          title="Add Column (Ctrl+Alt+=)"
        >
          <span class="icon">+</span> Add Column
        </button>
        <button
          class="toolbar-button"
          (click)="deleteColumnClick.emit()"
          title="Delete Selected Column (Ctrl+Alt+-)"
        >
          <span class="icon">−</span> Delete Column
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-section">
        <button
          class="toolbar-button"
          (click)="undoClick.emit()"
          [disabled]="!canUndo"
          title="Undo (Ctrl+Z)"
        >
          <span class="icon">↶</span> Undo
        </button>
        <button
          class="toolbar-button"
          (click)="redoClick.emit()"
          [disabled]="!canRedo"
          title="Redo (Ctrl+Y)"
        >
          <span class="icon">↷</span> Redo
        </button>
      </div>
    </div>
  `,
  styles: [`
    .toolbar {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      background: #f8f9fa;
      border-bottom: 1px solid #dee2e6;
      gap: 12px;
      flex-wrap: wrap;
    }

    .toolbar-section {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .toolbar-label {
      font-size: 12px;
      font-weight: 600;
      color: #495057;
      margin-right: 4px;
    }

    .toolbar-divider {
      width: 1px;
      height: 24px;
      background: #dee2e6;
    }

    .toolbar-button {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      font-size: 13px;
      background: white;
      border: 1px solid #ced4da;
      border-radius: 4px;
      cursor: pointer;
      color: #495057;
      transition: all 0.15s ease;
    }

    .toolbar-button:hover:not(:disabled) {
      background: #e9ecef;
      border-color: #adb5bd;
    }

    .toolbar-button:active:not(:disabled) {
      background: #dee2e6;
      transform: translateY(1px);
    }

    .toolbar-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .toolbar-button .icon {
      font-size: 16px;
      font-weight: bold;
      line-height: 1;
    }

    @media (max-width: 768px) {
      .toolbar {
        padding: 6px 8px;
      }

      .toolbar-button {
        padding: 4px 8px;
        font-size: 12px;
      }

      .toolbar-label {
        display: none;
      }
    }
  `],
})
export class SpreadsheetToolbarComponent {
  @Output() addRowClick = new EventEmitter<void>();
  @Output() deleteRowClick = new EventEmitter<void>();
  @Output() addColumnClick = new EventEmitter<void>();
  @Output() deleteColumnClick = new EventEmitter<void>();
  @Output() undoClick = new EventEmitter<void>();
  @Output() redoClick = new EventEmitter<void>();

  canUndo = true;
  canRedo = true;
}
