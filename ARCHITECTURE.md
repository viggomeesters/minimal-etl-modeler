# Architecture Overview

## Application Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    Minimal ETL Modeler                      │
│                     (Single Page App)                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
  ┌──────────┐         ┌──────────┐         ┌──────────┐
  │   HTML   │         │   CSS    │         │    JS    │
  │ (View)   │◄────────┤ (Style)  │────────►│ (Logic)  │
  └──────────┘         └──────────┘         └──────────┘
        │                                          │
        │                                          │
        ▼                                          ▼
  ┌──────────────────────────────┐    ┌─────────────────────┐
  │  UI Components               │    │  State Management   │
  ├──────────────────────────────┤    ├─────────────────────┤
  │ • Header                     │    │ • blocks[]          │
  │ • Toolbox                    │    │ • connections[]     │
  │   - Data Input Block         │    │ • dataStore{}       │
  │   - Data View Block          │    │ • selectedBlock     │
  │   - Target Structure Block   │    │ • blockCounter      │
  │   - Automapper Block         │    └─────────────────────┘
  │   - Mapping Block            │              │
  │   - Transform Block          │              │
  │   - Output Data Block        │              │
  │   - Validation Block         │              │
  │   - Value Mapper Block       │              │
  │ • Canvas                     │              │
  │ • Modals (for each block)    │              │
  └──────────────────────────────┘              │
                                                 │
                                                 ▼
                                    ┌────────────────────────┐
                                    │  Core Functions        │
                                    ├────────────────────────┤
                                    │ • initDragAndDrop()    │
                                    │ • createBlock()        │
                                    │ • renderBlock()        │
                                    │ • deleteBlock()        │
                                    │ • addConnection()      │
                                    │ • renderConnections()  │
                                    │ • parseCSV()           │
                                    │ • displayData()        │
                                    │ • transferData()       │
                                    │ • escapeHtml()         │
                                    │ • showModal()          │
                                    │ • hideModal()          │
                                    └────────────────────────┘
```

## Component Interaction Flow

```
User Action                  System Response
───────────                  ───────────────

[Drag Block from Toolbox]
         │
         ▼
    handleDragStart()
         │
         ▼
    Store block type
         │
         ▼
[Drop on Canvas]
         │
         ▼
    handleDrop()
         │
         ▼
    createBlock(type, x, y)
         │
         ▼
    renderBlock() ────────► [Block appears on canvas]


[Double-click Data Input]
         │
         ▼
    openBlockModal()
         │
         ▼
    [File Upload Dialog]
         │
         ▼
    handleFileSelect()
         │
         ▼
    parseCSV(data)
         │
         ▼
    dataStore[blockId] = parsedData
         │
         ▼
    updateBlockContent() ──► [Block shows "X rows"]


[Connect two blocks]
         │
         ▼
    Click output connector
         │
         ▼
    startConnection()
         │
         ▼
    Drag to input connector
         │
         ▼
    addConnection(from, to)
         │
         ▼
    renderConnections() ───► [SVG line drawn]
         │
         ▼
    transferData(from, to) ─► [Data flows through]


[Double-click Data View]
         │
         ▼
    displayData(block)
         │
         ▼
    Get data from dataStore
         │
         ▼
    Generate HTML table
         │
         ▼
    Show modal ────────────► [Data displayed in table]
```

## Data Flow

```
CSV File Input
     │
     ▼
FileReader API
     │
     ▼
parseCSV()
     │
     ▼
dataStore[inputBlockId] = [{row1}, {row2}, ...]
     │
     ▼
Connection established
     │
     ▼
transferData(inputId, viewId)
     │
     ▼
dataStore[viewBlockId] = dataStore[inputBlockId]
     │
     ▼
displayData()
     │
     ▼
HTML Table rendered in modal
     │
     ▼
User sees data
```

## File Dependencies

```
index.html
    │
    ├──► style.css (for styling)
    │
    └──► app.js (for functionality)

demo.html
    │
    └──► screenshot-initial.png

example-flow.html
    │
    ├──► style.css
    │
    └──► app.js
```

## Technology Stack

```
┌─────────────────────────────────────┐
│         Browser (Client-Side)       │
├─────────────────────────────────────┤
│                                     │
│  HTML5                              │
│  ├─ Semantic markup                │
│  ├─ Drag & Drop API                │
│  └─ File API                       │
│                                     │
│  CSS3                               │
│  ├─ Flexbox layout                 │
│  ├─ Transitions & animations       │
│  └─ Media queries (responsive)     │
│                                     │
│  JavaScript (ES6+)                  │
│  ├─ DOM manipulation               │
│  ├─ Event handling                 │
│  ├─ SVG generation                 │
│  └─ Array methods (map, filter)   │
│                                     │
│  SVG                                │
│  └─ Connection lines (paths)       │
│                                     │
└─────────────────────────────────────┘

