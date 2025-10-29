# GitHub Copilot Context for Minimal ETL Modeler

## Quick Reference

### Tech Stack
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **No Framework**: Pure browser APIs only
- **Testing**: Node.js for test execution
- **Data Format**: CSV files
- **Target**: Modern browsers (Chrome, Firefox, Safari, Edge)

### Key Files
- `app.js` (8000+ lines) - All application logic
- `index.html` - Main UI structure
- `style.css` - All styling
- `test-*.js` - Test suites

## Global State Variables

```javascript
// Main state (defined in app.js)
let blocks = [];              // All blocks on canvas
let connections = [];         // Connections between blocks
let blockCounter = 0;         // Unique ID generator
let selectedBlock = null;     // Currently selected block
let dataStore = {};           // Data storage: { blockId: { rows, headers } }
```

## Constants

```javascript
const MAX_DISPLAY_ROWS = 100;              // Limit for data preview
const SIMILARITY_THRESHOLD = 0.5;          // Fuzzy match threshold
const PARTIAL_MATCH_SCORE = 0.8;           // Partial match confidence
const EXACT_MATCH_SCORE = 1.0;             // Exact match confidence
const LARGE_DATASET_THRESHOLD = 1000;      // Performance optimization trigger
const RENDER_CONNECTIONS_THROTTLE = 16;    // 60fps throttle
```

## Block Types Reference

| Block Type | Purpose | Input | Output |
|------------|---------|-------|--------|
| `data-input` | Load CSV files | None | CSV data |
| `data-view` | Display data | CSV data | Same data |
| `target-structure` | Load template | None | Template structure |
| `automapper` | Auto-map columns | Input + Template | Mappings |
| `mapping` | Manual mapping | CSV data | Mapped data |
| `transform-*` | Various transforms | CSV data | Transformed data |
| `join` | Merge datasets | 2 CSV datasets | Joined data |
| `output-data` | Export CSV | CSV data | Download |
| `validation` | Validate data | CSV data | Validation report |
| `value-mapper` | Value transformations | CSV data | Mapped values |

### Transform Block Types
- `concatenate` - Join columns with delimiter
- `split` - Split column on delimiter
- `case-change` - Upper/lower/capitalize
- `math` - Mathematical operations
- `regex-replace` - Pattern-based replacement
- `date-format` - Date parsing/formatting
- `expression` - Evaluate expressions
- `copy-rename` - Copy/rename columns

## Data Structure

### CSV Data Format
```javascript
{
  rows: [
    ['value1', 'value2', 'value3'],  // First row
    ['value4', 'value5', 'value6']   // Second row
  ],
  headers: ['Column1', 'Column2', 'Column3']
}
```

### Block Structure (DOM)
```javascript
<div class="block" 
     data-type="data-input" 
     data-id="1234567890"
     style="left: 100px; top: 100px;">
  <div class="connector input"></div>    <!-- Top connector -->
  <div class="block-header">
    <span class="block-icon">📥</span>
    <span class="block-title">Data Input</span>
  </div>
  <div class="block-content">...</div>
  <div class="connector output"></div>   <!-- Bottom connector -->
</div>
```

### Connection Structure
```javascript
{
  from: blockId,        // Source block ID
  to: blockId,          // Target block ID
  fromElement: element, // Source block DOM element
  toElement: element    // Target block DOM element
}
```

## Common Functions

### Block Management
```javascript
createBlock(type, x, y)           // Create new block
deleteBlock(blockId)              // Remove block
openBlockModal(blockId)           // Open block configuration
getInputData(block)               // Get data from connected input blocks
```

### Data Processing
```javascript
parseCSV(csvText)                 // Parse CSV string to object
displayData(data, containerId)    // Render data table
transferData(fromBlock, toBlock)  // Transfer data between blocks
exportToCSV(data, filename)       // Export data as CSV file
```

### Connection Management
```javascript
addConnection(from, to)           // Create connection
removeConnection(from, to)        // Delete connection
renderConnections()               // Redraw all connections
```

### Utility Functions
```javascript
escapeHtml(text)                  // XSS protection
measurePerformance(name, fn)      // Performance monitoring
normalizeColumnName(name)         // Normalize for comparison
calculateSimilarity(str1, str2)   // Fuzzy string matching
```

## CSV Parsing Details

### Supported Features
- Comma-separated values
- Quoted values with commas: `"value, with comma"`
- Header row detection
- UTF-8 encoding
- Empty cells
- Whitespace trimming (optional)

### Not Supported (Known Limitations)
- Escaped quotes within values: `"value with ""quotes"""`
- Newlines within quoted values
- Non-comma delimiters (must be comma)

### Parser Implementation
```javascript
function parseCSV(csvText) {
  // Performance optimization for large files
  const isLargeFile = csvText.length > 5 * 1024 * 1024; // >5MB
  
  // Split into lines
  const lines = csvText.split(/\r?\n/);
  
  // Parse headers
  const headers = parseLine(lines[0]);
  
  // Parse rows
  const rows = lines.slice(1)
    .filter(line => line.trim())
    .map(line => parseLine(line));
  
  return { headers, rows };
}
```

