# Export Features Guide

This guide covers the new export and data preview features added to the Minimal ETL Modeler.

## 📋 Table of Contents

1. [Inline Data Preview](#inline-data-preview)
2. [XLSX Export](#xlsx-export)
3. [Custom Filename Patterns](#custom-filename-patterns)
4. [Rejected Output](#rejected-output)
5. [Workflows](#workflows)

## 👁️ Inline Data Preview

### Overview
Every block now supports inline data preview, eliminating the need for a separate "Data View" component.

### How to Use

**Method 1: Double-Click**
- Double-click any block to open its configuration modal
- If the block has data and you double-click again, it shows the preview

**Method 2: Shift+Double-Click** ⭐ RECOMMENDED
- Hold Shift and double-click any block
- Instantly previews the block's output data
- Works on ALL block types (Input, Transform, Validation, Join, Output, etc.)

### What You See
- First 100 rows of data
- All column headers
- Performance-optimized for large datasets
- Shows row count (e.g., "Showing first 100 of 5,000 rows")

### Supported Blocks
- ✅ Data Input
- ✅ Target Structure
- ✅ Automapper
- ✅ Mapping
- ✅ Transform (Legacy)
- ✅ All Transform Blocks (Concatenate, Split, Math, etc.)
- ✅ Validation
- ✅ Value Mapper
- ✅ Join
- ✅ Output Data
- ✅ Rejected Output

## 📊 XLSX Export

### Overview
Export your data in both CSV and XLSX (Excel) formats using the SheetJS library.

### Features
- **Browser-native**: Uses SheetJS CDN, no build step required
- **Multiple formats**: Choose CSV or XLSX per export
- **Custom filenames**: Use patterns with date tokens
- **Large dataset support**: Efficiently handles 10,000+ rows

### How to Export

#### From Output Data Block
1. Connect a transform/validation block to Output Data block
2. Double-click the Output Data block
3. Review data preview (shows columns and first 3 rows)
4. Enter optional filename pattern (see below)
5. Click **Export CSV** or **Export XLSX**

#### From Rejected Output Block
1. Run a Validation block that produces rejected records
2. Add Rejected Output block to canvas
3. Double-click the Rejected Output block
4. Review rejected data with error messages
5. Enter optional filename pattern
6. Click **Export CSV** or **Export XLSX**

### XLSX Format Details
- Sheet name: "Data"
- Includes all columns and rows
- Proper Excel formatting
- Compatible with Excel, Google Sheets, LibreOffice

## 📝 Custom Filename Patterns

### Overview
Generate dynamic filenames with date/time tokens for better file organization.

### Available Tokens

| Token | Format | Example | Description |
|-------|--------|---------|-------------|
| `YYYYMMDD` | Compact date | `20240315` | Year, month, day (8 digits) |
| `YYYY-MM-DD` | ISO date | `2024-03-15` | Year-month-day with hyphens |
| `YYYYMMDD_HHMMSS` | Timestamp | `20240315_143052` | Date and time (14 digits) |

### Pattern Syntax

**Basic Pattern**
```
pattern → extension
```

**With Prefix**
```
prefix#token → prefix + token + extension
```

**Examples**

| Pattern | Result | Use Case |
|---------|--------|----------|
| _(empty)_ | `output.csv` | Default filename |
| `export_YYYYMMDD` | `export_20240315.csv` | Daily exports |
| `S_AUFK#YYYYMMDD` | `S_AUFK20240315.csv` | SAP table export |
| `data_YYYY-MM-DD` | `data_2024-03-15.xlsx` | Human-readable date |
| `backup_YYYYMMDD_HHMMSS` | `backup_20240315_143052.csv` | Timestamped backups |
| `rejected#YYYYMMDD` | `rejected20240315.csv` | Daily rejected records |

### How to Use

1. In the Export Options section, find "Filename Pattern"
2. Enter your pattern (e.g., `S_AUFK#YYYYMMDD`)
3. Click Export CSV or Export XLSX
4. File downloads with the generated name

### Tips
- Use `#` to separate prefix from date token
- Tokens are case-sensitive (must be UPPERCASE)
- If no pattern is specified, uses default names
- Pattern applies to both CSV and XLSX exports

## 🚫 Rejected Output

### Overview
Automatically collect and export records that fail validation rules.

### How It Works

1. **Configure Validation**
   - Add Validation block
   - Define rules (required, type, regex, min/max)
   - Connect to your data flow

2. **Run Validation**
   - Validation block splits data into:
     - ✅ Valid records → pass through to next block
     - ❌ Rejected records → stored in rejected data store

3. **View Rejected Records**
   - Add Rejected Output block
   - Double-click to open
   - See all rejected records with error messages

4. **Export Rejected Data**
   - Choose CSV or XLSX format
   - Apply custom filename pattern
   - Download for analysis

### Rejected Data Structure

Rejected records include all original columns PLUS:

- `__validation_errors__`: Semicolon-separated error messages

**Example:**
```csv
Name,Age,Email,__validation_errors__
Alice,0,invalid-email,age must be > 0; Email must match pattern
Bob,25,,Email is required
```

### Use Cases

✅ **Data Quality Monitoring**
- Track validation failures over time
- Identify problematic data sources
- Monitor error trends

✅ **Error Analysis**
- Review why records failed
- Identify patterns in rejected data
- Improve validation rules

✅ **Data Cleansing**
- Export rejected records
- Fix data issues manually
- Re-import cleaned data

✅ **Compliance & Audit**
- Keep audit trail of rejected records
- Document data quality issues
- Meet regulatory requirements

## 🔄 Workflows

### Workflow 1: Data Quality Monitoring

```
Data Input → Validation → Output Data (valid records)
                ↓
         Rejected Output (rejected records)
```

**Steps:**
1. Load source data with Data Input
2. Add Validation block with rules
3. Connect to Output Data for valid records
4. Add Rejected Output block
5. Export valid records as `validated_YYYYMMDD.xlsx`
6. Export rejected records as `rejected_YYYYMMDD.xlsx`
7. Review rejected data for issues

### Workflow 2: Multi-Stage Export

```
Data Input → Transform → Join → Validation → Output Data
```

**Steps:**
1. Transform and enrich data
2. Join with reference data
3. Apply validation rules
4. Shift+Double-click any block to preview data
5. Export final dataset with custom filename
6. Export rejected records separately

### Workflow 3: Daily ETL Export

```
Data Input → Mapping → Transform → Output Data
```

**Configuration:**
- Filename pattern: `SAP_EXPORT#YYYYMMDD`
- Export format: XLSX
- Result: `SAP_EXPORT20240315.xlsx`

**Benefits:**
- Automatic date in filename
- No manual renaming needed
- Easy to organize by date

## 🎯 Best Practices

### Preview Often
- Use Shift+Double-click after each transformation
- Verify data at every step
- Catch issues early

### Use Custom Filenames
- Include date tokens for time-based exports
- Use meaningful prefixes (e.g., table name)
- Consistent naming across exports

### Leverage Rejected Output
- Always add Rejected Output after Validation
- Export rejected records for analysis
- Review patterns in rejected data
- Improve validation rules based on findings

### Choose the Right Format
- **CSV**: Simple, universal, smaller file size
- **XLSX**: Rich formatting, Excel-compatible, better for humans

### Performance Tips
- Preview shows first 100 rows (full export includes all)
- Large datasets (10k+ rows) are optimized automatically
- XLSX export is efficient but CSV is faster for huge datasets

## 📚 Related Documentation

- [README.md](README.md) - Main documentation
- [QUICKSTART.md](QUICKSTART.md) - Getting started guide
- [VALIDATION-GUIDE.md](VALIDATION-GUIDE.md) - Validation rules (if exists)

## 🐛 Troubleshooting

**Issue: XLSX export not working**
- Solution: Check internet connection (SheetJS loads from CDN)
- Fallback: Use CSV export

**Issue: Filename pattern not applied**
- Solution: Check token is uppercase (e.g., `YYYYMMDD` not `yyyymmdd`)
- Solution: Verify pattern syntax (use `#` for separator)

**Issue: No rejected data showing**
- Solution: Ensure Validation block has rules configured
- Solution: Run validation with data that fails rules
- Solution: Check validation block shows error count

**Issue: Preview shows "No data available"**
- Solution: Ensure block is connected to data source
- Solution: Check previous blocks have processed data
- Solution: Use propagateData to refresh connections

## 🎉 Summary

The new export features make the ETL Modeler more powerful and user-friendly:

- ✅ Universal data preview (no separate view block needed)
- ✅ XLSX export for Excel compatibility
- ✅ Custom filename patterns with date tokens
- ✅ Rejected output for data quality monitoring
- ✅ Zero dependencies (except SheetJS CDN)
- ✅ Fully tested and documented

Happy ETL modeling! 🚀
