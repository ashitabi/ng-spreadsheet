import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { SpreadsheetRibbonComponent, RibbonAction } from './spreadsheet-ribbon.component';
import { signal } from '@angular/core';

describe('SpreadsheetRibbonComponent', () => {
  let component: SpreadsheetRibbonComponent;
  let fixture: ComponentFixture<SpreadsheetRibbonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpreadsheetRibbonComponent, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(SpreadsheetRibbonComponent);
    component = fixture.componentInstance;

    // Set up required input
    fixture.componentRef.setInput('currentStyle', signal({
      fontFamily: 'Arial',
      fontSize: '12px',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      color: '#000000',
      backgroundColor: '#FFFFFF',
      textAlign: 'left',
      verticalAlign: 'middle',
      whiteSpace: 'nowrap'
    }));

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Clipboard Actions', () => {
    it('should emit cut action', () => {
      spyOn(component.ribbonAction, 'emit');
      component.cut();
      expect(component.ribbonAction.emit).toHaveBeenCalledWith({
        type: 'clipboard',
        action: 'cut',
        value: true
      });
    });

    it('should emit copy action', () => {
      spyOn(component.ribbonAction, 'emit');
      component.copy();
      expect(component.ribbonAction.emit).toHaveBeenCalledWith({
        type: 'clipboard',
        action: 'copy',
        value: true
      });
    });

    it('should emit paste action', () => {
      spyOn(component.ribbonAction, 'emit');
      component.paste();
      expect(component.ribbonAction.emit).toHaveBeenCalledWith({
        type: 'clipboard',
        action: 'paste',
        value: true
      });
    });
  });

  describe('Font Formatting', () => {
    it('should emit font family change', () => {
      spyOn(component.ribbonAction, 'emit');
      const event = { target: { value: 'Calibri' } } as any;
      component.onFontFamilyChange(event);
      expect(component.ribbonAction.emit).toHaveBeenCalledWith({
        type: 'font',
        action: 'fontFamily',
        value: 'Calibri'
      });
    });

    it('should emit font size change', () => {
      spyOn(component.ribbonAction, 'emit');
      const event = { target: { value: '16px' } } as any;
      component.onFontSizeChange(event);
      expect(component.ribbonAction.emit).toHaveBeenCalledWith({
        type: 'font',
        action: 'fontSize',
        value: '16px'
      });
    });

    it('should toggle bold', () => {
      spyOn(component.ribbonAction, 'emit');
      component.toggleBold();
      expect(component.ribbonAction.emit).toHaveBeenCalledWith({
        type: 'font',
        action: 'fontWeight',
        value: 'bold'
      });
    });

    it('should toggle italic', () => {
      spyOn(component.ribbonAction, 'emit');
      component.toggleItalic();
      expect(component.ribbonAction.emit).toHaveBeenCalledWith({
        type: 'font',
        action: 'fontStyle',
        value: 'italic'
      });
    });

    it('should toggle underline', () => {
      spyOn(component.ribbonAction, 'emit');
      component.toggleUnderline();
      expect(component.ribbonAction.emit).toHaveBeenCalledWith({
        type: 'font',
        action: 'textDecoration',
        value: 'underline'
      });
    });

    it('should emit text color change', () => {
      spyOn(component.ribbonAction, 'emit');
      const event = { target: { value: '#ff0000' } } as any;
      component.onTextColorChange(event);
      expect(component.ribbonAction.emit).toHaveBeenCalledWith({
        type: 'font',
        action: 'color',
        value: '#ff0000'
      });
    });

    it('should emit background color change', () => {
      spyOn(component.ribbonAction, 'emit');
      const event = { target: { value: '#00ff00' } } as any;
      component.onBackgroundColorChange(event);
      expect(component.ribbonAction.emit).toHaveBeenCalledWith({
        type: 'font',
        action: 'backgroundColor',
        value: '#00ff00'
      });
    });
  });

  describe('Borders', () => {
    it('should toggle borders dropdown', () => {
      expect(component.showBordersDropdown).toBe(false);
      component.toggleBordersDropdown();
      expect(component.showBordersDropdown).toBe(true);
      component.toggleBordersDropdown();
      expect(component.showBordersDropdown).toBe(false);
    });

    it('should apply border and close dropdown', () => {
      spyOn(component.ribbonAction, 'emit');
      component.showBordersDropdown = true;

      component.applyBorder('all');

      expect(component.ribbonAction.emit).toHaveBeenCalledWith({
        type: 'border',
        action: 'all',
        value: true
      });
      expect(component.showBordersDropdown).toBe(false);
    });

    it('should apply different border types', () => {
      spyOn(component.ribbonAction, 'emit');

      const borderTypes = ['all', 'outline', 'top', 'bottom', 'left', 'right', 'none'];

      borderTypes.forEach(type => {
        component.applyBorder(type);
        expect(component.ribbonAction.emit).toHaveBeenCalledWith({
          type: 'border',
          action: type,
          value: true
        });
      });
    });
  });

  describe('Alignment', () => {
    it('should set text alignment', () => {
      spyOn(component.ribbonAction, 'emit');

      component.setTextAlign('center');
      expect(component.ribbonAction.emit).toHaveBeenCalledWith({
        type: 'alignment',
        action: 'textAlign',
        value: 'center'
      });
    });

    it('should set vertical alignment', () => {
      spyOn(component.ribbonAction, 'emit');

      component.setVerticalAlign('top');
      expect(component.ribbonAction.emit).toHaveBeenCalledWith({
        type: 'alignment',
        action: 'verticalAlign',
        value: 'top'
      });
    });

    it('should toggle wrap text', () => {
      spyOn(component.ribbonAction, 'emit');
      component.toggleWrapText();
      expect(component.ribbonAction.emit).toHaveBeenCalledWith({
        type: 'alignment',
        action: 'whiteSpace',
        value: 'normal'
      });
    });

    it('should trigger merge and center', () => {
      spyOn(component.ribbonAction, 'emit');
      component.mergeAndCenter();
      expect(component.ribbonAction.emit).toHaveBeenCalledWith({
        type: 'merge',
        action: 'mergeAndCenter',
        value: true
      });
    });
  });

  describe('Number Formatting', () => {
    it('should emit number format change', () => {
      spyOn(component.ribbonAction, 'emit');
      const event = { target: { value: 'currency' } } as any;
      component.onNumberFormatChange(event);
      expect(component.ribbonAction.emit).toHaveBeenCalledWith({
        type: 'format',
        action: 'numberFormat',
        value: 'currency'
      });
    });

    it('should increase decimals', () => {
      spyOn(component.ribbonAction, 'emit');
      component.increaseDecimals();
      expect(component.ribbonAction.emit).toHaveBeenCalledWith({
        type: 'format',
        action: 'decimalPlaces',
        value: 3 // Default 2 + 1
      });
    });

    it('should decrease decimals', () => {
      spyOn(component.ribbonAction, 'emit');
      component.decreaseDecimals();
      expect(component.ribbonAction.emit).toHaveBeenCalledWith({
        type: 'format',
        action: 'decimalPlaces',
        value: 1 // Default 2 - 1
      });
    });

    it('should decrease decimals', () => {
      spyOn(component.ribbonAction, 'emit');

      component.decreaseDecimals();

      // Should emit decreased value (default 2 -> 1)
      expect(component.ribbonAction.emit).toHaveBeenCalledWith({
        type: 'format',
        action: 'decimalPlaces',
        value: 1
      });
    });
  });

  describe('Format Painter', () => {
    it('should toggle format painter', () => {
      spyOn(component.ribbonAction, 'emit');
      expect(component.formatPainterActive).toBe(false);

      component.toggleFormatPainter();

      expect(component.formatPainterActive).toBe(true);
      expect(component.ribbonAction.emit).toHaveBeenCalledWith({
        type: 'formatPainter',
        action: 'toggle',
        value: true
      });
    });

    it('should deactivate format painter on second toggle', () => {
      component.formatPainterActive = true;
      spyOn(component.ribbonAction, 'emit');

      component.toggleFormatPainter();

      expect(component.formatPainterActive).toBe(false);
      expect(component.ribbonAction.emit).toHaveBeenCalledWith({
        type: 'formatPainter',
        action: 'toggle',
        value: false
      });
    });
  });

  describe('Clear Operations', () => {
    it('should toggle clear dropdown', () => {
      expect(component.showClearDropdown).toBe(false);
      component.toggleClearDropdown();
      expect(component.showClearDropdown).toBe(true);
    });

    it('should clear all and close dropdown', () => {
      spyOn(component.ribbonAction, 'emit');
      component.showClearDropdown = true;

      component.clearAll();

      expect(component.ribbonAction.emit).toHaveBeenCalledWith({
        type: 'clear',
        action: 'all',
        value: true
      });
      expect(component.showClearDropdown).toBe(false);
    });

    it('should clear contents only', () => {
      spyOn(component.ribbonAction, 'emit');
      component.clearContents();
      expect(component.ribbonAction.emit).toHaveBeenCalledWith({
        type: 'clear',
        action: 'contents',
        value: true
      });
    });

    it('should clear formats only', () => {
      spyOn(component.ribbonAction, 'emit');
      component.clearFormats();
      expect(component.ribbonAction.emit).toHaveBeenCalledWith({
        type: 'clear',
        action: 'formats',
        value: true
      });
    });
  });

  describe('Sort and Filter', () => {
    it('should emit sort ascending action', () => {
      spyOn(component.ribbonAction, 'emit');
      component.sortAscending();
      expect(component.ribbonAction.emit).toHaveBeenCalledWith({
        type: 'sort',
        action: 'ascending',
        value: true
      });
    });

    it('should emit sort descending action', () => {
      spyOn(component.ribbonAction, 'emit');
      component.sortDescending();
      expect(component.ribbonAction.emit).toHaveBeenCalledWith({
        type: 'sort',
        action: 'descending',
        value: true
      });
    });

    it('should emit filter toggle action', () => {
      spyOn(component.ribbonAction, 'emit');
      component.toggleFilter();
      expect(component.ribbonAction.emit).toHaveBeenCalledWith({
        type: 'filter',
        action: 'toggle',
        value: true
      });
    });
  });

  describe('Search', () => {
    it('should emit search action when search text is provided', () => {
      spyOn(component.ribbonAction, 'emit');
      component.searchText = 'test search';
      component.search();
      expect(component.ribbonAction.emit).toHaveBeenCalledWith({
        type: 'search',
        action: 'find',
        value: 'test search'
      });
    });

    it('should not emit search action when search text is empty', () => {
      spyOn(component.ribbonAction, 'emit');
      component.searchText = '';
      component.search();
      expect(component.ribbonAction.emit).not.toHaveBeenCalled();
    });

    it('should trim search text', () => {
      spyOn(component.ribbonAction, 'emit');
      component.searchText = '  test search  ';
      component.search();
      expect(component.ribbonAction.emit).toHaveBeenCalledWith({
        type: 'search',
        action: 'find',
        value: 'test search'
      });
    });
  });

  describe('Dropdown Management', () => {
    it('should close other dropdowns when opening one', () => {
      component.showBordersDropdown = true;
      component.toggleClearDropdown();
      expect(component.showBordersDropdown).toBe(false);
      expect(component.showClearDropdown).toBe(true);
    });

    it('should close dropdowns on document click outside', () => {
      component.showBordersDropdown = true;
      component.showClearDropdown = true;

      const event = new MouseEvent('click');
      const target = document.createElement('div');
      Object.defineProperty(event, 'target', { value: target, enumerable: true });

      component.onDocumentClick(event);

      expect(component.showBordersDropdown).toBe(false);
      expect(component.showClearDropdown).toBe(false);
    });

    it('should not close dropdowns on click inside dropdown', () => {
      component.showBordersDropdown = true;

      const event = new MouseEvent('click');
      const target = document.createElement('div');
      target.className = 'ribbon-dropdown';
      Object.defineProperty(event, 'target', { value: target, enumerable: true });

      component.onDocumentClick(event);

      expect(component.showBordersDropdown).toBe(true);
    });
  });

  describe('Style Detection', () => {
    it('should detect underline in text decoration', () => {
      // Test with default setup (textDecoration: 'none')
      expect(component.hasUnderline()).toBe(false);
    });

    it('should get font size value', () => {
      // Test with default setup (fontSize: '12px')
      expect(component.getFontSizeValue()).toBe('12px');
    });
  });
});
