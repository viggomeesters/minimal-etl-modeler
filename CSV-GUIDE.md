# CSV Format Guide

## Overview
The Minimal ETL Modeler supports standard CSV (Comma-Separated Values) files for data input and output operations.

## Supported Format

### Basic Structure
```csv
Header1,Header2,Header3
Value1,Value2,Value3
Value4,Value5,Value6
```

### Key Features
- **Headers Required**: First row must contain column headers
- **Comma Delimited**: Values separated by commas
- **UTF-8 Encoding**: Files should be UTF-8 encoded
- **Line Endings**: Supports both Unix (`\n`) and Windows (`\r\n`) line endings

## Advanced Features

### Quoted Values
The parser supports quoted values containing commas:

```csv
Name,Description,Price
Product A,"High quality, durable product",29.99
Product B,Standard product,19.99
Product C,"Premium product, includes warranty",49.99
```

**Important**: Values with commas MUST be enclosed in double quotes.

### Empty Values
Empty values are supported and will be stored as empty strings:

```csv
ID,Name,OptionalField,Status
1,Item One,,Active
2,Item Two,Value,Active
3,Item Three,,Inactive
```

### Special Characters
- **Commas in values**: Must be quoted
- **Quotes in values**: Not currently supported (will be added in future version)
- **Newlines in values**: Not supported

## Best Practices

### File Preparation
1. **Remove Empty Rows**: Empty rows at the end of file are automatically skipped
2. **Consistent Headers**: Ensure all rows have the same number of columns
3. **Clean Data**: Remove special formatting (colors, formulas) before export
4. **Test Small First**: Test with a small sample before processing large files

### Column Headers
- **Descriptive Names**: Use clear, descriptive column names
- **No Special Characters**: Avoid special characters in headers (use alphanumeric and underscores)
- **Case Sensitive**: Column names are case-sensitive during mapping
- **Unique Names**: Each column should have a unique name

### SAP Data Specific
Common SAP fields that work well:
- MaterialNumber
- MaterialDescription
- Plant
- StorageLocation
- Quantity
- UnitOfMeasure
- CustomerNumber
- OrderNumber

## File Size Recommendations

### Optimal Performance
- **Rows**: < 10,000 rows
- **Columns**: < 50 columns
- **File Size**: < 5 MB

### Maximum Limits (Browser Dependent)
- **Rows**: Up to 50,000 rows
- **Columns**: Up to 100 columns
- **File Size**: < 50 MB

**Note**: Larger files may work but will cause browser slowdown.

## Common Issues and Solutions

### Issue: "No data available"
**Causes**:
- Missing or empty CSV file
- File not connected to block properly
- CSV has no data rows (only headers)

**Solutions**:
1. Check that file was loaded successfully
2. Verify connections between blocks
3. Ensure CSV has at least one data row

### Issue: "Columns not aligned"
**Causes**:
- Unquoted commas in values
- Inconsistent number of columns per row
- Special characters breaking parsing

**Solutions**:
1. Add quotes around values containing commas
2. Verify all rows have same number of columns
3. Remove special characters or formatting

### Issue: "Missing data in output"
**Causes**:
- Incorrect column mapping
- Empty values in source data
- Data lost during transformation

**Solutions**:
1. Check mapping configuration
2. Verify source data completeness
3. Use Data View block to inspect data at each stage

## Export Format

### Generated CSV Files
Files exported from the tool will:
- Use standard CSV format
- Include headers in first row
- Use comma delimiters
- Apply quotes when necessary
- Use UTF-8 encoding

### Example Export
```csv
OutputColumn1,OutputColumn2,OutputColumn3
TransformedValue1,TransformedValue2,TransformedValue3
TransformedValue4,TransformedValue5,TransformedValue6
```

## Testing Your CSV

### Quick Test
1. Open `index.html` in browser
2. Drag a **Data Input** block to canvas
3. Double-click and select your CSV file
4. Drag a **Data View** block to canvas
5. Connect Data Input → Data View
6. Double-click Data View to inspect

### Verify
- All columns are visible
- Row count matches expectation
- No data corruption or truncation
- Special characters display correctly

## Future Enhancements
- Support for escaped quotes in values
- Support for newlines in quoted values
- Support for alternative delimiters (semicolon, tab)
- CSV validation and error reporting
- Automatic encoding detection
