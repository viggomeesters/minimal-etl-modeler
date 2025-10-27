# Split Transform Blocks Guide

## Overview
The Transform block functionality has been split into individual, focused transformation blocks to improve visual clarity of data flows. Each transformation operation now has its own dedicated block type.

## New Transformation Blocks

### 1. ➕ Concatenate Block
**Purpose**: Combine multiple columns into one with a custom separator

**Configuration**:
- **Output Column Name**: Name for the new combined column
- **Input Columns**: Select multiple columns to concatenate (checkboxes)
- **Separator**: Character(s) to join the columns (e.g., " ", ", ", "-")

**Example**:
- Input: `FirstName: "John"`, `LastName: "Doe"`
- Configuration: Separator = " "
- Output: `FullName: "John Doe"`

**Use Cases**:
- Create full names from first/last name fields
- Build composite keys
- Combine address fields
- Create formatted identifiers

---

### 2. ✂️ Split Block
**Purpose**: Split a column on a delimiter and extract a specific part

**Configuration**:
- **Output Column Name**: Name for the extracted value
- **Input Column**: Column to split
- **Delimiter**: Character to split on (e.g., "@", ",", "-", " ")
- **Index**: Position of the part to extract (0-based)

**Example**:
- Input: `Email: "john.doe@company.com"`
- Configuration: Delimiter = "@", Index = 1
- Output: `Domain: "company.com"`

**Use Cases**:
- Extract domain from email addresses
- Parse structured identifiers
- Extract parts of formatted codes
- Split delimited lists

---

### 3. 🔤 Case Change Block
**Purpose**: Change text case (upper, lower, capitalize)

**Configuration**:
- **Output Column Name**: Name for the transformed column
- **Input Column**: Column to transform
- **Case Type**: UPPERCASE, lowercase, or Capitalize

**Example**:
- Input: `Department: "sales"`
- Configuration: Type = UPPERCASE
- Output: `UpperDept: "SALES"`

**Use Cases**:
- Normalize data for matching
- Format for display
- Standardize codes
- Clean inconsistent text

---

### 4. 🔢 Math Block
**Purpose**: Perform mathematical operations on numeric columns

**Configuration**:
- **Output Column Name**: Name for the calculated value
- **Input Columns**: Select multiple numeric columns (checkboxes)
- **Operation**: Add (+), Subtract (-), Multiply (*), Divide (/)
- **Rounding**: None, 0, 2, or 4 decimal places

**Example**:
- Input: `Price: 100`, `Quantity: 5`
- Configuration: Operation = Multiply, Round = 2
- Output: `Total: 500.00`

**Use Cases**:
- Calculate totals, subtotals
- Compute percentages
- Apply formulas
- Financial calculations

**Note**: Operations are applied left-to-right when multiple columns are selected.

---

### 5. 🔍 Regex Replace Block
**Purpose**: Find and replace text using regular expressions

**Configuration**:
- **Output Column Name**: Name for the cleaned column
- **Input Column**: Column to process
- **Pattern**: Regular expression pattern
- **Replacement**: Text to replace matches with

**Example**:
- Input: `Code: "ABC123DEF"`
- Configuration: Pattern = "[0-9]+", Replacement = ""
- Output: `CleanCode: "ABCDEF"`

**Use Cases**:
- Remove unwanted characters
- Clean data
- Extract patterns
- Format standardization

**Safety**: Invalid regex patterns are handled gracefully.

---

### 6. 📅 Date Format Block
**Purpose**: Parse and reformat dates

**Configuration**:
- **Output Column Name**: Name for the formatted date
- **Input Column**: Column with date values
- **Input Format**: Format of input dates (ISO, locale, etc.)
- **Output Format**: Desired output format (YYYY-MM-DD, DD/MM/YYYY, etc.)

**Example**:
- Input: `DateString: "2024-01-15T10:30:00.000Z"`
- Configuration: Input = ISO, Output = YYYY-MM-DD
- Output: `FormattedDate: "2024-01-15"`

**Use Cases**:
- Standardize date formats
- Convert between formats
- Format for display
- Prepare for export

**Note**: Invalid dates return the original value.

---

### 7. 📝 Expression Block
**Purpose**: Create custom expressions using column value templates

**Configuration**:
- **Output Column Name**: Name for the computed column
- **Expression**: Template string using `${columnName}` syntax

**Example**:
- Input: `FirstName: "John"`, `LastName: "Doe"`
- Configuration: Expression = "${FirstName}-${LastName}"
- Output: `UserID: "John-Doe"`