## Performance Optimization

### Automatic Optimizations (≥1000 rows)
1. **DocumentFragment** for DOM rendering
2. **Shallow copying** for large datasets (≥10k rows)
3. **Throttled connection rendering** (60fps)
4. **CSV parsing optimization** for files >5MB
5. **Performance monitoring** with console warnings

### Visual Indicators
- 🚀 icon shown when optimizations are active
- Console logs for operation timings
- Warnings for operations >1000ms

## Block Connection Flow

```
User clicks output connector (⚪)
          ↓
drawTemporaryLine() - Visual feedback
          ↓
User drags to target input connector
          ↓
validateConnection() - Check if valid
          ↓
addConnection() - Store connection
          ↓
renderConnections() - Draw curved line
          ↓
transferData() - Pass data from source to target
```

## Modal System

Each block type has a corresponding modal:
- `data-input-modal`
- `data-view-modal`
- `automapper-modal`
- `mapping-modal`
- `transform-*-modal`
- etc.

### Modal Lifecycle
```javascript
openBlockModal(blockId)
  ↓
Populate modal with block data
  ↓
User interacts (upload file, configure, etc.)
  ↓
Update block state and dataStore
  ↓
closeModal()
```

## Automapper Algorithm

### 3-Level Matching System
1. **Exact Match** (score: 1.0)
   - Normalized names are identical
   - Example: "Material_Number" ↔ "materialnumber"

2. **Partial Match** (score: 0.8)
   - One name contains the other
   - Example: "Material" ↔ "MaterialNumber"

3. **Fuzzy Match** (score: 0.0-1.0)
   - Character-based similarity calculation
   - Threshold: 0.5 minimum
   - Uses Levenshtein-like distance

### Normalization
```javascript
function normalizeColumnName(name) {
  return name
    .toLowerCase()
    .replace(/[_\s-]/g, '')  // Remove separators
    .trim();
}
```

## Testing Patterns

### Test File Structure
```javascript
// Import or inline the functions to test
// For browser-specific code, use Node.js compatible mocks

// Test counter
let passed = 0, failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.error(`✗ ${name}: ${error.message}`);
    failed++;
  }
}

// Run tests
test('Test name', () => {
  // Assertions using basic comparisons
  if (result !== expected) {
    throw new Error(`Expected ${expected}, got ${result}`);
  }
});

// Summary
console.log(`\nTests: ${passed} passed, ${failed} failed`);
```

## Common Development Tasks

### Adding a New Transform Block
1. Add block type to toolbox in `index.html`
2. Create modal in `index.html`
3. Implement transform logic in `app.js`
4. Add to `createBlock()` switch statement
5. Add to `openBlockModal()` switch statement
6. Implement `execute{BlockType}()` function
7. Add tests in new `test-{feature}.js` file

### Adding a New Test
1. Create `test-{feature}.js`
2. Copy test structure from existing test file
3. Import/inline functions to test
4. Write test cases with assertions
5. Run with `node test-{feature}.js`

### Debugging Data Flow
1. Open browser console (F12)
2. Check `dataStore` object: `console.log(dataStore)`
3. Check connections: `console.log(connections)`
4. Enable performance logs: `console.debug` statements
5. Use Data View block to inspect intermediate results

## Browser API Usage

### File Handling
```javascript
// FileReader API for local files
const reader = new FileReader();
reader.onload = (e) => {
  const csvText = e.target.result;
  // Process CSV
};
reader.readAsText(file);
```

### Canvas Drawing
```javascript
// SVG for connection lines
const svg = document.getElementById('connections-svg');
const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
path.setAttribute('d', `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`);
svg.appendChild(path);
```

### Download Files
```javascript
// Blob API for CSV export
const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = filename;
link.click();
URL.revokeObjectURL(url);
```

## Security Considerations

### XSS Prevention
Always use `escapeHtml()` when displaying user data:
```javascript
cell.textContent = value;  // Safe - uses textContent
// OR
cell.innerHTML = escapeHtml(value);  // Safe - escaped
```

### No External Requests
- Never fetch data from external URLs in production code
- All file handling via FileReader API
- No analytics or tracking calls

### Input Validation
- Validate CSV structure before processing
- Check for required headers
- Validate column references in transforms
- Handle edge cases (empty files, malformed data)

## Styling Conventions

### CSS Classes
- `.block` - Base block styling
- `.block-header` - Block title area
- `.block-content` - Block body content
- `.connector` - Input/output connector
- `.connector.input` - Top connector
- `.connector.output` - Bottom connector
- `.tool-item` - Toolbox items
- `.modal` - Modal overlays

### Responsive Design
- Mobile-friendly (min-width: 320px)
- Touch-friendly (larger touch targets on mobile)
- Responsive toolbox (stacked on mobile)
- Scrollable canvas with pan support

## Dutch/English Language Note
The project uses both Dutch and English:
- UI elements: Primarily Dutch
- Code: English (variables, functions, comments)
- Documentation: Mixed (README in Dutch, technical docs in English)
- User-facing content: Dutch

When suggesting text for UI, prefer Dutch. For code and technical documentation, prefer English.
