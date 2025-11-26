import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpreadsheetDataService } from '../services/spreadsheet-data.service';
import { Sheet } from '../models';

/**
 * Sheet tabs component that displays sheet tabs at the bottom of the spreadsheet.
 * Allows switching between sheets, adding new sheets, and managing sheets.
 */
@Component({
  selector: 'ngs-sheet-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sheet-tabs.component.html',
  styleUrls: ['./sheet-tabs.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SheetTabsComponent {
  protected readonly dataService = inject(SpreadsheetDataService);

  // Observable of all sheets
  readonly sheets$ = this.dataService.data$;

  /**
   * Switches to a specific sheet
   */
  onSheetClick(index: number): void {
    this.dataService.setActiveSheet(index);
  }

  /**
   * Adds a new sheet
   */
  onAddSheet(): void {
    this.dataService.addSheet();
  }

  /**
   * Deletes a sheet
   */
  onDeleteSheet(index: number, event: Event): void {
    event.stopPropagation(); // Prevent sheet selection

    // Confirm deletion
    if (confirm('Are you sure you want to delete this sheet?')) {
      this.dataService.deleteSheet(index);
    }
  }

  /**
   * Renames a sheet
   */
  onRenameSheet(index: number): void {
    const sheets = this.dataService.getSheets();
    const currentName = sheets[index]?.name || '';

    const newName = prompt('Enter new sheet name:', currentName);

    if (newName && newName !== currentName) {
      this.dataService.renameSheet(index, newName);
    }
  }

  /**
   * Handles right-click context menu on sheet tab
   */
  onSheetContextMenu(index: number, event: MouseEvent): void {
    event.preventDefault();

    // Simple context menu using browser dialogs for now
    const action = confirm('Rename this sheet? (Cancel to delete)');

    if (action) {
      this.onRenameSheet(index);
    } else {
      // User cancelled rename, ask if they want to delete instead
      const shouldDelete = confirm('Delete this sheet instead?');
      if (shouldDelete) {
        this.onDeleteSheet(index, event);
      }
    }
  }

  /**
   * Tracks sheets by their ID for performance
   */
  trackBySheetId(index: number, sheet: Sheet): string {
    return sheet.id;
  }
}
