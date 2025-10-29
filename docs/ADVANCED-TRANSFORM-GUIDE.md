# Advanced Transform Guide

## Overview
The Advanced Transform block provides powerful data transformation capabilities with 8 different operation types. Transform data without writing code using an intuitive, minimalistic interface.

## Features

### Supported Operations

#### 1. Copy/Rename
Simple column copy or rename operation.
- **Use case**: Rename columns for clarity or compliance
- **Parameters**: None
- **Example**: Copy "MaterialNumber" to "Material"

#### 2. Concatenate
Combine multiple columns into one with a custom separator.
- **Use case**: Create full names, addresses, or composite keys
- **Inputs**: Multiple columns (checkbox selection)
- **Parameters**: 
  - Separator (default: space)
- **Example**: Concatenate "FirstName" + "LastName" → "John Doe"

#### 3. Split
Split a column on a delimiter and extract a specific part.
- **Use case**: Extract domain from email, parse structured data
- **Inputs**: Single column
- **Parameters**:
  - Delimiter (e.g., "@", ",", "-")
  - Index (0-based position of part to extract)
- **Example**: Split "john@company.com" on "@" → index 1 → "company.com"

#### 4. Case Change
Change text case.
- **Use case**: Normalize data, format for display
- **Inputs**: Single column
- **Parameters**:
  - Type: UPPERCASE, lowercase, or Capitalize
- **Example**: "sales" → "SALES"

#### 5. Math
Perform mathematical operations on numeric columns.
- **Use case**: Calculate totals, averages, price adjustments
- **Inputs**: Multiple numeric columns (checkbox selection)
- **Parameters**:
  - Operation: Add (+), Subtract (-), Multiply (*), Divide (/)
  - Rounding: None, 0, 2, or 4 decimals
- **Example**: Add "Price" + "Tax" → "Total"
- **Note**: Operations are applied sequentially (left to right)

#### 6. Regex Replace
Find and replace text using regular expressions.
- **Use case**: Clean data, format patterns, remove unwanted characters
- **Inputs**: Single column
- **Parameters**:
  - Pattern (regex, e.g., "[0-9]+", "-")
  - Replacement text
- **Example**: Replace "[0-9]+" with "" to remove all digits
- **Safety**: Invalid regex patterns are safely handled

#### 7. Date Format
Parse and reformat dates.
- **Use case**: Standardize date formats, convert between formats
- **Inputs**: Single column
- **Parameters**:
  - Input Format: ISO, locale, or custom
  - Output Format: ISO, YYYY-MM-DD, DD/MM/YYYY, locale
- **Example**: "2024-01-15T10:30:00.000Z" → "2024-01-15"
- **Note**: Invalid dates return original value

#### 8. Expression
Evaluate expressions with column value substitution.
- **Use case**: Create custom transformations with templates
- **Inputs**: None (uses expression)
- **Parameters**:
  - Expression template using ${columnName} syntax
- **Example**: "${FirstName}-${LastName}" → "John-Doe"
- **Safety**: Uses safe template substitution (no eval)

## Usage

### Basic Workflow

1. **Create Transform Block**
   - Drag Transform block from toolbox to canvas
   - Connect an Input or Mapping block to it

2. **Configure Transformations**
   - Double-click Transform block to open modal
   - For each output column:
     - Enter output column name
     - Select operation type
     - Choose input column(s)
     - Configure parameters
   - Click "+ Voeg transformatie toe" to add more columns

3. **Apply Transformation**
   - Click "Apply Transform" button
   - Block shows "N kolom(men) getransformeerd"
   - Data is transformed and propagated to connected blocks

### Example: Employee Data Transformation

**Input Data:**
```csv
FirstName,LastName,Email,Salary,Department
John,Doe,john.doe@company.com,50000,Sales
Jane,Smith,jane.smith@company.com,60000,Marketing
```

**Transformations:**
1. **FullName** (Concatenate): FirstName + LastName with " " separator
2. **Domain** (Split): Email split on "@", index 1
3. **UpperDept** (Case): Department to UPPERCASE
4. **AnnualBonus** (Math): Salary * 0.1, rounded to 0 decimals

**Output Data:**
```csv
FullName,Domain,UpperDept,AnnualBonus
John Doe,company.com,SALES,5000
Jane Smith,company.com,MARKETING,6000
```

## UI Features

### Dynamic Parameter Fields
- Parameter fields change based on selected operation
- Multi-column selection for Concatenate and Math operations
- Single column dropdown for other operations

### Input Column Selection
- **Single select**: Dropdown for operations needing one column
- **Multi select**: Checkboxes for Concatenate and Math operations
- Visual feedback for selected columns

### Row Management
- **Add**: Click "+ Voeg transformatie toe" button
- **Remove**: Click × button on any row
- **Reorder**: Add rows in desired output column order

## Advanced Tips

### Chaining Transformations
Connect multiple Transform blocks to apply sequential transformations:
```
Input → Transform1 (clean data) → Transform2 (calculate) → Output
```

### Complex Math
For operations on more than 2 values, they're applied sequentially:
```
Inputs: [100, 20, 5]
Operation: Subtract
Result: 100 - 20 - 5 = 75
```

### Expression Safety
The Expression operation uses safe template substitution:
- No JavaScript eval() is used
- Only column value substitution is performed
- Prevents code injection attacks

### Date Format Options
- **ISO**: Full ISO 8601 format (e.g., "2024-01-15T10:30:00.000Z")
- **YYYY-MM-DD**: Simple date format
- **DD/MM/YYYY**: European format
- **locale**: Browser's locale date format

## Troubleshooting

### "Verbind eerst een Data Input block"
**Solution**: Connect an Input or Mapping block to the Transform block before opening.

### Empty Output
**Problem**: No data in transformed output
**Solution**: 
- Check that input columns are selected
- Verify parameter values are correct
- Ensure input data exists in connected block

### Math Operation Returns 0
**Problem**: Math result is always 0
**Solution**:
- Check that input columns contain numeric values
- Verify columns are not empty
- Check for division by zero

### Regex Pattern Error
**Problem**: Regex replace not working
**Solution**:
- Verify regex pattern is valid
- Test pattern with online regex tester
- On invalid pattern, original value is returned

## Performance

- Transformations are executed in-memory
- All rows processed simultaneously
- Efficient for datasets up to 10,000 rows
- No server-side processing required

## Security

### Safe Expression Evaluation
- No `eval()` or `Function()` constructor used
- Template substitution only
- Prevents arbitrary code execution
- Documented limitations in code comments

### Input Validation
- All parameters are sanitized
- Invalid regex patterns handled gracefully
- Division by zero prevented
- Date parsing errors caught and handled

## Storage Format

Transformations are stored in the block as:
```javascript
block.transformations = {
  "OutputColumn": {
    op: "concatenate",
    inputs: ["FirstName", "LastName"],
    params: { separator: " " }
  },
  "Domain": {
    op: "split",
    inputs: ["Email"],
    params: { delimiter: "@", index: 1 }
  }
}
```

## Testing

Comprehensive test suite in `test-advanced-transform.js`:
- 20 unit tests covering all operations
- Tests for edge cases and error handling
- Validates UI structure and functions
- Run with: `node test-advanced-transform.js`

## Backward Compatibility

The advanced transform implementation maintains full backward compatibility:
- Old simple transforms still work
- Existing `applyTransformationLogic()` function preserved
- Old blocks can be upgraded by opening and re-saving
- No breaking changes to existing flows
