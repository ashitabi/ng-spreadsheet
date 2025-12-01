# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.2] - 2025-12-01

### Added
- **VLOOKUP function**: Vertical lookup function with exact and approximate match support
  - Syntax: `VLOOKUP(lookup_value, table_array, col_index_num, [range_lookup])`
  - Supports both exact match (range_lookup = FALSE/0) and approximate match (range_lookup = TRUE/1)
  - Handles numeric and string comparisons
  - Evaluates formulas within lookup tables
  - Added to formula autocomplete suggestions

## [0.1.0] - 2025-11-21

### Added

#### Core Spreadsheet Functionality
- Virtual scrolling for 10,000+ rows using Angular CDK
- Cell selection (single cell and range selection with mouse drag and Shift+click)
- Cell editing (double-click or F2 to edit)
- Keyboard navigation (Arrow keys, Tab, Enter, Shift+Tab)
- Interactive row and column headers (A, B, C... and 1, 2, 3...)
- Column resizing via drag
- Row resizing via drag
- Context menu with Cut, Copy, Paste, Delete, Insert/Delete Row/Column
- Fill handle for Excel-like drag-to-fill
- Undo/Redo support (Ctrl+Z, Ctrl+Y) with up to 100 actions
- Copy/Paste functionality (Ctrl+C, Ctrl+V) with TSV format

#### Formula Engine (23 Functions)
- Mathematical functions: SUM, AVERAGE, COUNT, MIN, MAX, PRODUCT
- Statistical functions: COUNTA, COUNTBLANK, MEDIAN, MODE, STDEV, VAR, CORREL, PERCENTILE, QUARTILE, RANK
- Logical functions: IF, IFS, IFERROR, IFNA, AND, OR, NOT
- Cell references (A1, B2) and range support (A1:B10)
- Formula autocomplete with function suggestions
- Parameter hints showing function syntax
- Automatic recalculation when dependencies change
- Circular reference detection

#### Excel-like Ribbon Interface
- Font formatting (family, size, bold, italic, underline)
- Text and background color pickers
- Number formatting (General, Number, Currency, Accounting, Percentage, Date, Time)
- Decimal place controls (increase/decrease)
- Horizontal alignment (left, center, right)
- Vertical alignment (top, middle, bottom)
- Word wrap toggle
- Merge & Center cells
- Cell borders (all, outline, top, bottom, left, right, none)
- Sort ascending/descending
- Filter toggle
- Search/Find functionality
- Clear options (all, contents, formats)
- Format Painter
- Professional SVG icons (no emoji dependencies)

#### Developer Experience
- Built with Angular 20+ and TypeScript
- Standalone component architecture
- Full TypeScript type definitions
- RxJS-based reactive state management
- Comprehensive API documentation
- OnPush change detection for performance
- Extensive keyboard shortcuts support

### Technical Details
- Package name: `ng-spreadsheet`
- License: MIT
- Peer dependencies: Angular 20+, Angular CDK 20+
- Browser support: Chrome, Firefox, Safari, Edge (latest versions)

### Known Limitations
- Paste Special (values, formats, formulas) - coming soon
- Excel (.xlsx) import/export - planned for future release
- Multiple sheet tabs - planned for future release
- Additional lookup formulas (HLOOKUP, INDEX, MATCH) - planned for future release

[0.1.0]: https://github.com/ashitabi/ng-spreadsheet/releases/tag/v0.1.0
