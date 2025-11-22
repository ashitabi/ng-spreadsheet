import { Component, Output, EventEmitter, input, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CellStyle } from '../models';

export interface RibbonAction {
  type: 'clipboard' | 'font' | 'format' | 'alignment' | 'sort' | 'filter' | 'search' | 'merge' | 'border' | 'clear' | 'formatPainter' | 'undo' | 'redo';
  action: string;
  value?: any;
}

@Component({
  selector: 'ngs-spreadsheet-ribbon',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="spreadsheet-ribbon">
      <!-- Clipboard Section (Excel order: 1st) -->
      <div class="ribbon-group">
        <div class="ribbon-group-label">Clipboard</div>
        <div class="ribbon-controls">
          <button class="ribbon-btn" (click)="undo()" title="Undo (Ctrl+Z)">
            <svg class="ribbon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H13"/>
            </svg>
            Undo
          </button>
          <button class="ribbon-btn" (click)="redo()" title="Redo (Ctrl+Y)">
            <svg class="ribbon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 14l5-5-5-5M20 9H9.5A5.5 5.5 0 0 0 4 14.5v0A5.5 5.5 0 0 0 9.5 20H11"/>
            </svg>
            Redo
          </button>
          <button class="ribbon-btn" (click)="paste()" title="Paste (Ctrl+V)">
            <svg class="ribbon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="8" y="4" width="8" height="4" rx="1"/>
              <path d="M8 8H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2"/>
            </svg>
            Paste
          </button>
          <button class="ribbon-btn" (click)="cut()" title="Cut (Ctrl+X)">
            <svg class="ribbon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="6" cy="6" r="3"/>
              <circle cx="6" cy="18" r="3"/>
              <path d="M20 4L8.5 15.5M8.5 8.5L20 20"/>
            </svg>
            Cut
          </button>
          <button class="ribbon-btn" (click)="copy()" title="Copy (Ctrl+C)">
            <svg class="ribbon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            Copy
          </button>
          <button class="ribbon-btn" [class.active]="formatPainterActive" (click)="toggleFormatPainter()" title="Format Painter">
            <svg class="ribbon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
              <path d="M18 14l-4 4-2-2-6 6-2-2 6-6-2-2 4-4"/>
              <path d="M10 2v4a2 2 0 0 0 2 2h4"/>
            </svg>
            Format Painter
          </button>
        </div>
      </div>

      <!-- Font Section (Excel order: 2nd) -->
      <div class="ribbon-group">
        <div class="ribbon-group-label">Font</div>
        <div class="ribbon-controls">
          <select class="ribbon-select font-family" (change)="onFontFamilyChange($event)" [value]="currentStyle().fontFamily || 'Arial'">
            <option value="Arial">Arial</option>
            <option value="Calibri">Calibri</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
            <option value="Verdana">Verdana</option>
            <option value="Georgia">Georgia</option>
          </select>

          <select class="ribbon-select font-size" (change)="onFontSizeChange($event)" [value]="getFontSizeValue()">
            <option value="10px">10</option>
            <option value="11px">11</option>
            <option value="12px">12</option>
            <option value="14px">14</option>
            <option value="16px">16</option>
            <option value="18px">18</option>
            <option value="20px">20</option>
            <option value="24px">24</option>
          </select>

          <button class="ribbon-btn" [class.active]="currentStyle().fontWeight === 'bold'" (click)="toggleBold()" title="Bold (Ctrl+B)">
            <strong>B</strong>
          </button>
          <button class="ribbon-btn" [class.active]="currentStyle().fontStyle === 'italic'" (click)="toggleItalic()" title="Italic (Ctrl+I)">
            <em>I</em>
          </button>
          <button class="ribbon-btn" [class.active]="hasUnderline()" (click)="toggleUnderline()" title="Underline (Ctrl+U)">
            <span style="text-decoration: underline;">U</span>
          </button>

          <div class="ribbon-dropdown">
            <button class="ribbon-btn" (click)="toggleBordersDropdown()" title="Borders">
              <svg class="ribbon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>
              </svg>
            </button>
            @if (showBordersDropdown) {
              <div class="ribbon-dropdown-menu" (click)="$event.stopPropagation()">
                <button class="ribbon-dropdown-item" (click)="applyBorder('all')">All Borders</button>
                <button class="ribbon-dropdown-item" (click)="applyBorder('outline')">Outline</button>
                <button class="ribbon-dropdown-item" (click)="applyBorder('top')">Top Border</button>
                <button class="ribbon-dropdown-item" (click)="applyBorder('bottom')">Bottom Border</button>
                <button class="ribbon-dropdown-item" (click)="applyBorder('left')">Left Border</button>
                <button class="ribbon-dropdown-item" (click)="applyBorder('right')">Right Border</button>
                <button class="ribbon-dropdown-item" (click)="applyBorder('none')">No Border</button>
              </div>
            }
          </div>

          <input type="color" class="ribbon-color-picker" [value]="currentStyle().backgroundColor || '#FFFFFF'" (change)="onBackgroundColorChange($event)" title="Fill Color">
          <input type="color" class="ribbon-color-picker" [value]="currentStyle().color || '#000000'" (change)="onTextColorChange($event)" title="Font Color">
        </div>
      </div>

      <!-- Alignment Section (Excel order: 3rd) -->
      <div class="ribbon-group">
        <div class="ribbon-group-label">Alignment</div>
        <div class="ribbon-controls">
          <div style="display: flex; flex-direction: column; gap: 2px;">
            <div style="display: flex; gap: 2px;">
              <button class="ribbon-btn ribbon-btn-small" [class.active]="currentStyle().verticalAlign === 'top'" (click)="setVerticalAlign('top')" title="Align Top">
                <svg class="ribbon-icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M8 12V6m8 6V6"/>
                </svg>
              </button>
              <button class="ribbon-btn ribbon-btn-small" [class.active]="currentStyle().verticalAlign === 'middle'" (click)="setVerticalAlign('middle')" title="Align Middle">
                <svg class="ribbon-icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 12h18M8 6v12m8-12v12"/>
                </svg>
              </button>
              <button class="ribbon-btn ribbon-btn-small" [class.active]="currentStyle().verticalAlign === 'bottom'" (click)="setVerticalAlign('bottom')" title="Align Bottom">
                <svg class="ribbon-icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 18h18M8 12v6m8-6v6"/>
                </svg>
              </button>
            </div>
            <div style="display: flex; gap: 2px;">
              <button class="ribbon-btn ribbon-btn-small" [class.active]="currentStyle().textAlign === 'left'" (click)="setTextAlign('left')" title="Align Left">
                <svg class="ribbon-icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h12M3 12h18M3 18h12"/>
                </svg>
              </button>
              <button class="ribbon-btn ribbon-btn-small" [class.active]="currentStyle().textAlign === 'center'" (click)="setTextAlign('center')" title="Align Center">
                <svg class="ribbon-icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 6h12M3 12h18M6 18h12"/>
                </svg>
              </button>
              <button class="ribbon-btn ribbon-btn-small" [class.active]="currentStyle().textAlign === 'right'" (click)="setTextAlign('right')" title="Align Right">
                <svg class="ribbon-icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 6h12M3 12h18M9 18h12"/>
                </svg>
              </button>
            </div>
          </div>

          <button class="ribbon-btn" [class.active]="currentStyle().whiteSpace === 'normal'" (click)="toggleWrapText()" title="Wrap Text">
            <svg class="ribbon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M3 12h15a3 3 0 0 1 0 6h-3m0 0l2-2m-2 2l2 2M3 18h7"/>
            </svg>
          </button>
          <button class="ribbon-btn" (click)="mergeAndCenter()" title="Merge & Center">
            <svg class="ribbon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M12 8v8m-4-4h8"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Number Format Section (Excel order: 4th) -->
      <div class="ribbon-group">
        <div class="ribbon-group-label">Number</div>
        <div class="ribbon-controls">
          <select class="ribbon-select" (change)="onNumberFormatChange($event)" [value]="currentStyle().numberFormat || 'general'">
            <option value="general">General</option>
            <option value="number">Number</option>
            <option value="currency">Currency</option>
            <option value="accounting">Accounting</option>
            <option value="percentage">Percentage</option>
            <option value="date">Date</option>
            <option value="time">Time</option>
          </select>

          <button class="ribbon-btn" (click)="increaseDecimals()" title="Increase Decimal Places">.0+</button>
          <button class="ribbon-btn" (click)="decreaseDecimals()" title="Decrease Decimal Places">.0-</button>
        </div>
      </div>

      <!-- Editing Section (Excel order: 7th - combines Sort, Filter, Find) -->
      <div class="ribbon-group">
        <div class="ribbon-group-label">Editing</div>
        <div class="ribbon-controls">
          <button class="ribbon-btn" (click)="sortAscending()" title="Sort Ascending">
            <svg class="ribbon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 11V5m0 0L8 8m3-3l3 3M3 15h8m-8 4h12"/>
            </svg>
            A-Z
          </button>
          <button class="ribbon-btn" (click)="sortDescending()" title="Sort Descending">
            <svg class="ribbon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 5v6m0 0l-3-3m3 3l3-3M3 15h12m-12 4h8"/>
            </svg>
            Z-A
          </button>
          <button class="ribbon-btn" (click)="toggleFilter()" title="Filter">
            <svg class="ribbon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18l-7 8v6l-4 2v-8L3 6z"/>
            </svg>
            Filter
          </button>
          <input type="text" class="ribbon-search" placeholder="Find..." [(ngModel)]="searchText" (keyup.enter)="search()">
          <button class="ribbon-btn" (click)="search()" title="Find">
            <svg class="ribbon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
          <div class="ribbon-dropdown">
            <button class="ribbon-btn" (click)="toggleClearDropdown()" title="Clear">
              <svg class="ribbon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14"/>
              </svg>
              Clear
            </button>
            @if (showClearDropdown) {
              <div class="ribbon-dropdown-menu" (click)="$event.stopPropagation()">
                <button class="ribbon-dropdown-item" (click)="clearAll()">Clear All</button>
                <button class="ribbon-dropdown-item" (click)="clearContents()">Clear Contents</button>
                <button class="ribbon-dropdown-item" (click)="clearFormats()">Clear Formats</button>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .spreadsheet-ribbon {
      display: flex;
      gap: 12px;
      padding: 8px 12px;
      background: #f3f3f3;
      border-bottom: 1px solid #d4d4d4;
      flex-wrap: wrap;
      align-items: flex-start;
    }

    .ribbon-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .ribbon-group-label {
      font-size: 9px;
      color: #666;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .ribbon-controls {
      display: flex;
      gap: 4px;
      align-items: center;
    }

    .ribbon-btn {
      padding: 4px 8px;
      border: 1px solid #d4d4d4;
      background: #fff;
      cursor: pointer;
      font-size: 14px;
      border-radius: 2px;
      min-width: 32px;
      height: 28px;
      transition: all 0.2s;
    }

    .ribbon-btn:hover {
      background: #e8e8e8;
      border-color: #217346;
    }

    .ribbon-btn.active {
      background: #217346;
      color: #fff;
      border-color: #217346;
    }

    .ribbon-icon {
      width: 16px;
      height: 16px;
      display: inline-block;
      vertical-align: middle;
      margin-right: 4px;
    }

    .ribbon-icon-small {
      width: 14px;
      height: 14px;
      display: inline-block;
      vertical-align: middle;
    }

    .ribbon-select {
      padding: 4px 8px;
      border: 1px solid #d4d4d4;
      background: #fff;
      cursor: pointer;
      font-size: 11px;
      border-radius: 2px;
      height: 28px;
    }

    .ribbon-select.font-family {
      width: 120px;
    }

    .ribbon-select.font-size {
      width: 60px;
    }

    .ribbon-color-picker {
      width: 32px;
      height: 28px;
      border: 1px solid #d4d4d4;
      cursor: pointer;
      border-radius: 2px;
    }

    .ribbon-search {
      padding: 4px 8px;
      border: 1px solid #d4d4d4;
      font-size: 11px;
      border-radius: 2px;
      height: 28px;
      width: 150px;
    }

    .ribbon-search:focus {
      outline: none;
      border-color: #217346;
    }

    .ribbon-btn-small {
      min-width: 24px;
      height: 24px;
      padding: 2px 4px;
      font-size: 12px;
    }

    .ribbon-dropdown {
      position: relative;
      display: inline-block;
    }

    .ribbon-dropdown-menu {
      position: absolute;
      top: 100%;
      left: 0;
      background: #fff;
      border: 1px solid #d4d4d4;
      border-radius: 2px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      z-index: 1000;
      min-width: 150px;
      margin-top: 2px;
    }

    .ribbon-dropdown-item {
      display: block;
      width: 100%;
      padding: 8px 12px;
      border: none;
      background: #fff;
      text-align: left;
      cursor: pointer;
      font-size: 12px;
      transition: background 0.2s;
    }

    .ribbon-dropdown-item:hover {
      background: #f0f0f0;
    }
  `]
})
export class SpreadsheetRibbonComponent {
  currentStyle = input.required<Partial<CellStyle>>();

  @Output() ribbonAction = new EventEmitter<RibbonAction>();

  searchText = '';
  showBordersDropdown = false;
  showClearDropdown = false;
  formatPainterActive = false;

  getFontSizeValue(): string {
    const size = this.currentStyle().fontSize || '12px';
    return size;
  }

  onFontFamilyChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.emitAction('font', 'fontFamily', select.value);
  }

  onFontSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.emitAction('font', 'fontSize', select.value);
  }

  toggleBold(): void {
    const isBold = this.currentStyle().fontWeight === 'bold';
    this.emitAction('font', 'fontWeight', isBold ? 'normal' : 'bold');
  }

  toggleItalic(): void {
    const isItalic = this.currentStyle().fontStyle === 'italic';
    this.emitAction('font', 'fontStyle', isItalic ? 'normal' : 'italic');
  }

  hasUnderline(): boolean {
    return this.currentStyle().textDecoration?.includes('underline') ?? false;
  }

  toggleUnderline(): void {
    const hasUnderline = this.hasUnderline();
    this.emitAction('font', 'textDecoration', hasUnderline ? 'none' : 'underline');
  }

  onTextColorChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.emitAction('font', 'color', input.value);
  }

  onBackgroundColorChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.emitAction('font', 'backgroundColor', input.value);
  }

  onNumberFormatChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.emitAction('format', 'numberFormat', select.value);
  }

  increaseDecimals(): void {
    const current = this.currentStyle().decimalPlaces ?? 2;
    this.emitAction('format', 'decimalPlaces', current + 1);
  }

  decreaseDecimals(): void {
    const current = this.currentStyle().decimalPlaces ?? 2;
    this.emitAction('format', 'decimalPlaces', Math.max(0, current - 1));
  }

  setTextAlign(align: 'left' | 'center' | 'right'): void {
    this.emitAction('alignment', 'textAlign', align);
  }

  setVerticalAlign(align: 'top' | 'middle' | 'bottom'): void {
    this.emitAction('alignment', 'verticalAlign', align);
  }

  toggleWrapText(): void {
    const isWrapped = this.currentStyle().whiteSpace === 'normal';
    this.emitAction('alignment', 'whiteSpace', isWrapped ? 'nowrap' : 'normal');
  }

  mergeAndCenter(): void {
    this.emitAction('merge', 'mergeAndCenter', true);
  }

  toggleBordersDropdown(): void {
    this.showBordersDropdown = !this.showBordersDropdown;
    this.showClearDropdown = false;
  }

  applyBorder(type: string): void {
    this.emitAction('border', type, true);
    this.showBordersDropdown = false;
  }

  toggleFormatPainter(): void {
    this.formatPainterActive = !this.formatPainterActive;
    this.emitAction('formatPainter', 'toggle', this.formatPainterActive);
  }

  toggleClearDropdown(): void {
    this.showClearDropdown = !this.showClearDropdown;
    this.showBordersDropdown = false;
  }

  clearAll(): void {
    this.emitAction('clear', 'all', true);
    this.showClearDropdown = false;
  }

  clearContents(): void {
    this.emitAction('clear', 'contents', true);
    this.showClearDropdown = false;
  }

  clearFormats(): void {
    this.emitAction('clear', 'formats', true);
    this.showClearDropdown = false;
  }

  sortAscending(): void {
    this.emitAction('sort', 'ascending', true);
  }

  sortDescending(): void {
    this.emitAction('sort', 'descending', true);
  }

  cut(): void {
    this.emitAction('clipboard', 'cut', true);
  }

  copy(): void {
    this.emitAction('clipboard', 'copy', true);
  }

  paste(): void {
    this.emitAction('clipboard', 'paste', true);
  }

  undo(): void {
    this.emitAction('undo', 'undo', true);
  }

  redo(): void {
    this.emitAction('redo', 'redo', true);
  }

  toggleFilter(): void {
    this.emitAction('filter', 'toggle', true);
  }

  search(): void {
    if (this.searchText.trim()) {
      this.emitAction('search', 'find', this.searchText.trim());
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.ribbon-dropdown')) {
      this.showBordersDropdown = false;
      this.showClearDropdown = false;
    }
  }

  private emitAction(type: RibbonAction['type'], action: string, value?: any): void {
    this.ribbonAction.emit({ type, action, value });
  }
}
