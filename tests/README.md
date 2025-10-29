# Tests Directory

This directory contains all test files and test data for the Minimal ETL Modeler.

## Running Tests

All tests are Node.js scripts that can be run directly:

```bash
# Run from the project root directory
node tests/test-mapping.js
node tests/test-automapper.js
node tests/test-transform.js
# ... etc
```

## Test Files

### Core Functionality Tests
- `test-mapping.js` - Mapping functionality (9 tests)
- `test-automapper.js` - Automapper functionality (12 tests)
- `test-automapper-integration.js` - Complete data flow (10 tests)
- `test-validation.js` - Validation functionality (13 tests)

### Transform Tests
- `test-transform.js` - Legacy transform block
- `test-advanced-transform.js` - Advanced transformations (20 tests)
- `test-split-transform-blocks.js` - Individual transform blocks (12 tests)

### Data Operations Tests
- `test-join.js` - Join functionality (10 tests)
- `test-csv-parser.js` - CSV parsing
- `test-csv-parser-enhanced.js` - Enhanced CSV parsing

### Export & Save/Load Tests
- `test-export-features.js` - Export and rejected output (16 tests)
- `test-save-load.js` - Flow save/load functionality
- `test-flow-load-propagation.js` - Flow data propagation

### Other Tests
- `test-value-mapper.js` - Value mapping
- `test-logging.js` - Logging functionality
- `test-performance.js` - Performance testing
- `test-integration.js` - Integration tests

## Test Data Files

Test-specific CSV files used by the test suites:
- `test-empty-headers.csv`
- `test-input-9-columns.csv`
- `test-template-6-columns.csv`

## Running All Tests

To run all tests sequentially:

```bash
cd tests
for test in test-*.js; do echo "Running $test..." && node "$test" && echo ""; done
```

## Test Coverage

The tests cover:
- ✅ Block creation and configuration
- ✅ Data transformation operations
- ✅ Mapping and automapping
- ✅ Join operations (inner, left, right, full outer)
- ✅ Validation rules and rejected records
- ✅ CSV parsing and export
- ✅ Flow save/load functionality
- ✅ Performance optimizations