**Use Cases**:
- Create formatted identifiers
- Build custom templates
- Combine columns with custom formatting
- Generate computed values

**Safety**: Uses safe template substitution (no eval()).

---

### 8. 📋 Copy/Rename Block
**Purpose**: Copy or rename a column

**Configuration**:
- **Output Column Name**: New column name
- **Input Column**: Column to copy

**Example**:
- Input: `MaterialNumber: "10001234"`
- Configuration: Output = "Material"
- Output: `Material: "10001234"`

**Use Cases**:
- Rename columns for clarity
- Duplicate columns for processing
- Create aliases
- Simple column mapping

---

## Building Visual Data Flows

### Example Workflow

Create a flow that processes employee data:

1. **Input Source Data** → Load employee CSV
2. **Concatenate Block** → Create `FullName` from `FirstName` + `LastName`
3. **Split Block** → Extract `Domain` from `Email`
4. **Case Change Block** → Convert `Department` to `UpperDept`
5. **Math Block** → Calculate `Bonus` from `Salary`
6. **Data View** → Preview the results
7. **Output Data** → Export final CSV

Each block is visible on the canvas, making the entire transformation process clear and easy to understand.

### Benefits of Split Blocks

#### 1. **Visual Clarity**
- See exactly what transformations are applied
- Understand data flow at a glance
- Easy to follow complex processes

#### 2. **Easier Debugging**
- Identify which step causes issues
- Test individual transformations
- Isolate problems quickly

#### 3. **Simpler Configuration**
- Each block has a focused interface
- Less overwhelming than one big form
- Intuitive single-purpose UI

#### 4. **Better Organization**
- Group related transformations
- Arrange blocks logically
- Create readable flows

#### 5. **Reusability**
- Duplicate blocks easily
- Apply same transformation to different data
- Build transformation templates

## Connecting Blocks

All transformation blocks work the same way:

1. **Drag** the block from the toolbox to the canvas
2. **Connect** an input (Data Input or another transformation block) to it
3. **Configure** the transformation by double-clicking the block
4. **Apply** the configuration to process the data
5. **Connect** to another block or output to continue the flow

## Data Propagation

- Each transformation block preserves all unmapped input columns
- Transformations are applied sequentially through the flow
- Data flows through connections automatically
- Blocks can be connected in chains for complex transformations

## Backward Compatibility

The original **Transform (Legacy)** block remains available for:
- Existing flows created before this update
- Complex transformations that need multiple operations in one block
- Users who prefer the original interface

New flows should use the individual transformation blocks for better clarity.

## Tips & Best Practices

### Organization
- **Arrange vertically**: Stack transformation blocks from top to bottom
- **Use Data View**: Insert Data View blocks to preview intermediate results
- **Name clearly**: Use descriptive output column names

### Performance
- **Chain wisely**: Too many transformations may slow processing
- **Test incrementally**: Add one transformation at a time
- **Preview data**: Use Data View to verify results at each step

### Debugging
- **Isolate issues**: Test each transformation individually
- **Check connections**: Verify data flows between blocks
- **Review config**: Double-click blocks to check settings

## Comparison: Legacy vs Split Blocks

### Legacy Transform Block
**Pros**:
- All transformations in one place
- Fewer blocks on canvas
- Familiar to existing users

**Cons**:
- Hidden complexity
- Hard to see data flow
- Difficult to debug
- Overwhelming interface

### Split Transform Blocks
**Pros**:
- Visual clarity
- Easy to understand
- Simple configuration
- Better debugging
- Clear data flow

**Cons**:
- More blocks on canvas
- May require more connections
- Slightly more setup time

**Recommendation**: Use split blocks for new flows to maximize clarity and maintainability.

## Troubleshooting

### "Verbind eerst een Data Input block"
- **Problem**: Block has no input data
- **Solution**: Connect a Data Input or another transformation block first

### Block doesn't show up on canvas
- **Problem**: Drag-and-drop failed
- **Solution**: Try dragging again, ensuring you drop inside the canvas area

### Output column is empty
- **Problem**: Transformation failed or configuration incorrect
- **Solution**: 
  - Check input column exists
  - Verify configuration settings
  - Review input data format

### Data not flowing through
- **Problem**: Connections not working
- **Solution**:
  - Check connection lines are visible
  - Verify blocks are properly connected
  - Try reconnecting the blocks

## Future Enhancements

Potential additions to the split blocks system:
- Filter block for data filtering
- Aggregate block for summaries
- Join block for combining datasets
- Custom function block for advanced logic
- Conditional block for if/then logic