No external dependencies!
No build process required!
No frameworks!
```

## State Management Pattern

```
                  User Interaction
                         │
                         ▼
                  Event Handler
                         │
                         ▼
                  Update State
                    (blocks[],
                   connections[],
                    dataStore{})
                         │
                         ▼
                  Re-render UI
                    (if needed)
                         │
                         ▼
                   Visual Update
```

## Module Responsibilities

```
┌─────────────────────────────────────────────────┐
│              app.js Modules                     │
├─────────────────────────────────────────────────┤
│                                                 │
│  1. Initialization                              │
│     └─ initDragAndDrop(), initModals()         │
│                                                 │
│  2. Block Management                            │
│     ├─ createBlock()                           │
│     ├─ renderBlock()                           │
│     ├─ deleteBlock()                           │
│     ├─ startDragBlock()                        │
│     ├─ dragBlockMove()                         │
│     └─ stopDragBlock()                         │
│                                                 │
│  3. Connection Management                       │
│     ├─ initConnectors()                        │
│     ├─ startConnection()                       │
│     ├─ addConnection()                         │
│     ├─ renderConnections()                     │
│     └─ transferData()                          │
│                                                 │
│  4. Data Processing                             │
│     ├─ handleFileSelect()                      │
│     ├─ parseCSV()                              │
│     ├─ displayData()                           │
│     └─ updateBlockContent()                    │
│                                                 │
│  5. Modal Management                            │
│     ├─ initModals()                            │
│     └─ openBlockModal()                        │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Performance Considerations

### Data Display Optimization
- **Row Limiting**: Data View block displays only first 100 rows (configurable via `MAX_DISPLAY_ROWS` constant)
- **HTML Building**: Uses string concatenation for table generation (fast for moderate datasets)
- **Future Improvement**: Consider virtual scrolling for very large datasets (>10,000 rows)

### Connection Rendering
- **Cached Canvas Rect**: Canvas bounding box is cached once per render cycle
- **SVG Path Generation**: Uses simple 3-segment orthogonal paths for performance
- **Batch Rendering**: All connections rendered in a single SVG element
- **Early Returns**: Skips rendering if blocks or connectors are missing

### CSV Parsing
- **Quoted Value Support**: Properly handles CSV files with commas in quoted fields
- **Empty Line Skipping**: Skips empty lines to reduce processing
- **Memory Efficient**: Streams data line-by-line (no full array operations)

### DOM Query Optimization
- **Helper Functions**: Modal operations use helper functions to reduce repeated queries
- **Cached References**: Frequently accessed elements are cached where possible
- **Minimal Reflows**: Batch DOM updates when possible

## Security Considerations

### XSS Prevention
- **HTML Escaping**: All user data is escaped before display using `escapeHtml()` function
- **Sanitized Output**: File names, column headers, and cell values are sanitized
- **No Direct innerHTML**: User input never directly inserted into innerHTML without escaping

### File Handling
- **Client-Side Only**: All file processing happens in the browser (no server uploads)
- **FileReader API**: Uses standard browser FileReader API for file access
- **CSV Validation**: Basic validation during parsing (checks for headers, data structure)

### Data Privacy
- **No External Calls**: No data sent to external servers
- **Local Storage Only**: All data remains in browser memory (dataStore object)
- **No Persistence**: Data is cleared on page refresh (unless using save/load feature)

### Best Practices
1. Always validate file types before processing (should be .csv)
2. Monitor memory usage for large datasets
3. Clear dataStore periodically if processing many files
4. Consider adding Content Security Policy (CSP) headers in production

## Scalability Considerations

### Current Limits
- **File Size**: Limited by browser memory (typically ~500MB-1GB)
- **Row Display**: Shows first 100 rows in Data View
- **Block Count**: No hard limit, but canvas becomes unwieldy with >50 blocks
- **Connection Count**: SVG rendering may slow down with >100 connections

### Recommended Dataset Sizes
- **Optimal**: < 10,000 rows, < 50 columns
- **Acceptable**: 10,000 - 50,000 rows, < 100 columns
- **Limit**: 50,000+ rows (may cause browser slowdown)

### Future Enhancements
1. Virtual scrolling for large datasets
2. Pagination for data view
3. Web Workers for heavy processing
4. IndexedDB for persistent storage
5. Lazy loading of connections
