# Transform Module Usage Guide

## Overview
The Transform module allows you to map input columns to output columns and export the transformed data as a CSV file.

## Quick Start

### 1. Create a Basic Transform Flow

1. **Add a Data Input block** to the canvas
   - Double-click to load your CSV file (e.g., `sample-data.csv`)

2. **Add a Transform block** to the canvas
   - Drag it from the toolbox (⚙️ Transform)

3. **Connect the blocks**
   - Click the bottom connector (⚪) of Data Input
   - Drag to the top connector (⚪) of Transform

4. **Configure the transformation**
   - Double-click the Transform block
   - Map input columns to desired output column names
   - Click "Apply Transform"

5. **Export the result**
   - Click "Export CSV" to download the transformed data

## Example Workflow

### Input Data
```csv
MaterialNumber,MaterialDescription,Plant,StorageLocation,Quantity,UnitOfMeasure
10001234,SAP Basis Module License,1000,0001,100,EA
10001235,SAP HANA Database,1000,0001,5,EA
```

### Mapping Configuration
```
Material ← MaterialNumber
Description ← MaterialDescription
Qty ← Quantity
Unit ← UnitOfMeasure
```

### Output CSV
```csv
Material,Description,Qty,Unit
10001234,SAP Basis Module License,100,EA
10001235,SAP HANA Database,5,EA
```

## Features

### Column Mapping
- Map input columns to any output column name
- Rename columns for clarity
- Select which columns to include in output
- Reorder columns by mapping order

### Dynamic Mappings
- Add new mappings with the "+ Voeg mapping toe" button
- Remove unwanted mappings with the × button
- Change mappings at any time and reapply

### CSV Export
- Automatic CSV generation with proper formatting
- Handles special characters (commas, quotes, newlines)
- Downloads as `transformed-output.csv`
- Preserves data integrity

## Tips

1. **Start Simple**: Begin with a few column mappings to verify your transformation
2. **Preview First**: Check the data preview before exporting
3. **Test Small**: Use a small dataset first to verify mappings are correct
4. **Chain Blocks**: Connect Transform output to Data View to preview before export

## Use Cases

### Rename Columns
Transform SAP technical names to business-friendly names:
```
Material Number → MaterialNumber
Material Desc → MaterialDescription
```

### Select Columns
Extract only the columns you need from a large dataset:
```
Product → MaterialNumber
Name → MaterialDescription
```

### Reformat Data
Prepare data for another system with specific column requirements:
```
ID → MaterialNumber
DESCRIPTION → MaterialDescription
QTY → Quantity
```

## Troubleshooting

**Problem**: "Verbind eerst een Data Input block"
- **Solution**: Make sure to connect a Data Input or Mapping block to the Transform block

**Problem**: Export button doesn't work
- **Solution**: Apply the transformation first before exporting

**Problem**: Output has wrong columns
- **Solution**: Check your mappings and ensure input column names match exactly

## Advanced Usage

### Chaining Transforms
You can chain multiple Transform blocks to apply sequential transformations:
1. Input → Transform1 (rename columns)
2. Transform1 → Transform2 (select subset)
3. Transform2 → Data View (preview result)

### Integration with Mapping Block
Use the Mapping block before Transform for complex transformations:
1. Input → Mapping (complex transformations)
2. Mapping → Transform (final column selection and export)
