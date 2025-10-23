# Value Mapper Implementation

## Overview
Value Mapper is a new block type that enables cell-level value lookups per column (e.g., 'NL' → 'Nederland'). The output is a dataset with replaced values and metadata about applied mappings.

## Features

### User Interface
- **Toolbox Icon**: 🔄 "Value Mapper"
- **Modal Interface**:
  - Column selector dropdown
  - Value mapping rows (from → to)
  - Add/Remove mapping buttons (+ and ×)
  - Preview table showing first 5 rows
  - Minimalistic, clean design consistent with other blocks

### Functionality
- Select a column from input data
- Define multiple value mappings (exact match)
- Preview shows real-time data transformation
- Unmapped values remain unchanged
- Supports multiple columns with different mappings

### Data Storage
- `block.valueMap`: Structure storing mappings per column
  ```javascript
  {
    "Country": {
      "NL": "Nederland",
      "BE": "België",
      "DE": "Duitsland"
    }
  }
  ```

### Executor
`applyValueMapping(block)`:
- Reads inputData from `dataStore[inputConnection.from]`
- Creates shallow clone of rows
- Replaces cell values based on exact-match mappings
- Stores result in `dataStore[block.id]` with valueMapping metadata
- Updates block content
- Calls `propagateData(block.id)`

### Serialization
- Full save/load support
- valueMap property serialized in flow JSON
- All block properties preserved during save/load

## Files Modified

### index.html
- Added valuemapper toolbox item
- Added valueMapperModal with configuration UI

### app.js
- Added renderBlock case for 'valuemapper' type
- Implemented `openValueMapperModal(block)`
- Implemented `showValueMappingsForColumn(column, existingValueMap, inputRows)`
- Implemented `createValueMappingRow(column, fromValue, toValue)`
- Implemented `attachRemoveValueMappingListeners()`
- Implemented `updateValueMapperPreview(rows, headers, valueMap)`
- Implemented `applyValueMapping(block)`
- Implemented `applyValueMappingTransformation(inputData, valueMap)`
- Updated `saveFlow()` to include valueMap property

### test-value-mapper.js (NEW)
Comprehensive test suite with 10 tests:
1. Value Mapper block exists in toolbox
2. Value Mapper modal exists in HTML
3. Value Mapper functions exist in app.js
4. Basic value mapping works correctly (NL → Nederland)
5. Unmapped values remain intact
6. DataStore update includes valueMapping metadata
7. Multiple column mappings work correctly
8. Value Mapper block type is rendered correctly
9. valueMap property is serialized in saveFlow
10. Empty value mapping produces original data

## Test Results
```
✅ Passed: 10
❌ Failed: 0
📊 Total:  10

🎉 All value mapper tests passed!
```

All existing module tests continue to pass.

## Usage Example

1. Drag "Value Mapper" block onto canvas
2. Connect an Input block to the Value Mapper
3. Double-click Value Mapper to open configuration
4. Select a column (e.g., "Country")
5. Add value mappings:
   - NL → Nederland
   - BE → België
   - DE → Duitsland
6. Click "Apply Value Mappings"
7. Values in the selected column are transformed
8. Connect to other blocks for further processing

## Design Principles
✅ Minimalistic and clean UI
✅ Consistent with existing block patterns
✅ No backend dependencies (local only)
✅ Full serialization support
✅ Comprehensive test coverage
✅ Maintains data integrity (unmapped values unchanged)
