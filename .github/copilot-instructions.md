# GitHub Copilot Instructions for Minimal ETL Modeler

## Project Overview
This is a lightweight, scalable, and minimalistic ETL (Extract, Transform, Load) modeler inspired by Alteryx Designer, specifically designed for SAP data transformation. The project is built with **vanilla JavaScript, HTML, and CSS** - no external dependencies or frameworks.

## Core Principles

### 1. Zero Dependencies Philosophy
- **No npm packages, no frameworks** - Pure vanilla JavaScript, HTML5, and CSS3
- All functionality must be implemented using native browser APIs
- Avoid suggesting external libraries or frameworks

### 2. Browser-First Architecture
- All data processing happens **client-side** in the browser
- No backend server required for core functionality
- Uses FileReader API for local file handling
- Privacy-focused: all data stays in the user's browser

### 3. Minimalistic Design
- Clean, uncluttered UI with only essential features
- Focus on functionality over aesthetics
- Mobile-friendly and responsive design

## Code Style Guidelines

### JavaScript
- Use modern ES6+ syntax (const/let, arrow functions, template literals, destructuring)
- Prefer functional programming patterns where appropriate
- Use clear, descriptive variable and function names
- Add comments for complex logic, but keep code self-documenting
- Follow existing naming conventions:
  - camelCase for functions and variables
  - PascalCase for constructor functions/classes
  - UPPER_SNAKE_CASE for constants

### HTML
- Use semantic HTML5 elements
- Keep structure clean and accessible
- Use data attributes for storing metadata on elements
- Follow existing ID and class naming patterns

### CSS
- Use CSS Grid and Flexbox for layouts
- Maintain consistency with existing styles
- Keep selectors simple and specific
- Mobile-first responsive design

## Architecture Patterns

### Block-Based System
The application uses a visual block-based system where:
- Each block is a draggable component with input/output connectors
- Blocks communicate through a connection system
- Data flows from output connectors (bottom) to input connectors (top)
- Each block type has specific functionality (Data Input, Transform, Join, etc.)

### Block Types
1. **Data Input**: Load CSV files
2. **Data View**: Display data in tables
3. **Automapper**: Automatic column mapping with fuzzy matching
4. **Mapping**: Manual column mapping
5. **Transform Blocks**: Individual operations (Concatenate, Split, Case Change, Math, Regex Replace, Date Format, Expression, Copy/Rename)
6. **Join**: Merge two datasets (Inner, Left, Right, Full Outer)
7. **Output Data**: Export results as CSV

### Data Flow
```javascript
// Data flows through blocks via the executeBlock function
// Each block processes input data and passes output to connected blocks
{
  type: 'data-input',
  data: { rows: [...], headers: [...] }
}
↓
{
  type: 'transform',
  data: { rows: [...], headers: [...] }
}
```

## Key Features to Maintain

### CSV Parsing
- Support for quoted values with commas: `"value, with comma"`
- Automatic header detection
- Performance optimizations for large datasets (10,000+ rows)

### Performance Optimizations
- Automatic optimization mode for datasets ≥1,000 rows
- DocumentFragment for efficient DOM rendering
- Shallow copying for large datasets (10k+ rows)
- CSV parsing optimization for files >5MB
- Performance monitoring with visual indicators

### Data Privacy & Security
- All data processing is local (no external API calls)
- XSS protection for data display
- No tracking or analytics
- Data is cleared on page refresh

## Common Patterns

### Creating New Blocks
```javascript
function createBlock(type, x, y) {
    const block = document.createElement('div');
    block.className = 'block';
    block.dataset.type = type;
    block.dataset.id = Date.now().toString();
    // ... add connectors and content
    return block;
}
```

### Executing Block Logic
```javascript
function executeBlock(block) {
    const type = block.dataset.type;
    const inputData = getInputData(block);
    
    switch(type) {
        case 'transform':
            return performTransform(inputData, block);
        // ... other cases
    }
}
```

### CSV Export
```javascript
function exportCSV(data) {
    const csv = convertToCSV(data.rows, data.headers);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    // ... download logic
}
```

## Testing Approach
- Node.js-based tests (without browser dependencies where possible)
- Test files follow pattern: `test-*.js`
- Tests cover: mapping, automapper, transforms, joins, CSV parsing, performance
- Run individual test files with: `node test-<name>.js`

## File Organization
- `app.js` - Main application logic (8000+ lines)
- `index.html` - Main UI
- `style.css` - All styling
- `test-*.js` - Test suites
- `*.md` - Documentation
- Sample data files: `sample-data.csv`, `sample-template.csv`, etc.

## Known Limitations
- Escaped quotes within CSV values not fully supported
- Newlines within quoted CSV values not supported
- Maximum file size depends on browser memory
- Canvas can become cluttered with >50 blocks

## When Suggesting Code
1. **Check existing patterns** - Look at similar functionality in app.js
2. **Maintain vanilla JS** - Never suggest npm packages or frameworks
3. **Consider performance** - Optimize for large datasets (10k+ rows)
4. **Preserve privacy** - Keep all processing client-side
5. **Follow minimalism** - Add only essential features
6. **Test thoroughly** - Ensure changes work with existing tests

## Helpful Context
- This is a Dutch project (comments/docs can be in Dutch or English)
- Primary use case: SAP data transformation
- Target users: Data analysts and ETL developers
- Browser support: Modern browsers (Chrome, Firefox, Safari, Edge)
