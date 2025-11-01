# Component Groups Guide

## Overview

The Minimal ETL Modeler components are organized into **6 logical groups** for improved discoverability and usability. Each group can be expanded or collapsed by clicking on the group header.

## Component Groups

### 📦 Input/Output
**Purpose:** Core data input and output operations  
**Components:**
- **📥 Input Source Data** - Load CSV files into the workflow
- **📤 Target Structure** - Define output template structure
- **💾 Output Data** - Export transformed data to CSV
- **🚫 Rejected Output** - Export validation-rejected records

**When to use:** Start and end of your ETL workflow

**Note:** Use the 👁️ Data View button (top-right corner) to preview data from any block at any time.

---

### 🔗 Mapping
**Purpose:** Column and value mapping operations  
**Components:**
- **🤖 Automapper** - Automatically map columns using fuzzy matching
- **🔗 Mapping** - Manually configure column mappings
- **🔄 Value Mapper** - Map specific values to new values

**When to use:** When transforming data between different structures

---

### 🔀 Data Operations
**Purpose:** High-level data manipulation  
**Components:**
- **🔀 Join** - Combine two datasets based on matching keys
- **✓ Validation** - Validate data against rules and constraints

**When to use:** When combining datasets or ensuring data quality

---

### 📝 Text Operations
**Purpose:** String manipulation and text transformations  
**Components:**
- **➕ Concatenate** - Combine multiple columns into one
- **✂️ Split** - Split a column on a delimiter
- **🔤 Case Change** - Change text case (upper, lower, title)
- **🔍 Regex Replace** - Find and replace using regular expressions
- **📋 Copy/Rename** - Copy or rename columns

**When to use:** When working with text data and string transformations

---

### 🔢 Transformations
**Purpose:** Numeric and date transformations  
**Components:**
- **🔢 Math** - Perform mathematical operations on numeric columns
- **📅 Date Format** - Parse and reformat date values
- **📝 Expression** - Evaluate complex expressions with column substitution

**When to use:** When performing calculations or date manipulations

---

### ⚙️ Legacy
**Purpose:** Backward compatibility with older workflows  
**Components:**
- **⚙️ Transform (Legacy)** - Original all-in-one transform block

**When to use:** Only for maintaining existing workflows. Use specific transform blocks for new workflows.

---

## Using Component Groups

### Expand/Collapse Groups
- **Click** on any group header to expand or collapse it
- The arrow icon (▼/►) indicates the current state
- Groups remember their state during your session

### Finding Components
1. **By Category:** Expand the relevant group based on what you want to do
2. **By Icon:** Each component has a unique emoji icon for quick identification
3. **By Name:** Component names are descriptive and self-explanatory

### Drag and Drop
- **Drag** any component from any group onto the canvas
- The group state doesn't affect drag-and-drop functionality
- You can drag from collapsed groups by expanding them first

## Tips for Efficient Use

### Start with Input/Output
1. Always begin with **Input Source Data** to load your data
2. Click the **👁️ Data View button** (top-right) to verify data at any time
3. Use **Shift+Double-click** on any block for quick data preview
4. End with **Output Data** to export results

### Common Workflows

**Simple Transformation:**
```
Input/Output → Text Operations → Output Data
```

**Advanced ETL:**
```
Input/Output → Mapping → Transformations → Data Operations → Output Data
```

**Data Integration:**
```
Input Source Data (x2) → Join → Text Operations → Output Data
```

### Organization Tips
- **Collapse** unused groups to reduce visual clutter
- **Focus** on the group relevant to your current task
- **Expand All** when learning or exploring available components

## Design Philosophy

The grouping follows ETL workflow patterns:

1. **Load data** (Input/Output)
2. **Configure mappings** (Mapping)
3. **Transform data** (Text Operations, Transformations)
4. **Manipulate datasets** (Data Operations)
5. **Export results** (Input/Output)

This organization mirrors how users naturally think about data transformation tasks.

## Benefits

✅ **Better Organization** - Components grouped by function  
✅ **Improved Discoverability** - Find the right component quickly  
✅ **Reduced Clutter** - Collapse unused sections  
✅ **Clear Purpose** - Each group has a specific function  
✅ **Scalable** - Easy to add new components to existing groups

---

*For detailed component documentation, see the main [README.md](README.md)*
