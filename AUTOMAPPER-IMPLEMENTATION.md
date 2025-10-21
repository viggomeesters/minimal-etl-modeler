# Automapper Feature - Implementation Summary

## Overview
The Automapper block is a new ETL component that automatically generates column mappings between input datasets and output templates using intelligent matching algorithms.

## Key Features

### 1. Smart Matching Algorithm
The Automapper uses a three-tier matching strategy:

- **Exact Match** (✓ green): Perfect match after normalization
  - Removes underscores, spaces, hyphens
  - Case-insensitive comparison
  - Example: `Material_Number` matches `materialnumber`

- **Partial Match** (≈ orange): One column name contains the other
  - Example: `Material` matches `MaterialNumber`
  - Useful for abbreviated column names

- **Fuzzy Match** (~ orange): Similar strings based on character overlap
  - Uses position-based and character-set similarity
  - Threshold: >50% similarity
  - Example: `Desc` matches `Description`

- **Unmatched** (❓ grey): No suitable match found
  - Requires manual mapping

### 2. User Interface

#### Automapper Block
- Icon: 🤖
- Position: Between Target Structure and Mapping in toolbox
- Requires: Input data + Target template connections
- Output: Mapped data or mapping configuration

#### Modal Display
- Shows all output columns with their matched input columns
- Color-coded confidence indicators
- Summary: "Automatisch gegenereerd: X van Y kolommen gematcht"
- Highlights unmapped input columns in yellow warning box
- Two action buttons:
  - **Apply Auto-Mappings**: Direct application
  - **Send to Mapping Block**: Transfer to Mapping block for refinement

### 3. Workflow Integration

#### Quick Workflow (Automapper Only)
```
Data Input → Automapper ← Target Structure
                ↓
           Apply directly
                ↓
           Output Data
```

#### Refinement Workflow (Automapper + Mapping)
```
Data Input → Automapper ← Target Structure
                ↓
        Send to Mapping Block
                ↓
          Mapping (manual adjustments)
                ↓
           Transform
                ↓
          Output Data
```

## Technical Implementation

### Core Functions

#### `autoGenerateMappings(inputHeaders, outputHeaders)`
Generates mappings between column sets.

**Parameters:**
- `inputHeaders`: Array of source column names
- `outputHeaders`: Array of target column names

**Returns:**
```javascript
{
  mappings: {
    'output_col': 'input_col',
    // ...
  },
  matchConfidence: {
    'output_col': 'exact' | 'partial' | 'fuzzy' | 'unmatched',
    // ...
  }
}
```

**Algorithm:**
1. For each output column:
   - Normalize both input and output names
   - Try exact match first (score: 1.0)
   - Try partial match (score: 0.8)
   - Try fuzzy match (score: 0.5-1.0)
   - Select best match if above threshold
2. Ensure each input column is matched only once

#### `calculateSimilarity(str1, str2)`
Computes string similarity score.

**Method:**
- Position-based matching (weighted 2x)
- Character set overlap
- Normalized to max string length

#### `normalize(str)`
Normalizes column names for matching.

**Transformations:**
- Convert to lowercase
- Remove underscores, spaces, hyphens
- Remove special characters (keep alphanumeric only)

### Data Flow

1. **Input**: User connects Data Input and Target Structure to Automapper
2. **Processing**: 
   - Extract headers from both sources
   - Run `autoGenerateMappings()`
   - Generate confidence indicators
   - Identify unmapped columns
3. **Display**: Show results in modal with color coding
4. **Action**: 
   - Option A: Apply mappings and transform data
   - Option B: Send to Mapping block for manual adjustment

## Testing

### Test Coverage

#### Unit Tests (test-automapper.js) - 12 tests
- ✅ Block existence in HTML
- ✅ Modal structure
- ✅ Function definitions
- ✅ Exact matching
- ✅ Normalization
- ✅ Partial matching
- ✅ Unmatched detection
- ✅ Similarity calculation
- ✅ Unique matching (no duplicates)
- ✅ Block rendering
- ✅ CSS styling
- ✅ Empty input handling

#### Integration Tests (test-automapper-integration.js) - 10 tests
- ✅ Complete SAP data flow
- ✅ High match rate scenarios
- ✅ Partial match handling
- ✅ Mixed confidence levels
- ✅ Data preservation
- ✅ Special character normalization
- ✅ Large dataset performance (20 columns)
- ✅ Duplicate prevention
- ✅ Empty value handling
- ✅ Case insensitivity

#### Existing Tests - All Passing
- ✅ Mapping tests (9/9)
- ✅ CSV parser tests
- ✅ Transform tests (10/10)
- ✅ Integration tests (11/11)

**Total: 52 tests, 100% passing**

## Performance Characteristics

- **Speed**: Sub-100ms for 20 column sets
- **Memory**: Minimal overhead, O(n*m) complexity where n=input cols, m=output cols
- **Scalability**: Linear growth with column count
- **Optimization**: Early exit on exact matches

## Use Cases

### Best Suited For
1. **SAP Data Migration**: Material, Plant, Customer data transformations
2. **Standardization Projects**: Converting legacy to standard formats
3. **Repetitive ETL Tasks**: Similar datasets with consistent naming
4. **Large Datasets**: Many columns (>10) benefit most from automation

### When to Use Manual Mapping Instead
1. **Business Logic Required**: Complex rules beyond simple mapping
2. **Completely Different Naming**: No similarity between columns
3. **Custom Transformations**: Concatenations, calculations, etc.
4. **Audit Requirements**: Full manual control needed

## Best Practices

### For Users
1. **Review Confidence Indicators**: Always check orange (≈, ~) matches
2. **Use Template-Based Approach**: Load target structure first
3. **Iterate**: Use "Send to Mapping Block" for refinement
4. **Document**: Note any manual changes made after auto-mapping

### For Developers
1. **Normalization**: Extend normalize() for language-specific characters
2. **Weights**: Adjust similarity thresholds based on use case
3. **Learning**: Consider ML-based matching for future versions
4. **Audit Trail**: Log auto-mapping decisions

## Future Enhancements

### Planned
- [ ] User-defined matching rules
- [ ] Learning from manual corrections
- [ ] Multi-language support in normalization
- [ ] Synonym dictionary for domain-specific terms
- [ ] Confidence threshold configuration
- [ ] Mapping suggestions for unmatched columns

### Possible
- [ ] AI/ML-based column matching
- [ ] Historical mapping reuse
- [ ] Column data type consideration
- [ ] Sample data analysis for better matching
- [ ] Bulk operations for multiple datasets

## Documentation Updates

### Updated Files
1. **README.md**: Added Automapper to features, workflows, tests
2. **GEBRUIKERSHANDLEIDING.md**: Added component description, workflows, tips, FAQ
3. **This file**: Complete implementation documentation

## Conclusion

The Automapper block successfully implements intelligent automatic column mapping with:
- High accuracy (exact + partial + fuzzy matching)
- User-friendly interface with visual confidence indicators
- Flexible workflow (direct apply or send to mapping)
- Comprehensive test coverage (52 tests)
- Good performance (<100ms for 20 columns)
- Complete documentation

The feature reduces manual effort in ETL mapping processes while maintaining flexibility for manual refinements when needed.
