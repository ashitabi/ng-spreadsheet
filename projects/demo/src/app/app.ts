import { Component, inject } from '@angular/core';
import { SpreadsheetComponent, SpreadsheetData, SpreadsheetDataService } from '@ashitrai/ng-spreadsheet';

@Component({
  selector: 'app-root',
  imports: [SpreadsheetComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = 'ng-spreadsheet Demo';
  dataService = inject(SpreadsheetDataService);

  // Sample spreadsheet data
  spreadsheetData: SpreadsheetData = {
    sheets: [{
      id: 'sheet_1',
      name: 'Sales Data',
      rowCount: 1000,
      colCount: 26,
      defaultColumnWidth: 120,
      defaultRowHeight: 25,
      isActive: true,
      cells: this.generateSampleData(),
      columnWidths: Array(26).fill(120),
      rowHeights: Array(1000).fill(25),
    }],
    activeSheetIndex: 0,
    metadata: {
      title: 'Demo Spreadsheet',
      createdDate: new Date(),
      modifiedDate: new Date(),
    }
  };

  /**
   * Generates sample data for the spreadsheet
   */
  private generateSampleData(): any[][] {
    const rows = 1000;
    const cols = 26;
    const cells: any[][] = [];

    for (let row = 0; row < rows; row++) {
      cells[row] = [];
      for (let col = 0; col < cols; col++) {
        // Create header row
        if (row === 0) {
          const headers = ['Product', 'Price', 'Quantity', 'Total', 'Category', 'Date', 'Status', 'Notes'];
          cells[row][col] = {
            row,
            col,
            value: headers[col] ?? `Column ${col}`,
            displayValue: headers[col] ?? `Column ${col}`,
            dataType: 'string',
            style: {
              fontWeight: 'bold',
              backgroundColor: '#f0f0f0',
              borderBottom: '2px solid #333',
            }
          };
        }
        // Create data rows
        else {
          let value: any = '';
          let displayValue = '';
          let dataType: any = 'string';

          // Column-specific data
          switch (col) {
            case 0: // Product name
              const products = ['Apple', 'Banana', 'Orange', 'Grape', 'Mango', 'Pineapple', 'Strawberry'];
              value = products[row % products.length];
              displayValue = value;
              break;

            case 1: // Price
              value = Math.round((Math.random() * 100 + 10) * 100) / 100;
              displayValue = `$${value.toFixed(2)}`;
              dataType = 'number';
              break;

            case 2: // Quantity
              value = Math.floor(Math.random() * 50 + 1);
              displayValue = String(value);
              dataType = 'number';
              break;

            case 3: // Total (formula)
              value = `=B${row + 1}*C${row + 1}`;
              displayValue = value;
              dataType = 'formula';
              break;

            case 4: // Category
              const categories = ['Fruit', 'Vegetable', 'Dairy', 'Meat', 'Bakery'];
              value = categories[row % categories.length];
              displayValue = value;
              break;

            case 5: // Date
              const date = new Date(2024, 0, 1 + (row % 365));
              value = date.toISOString().split('T')[0];
              displayValue = value;
              break;

            case 6: // Status
              const statuses = ['Active', 'Pending', 'Completed', 'Cancelled'];
              value = statuses[row % statuses.length];
              displayValue = value;
              break;

            case 7: // Notes
              value = `Sample note for row ${row}`;
              displayValue = value;
              break;

            default:
              value = `R${row}C${col}`;
              displayValue = value;
          }

          cells[row][col] = {
            row,
            col,
            value,
            displayValue,
            dataType,
          };
        }
      }
    }

    return cells;
  }

  /**
   * Handles cell click events
   */
  onCellClick(address: any): void {
    console.log('Cell clicked:', address);
  }

  /**
   * Handles cell change events
   */
  onCellChange(event: any): void {
    console.log('Cell changed:', event);
  }

  /**
   * Handles selection change events
   */
  onSelectionChange(address: any): void {
    console.log('Selection changed:', address);
  }
}
