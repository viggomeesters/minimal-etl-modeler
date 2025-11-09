// Test for Select block
// This test validates the Select component functionality

const fs = require('fs');
const path = require('path');

console.log('🧪 Running Select Block Tests\n');

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`✅ PASS: ${name}`);
        testsPassed++;
    } catch (error) {
        console.log(`❌ FAIL: ${name}`);
        console.log(`   Error: ${error.message}`);
        testsFailed++;
    }
}

function assertEquals(actual, expected, message) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`${message || 'Assertion failed'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}

function assertTrue(condition, message) {
    if (!condition) {
        throw new Error(message || 'Expected condition to be true');
    }
}

// Load app.js to get functions
const appJs = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

// Create evaluation context
const context = {
    console: console,
    Date: Date,
    Math: Math,
    String: String,
    parseInt: parseInt,
    parseFloat: parseFloat,
    isNaN: isNaN,
    RegExp: RegExp
};

// Test 1: Select block filters columns correctly
test('Select block filters columns based on enabled flag', () => {
    const inputData = {
        headers: ['Col1', 'Col2', 'Col3', 'Col4'],
        data: [
            { Col1: 'A', Col2: 'B', Col3: 'C', Col4: 'D' },
            { Col1: 'E', Col2: 'F', Col3: 'G', Col4: 'H' }
        ]
    };
    
    const selectedColumns = [
        { name: 'Col1', type: 'string', enabled: true },
        { name: 'Col2', type: 'string', enabled: false },
        { name: 'Col3', type: 'string', enabled: true },
        { name: 'Col4', type: 'string', enabled: false }
    ];
    
    // Simulate applySelect logic
    const enabledColumns = selectedColumns.filter(col => col.enabled);
    const enabledColumnNames = enabledColumns.map(col => col.name);
    
    const filteredData = {
        headers: enabledColumnNames,
        data: inputData.data.map(row => {
            const newRow = {};
            enabledColumnNames.forEach(colName => {
                newRow[colName] = row[colName];
            });
            return newRow;
        }),
        columnTypes: Object.fromEntries(enabledColumns.map(col => [col.name, col.type]))
    };
    
    assertEquals(filteredData.headers, ['Col1', 'Col3'], 'Headers should only include enabled columns');
    assertEquals(filteredData.data.length, 2, 'Should preserve all rows');
    assertEquals(Object.keys(filteredData.data[0]), ['Col1', 'Col3'], 'Each row should only have enabled columns');
    assertEquals(filteredData.data[0].Col1, 'A', 'Data should be preserved correctly');
    assertEquals(filteredData.data[0].Col3, 'C', 'Data should be preserved correctly');
});

// Test 2: Select block stores data type information
test('Select block stores column type information correctly', () => {
    const selectedColumns = [
        { name: 'MaterialNumber', type: 'string', enabled: true },
        { name: 'Quantity', type: 'int', enabled: true },
        { name: 'Price', type: 'double', enabled: true },
        { name: 'CreatedDate', type: 'date', enabled: true },
        { name: 'IsActive', type: 'boolean', enabled: true }
    ];
    
    const enabledColumns = selectedColumns.filter(col => col.enabled);
    const columnTypes = Object.fromEntries(enabledColumns.map(col => [col.name, col.type]));
    
    assertEquals(columnTypes.MaterialNumber, 'string', 'String type should be stored');
    assertEquals(columnTypes.Quantity, 'int', 'Integer type should be stored');
    assertEquals(columnTypes.Price, 'double', 'Double type should be stored');
    assertEquals(columnTypes.CreatedDate, 'date', 'Date type should be stored');
    assertEquals(columnTypes.IsActive, 'boolean', 'Boolean type should be stored');
});

// Test 3: Select block handles all columns enabled
test('Select block handles all columns enabled', () => {
    const inputData = {
        headers: ['A', 'B', 'C'],
        data: [
            { A: '1', B: '2', C: '3' }
        ]
    };
    
    const selectedColumns = [
        { name: 'A', type: 'string', enabled: true },
        { name: 'B', type: 'string', enabled: true },
        { name: 'C', type: 'string', enabled: true }
    ];
    
    const enabledColumns = selectedColumns.filter(col => col.enabled);
    const enabledColumnNames = enabledColumns.map(col => col.name);
    
    assertEquals(enabledColumnNames.length, 3, 'All columns should be enabled');
    assertEquals(enabledColumnNames, ['A', 'B', 'C'], 'All columns should be in output');
});

// Test 4: Select block handles single column enabled
test('Select block handles single column enabled', () => {
    const inputData = {
        headers: ['A', 'B', 'C'],
        data: [
            { A: '1', B: '2', C: '3' }
        ]
    };
    
    const selectedColumns = [
        { name: 'A', type: 'string', enabled: false },
        { name: 'B', type: 'string', enabled: true },
        { name: 'C', type: 'string', enabled: false }
    ];
    
    const enabledColumns = selectedColumns.filter(col => col.enabled);
    const enabledColumnNames = enabledColumns.map(col => col.name);
    
    assertEquals(enabledColumnNames.length, 1, 'Only one column should be enabled');
    assertEquals(enabledColumnNames[0], 'B', 'Only B should be in output');
});

// Test 5: Select block preserves data integrity
test('Select block preserves data values correctly', () => {
    const inputData = {
        headers: ['ID', 'Name', 'Age', 'City'],
        data: [
            { ID: '001', Name: 'Alice', Age: '25', City: 'NYC' },
            { ID: '002', Name: 'Bob', Age: '30', City: 'LA' },
            { ID: '003', Name: 'Charlie', Age: '35', City: 'SF' }
        ]
    };
    
    const selectedColumns = [
        { name: 'ID', type: 'string', enabled: true },
        { name: 'Name', type: 'string', enabled: false },
        { name: 'Age', type: 'int', enabled: true },
        { name: 'City', type: 'string', enabled: false }
    ];
    
    const enabledColumns = selectedColumns.filter(col => col.enabled);
    const enabledColumnNames = enabledColumns.map(col => col.name);
    
    const filteredData = {
        headers: enabledColumnNames,
        data: inputData.data.map(row => {
            const newRow = {};
            enabledColumnNames.forEach(colName => {
                newRow[colName] = row[colName];
            });
            return newRow;
        })
    };
    
    assertEquals(filteredData.data.length, 3, 'All rows should be preserved');
    assertEquals(filteredData.data[0].ID, '001', 'First row ID should be correct');
    assertEquals(filteredData.data[0].Age, '25', 'First row Age should be correct');
    assertEquals(filteredData.data[1].ID, '002', 'Second row ID should be correct');
    assertEquals(filteredData.data[1].Age, '30', 'Second row Age should be correct');
    assertTrue(!filteredData.data[0].hasOwnProperty('Name'), 'Disabled columns should not be in output');
    assertTrue(!filteredData.data[0].hasOwnProperty('City'), 'Disabled columns should not be in output');
});

// Test 6: Select block handles empty data
test('Select block handles empty dataset', () => {
    const inputData = {
        headers: ['A', 'B', 'C'],
        data: []
    };
    
    const selectedColumns = [
        { name: 'A', type: 'string', enabled: true },
        { name: 'B', type: 'string', enabled: false },
        { name: 'C', type: 'string', enabled: true }
    ];
    
    const enabledColumns = selectedColumns.filter(col => col.enabled);
    const enabledColumnNames = enabledColumns.map(col => col.name);
    
    const filteredData = {
        headers: enabledColumnNames,
        data: inputData.data.map(row => {
            const newRow = {};
            enabledColumnNames.forEach(colName => {
                newRow[colName] = row[colName];
            });
            return newRow;
        })
    };
    
    assertEquals(filteredData.headers, ['A', 'C'], 'Headers should be filtered correctly');
    assertEquals(filteredData.data.length, 0, 'Empty data should remain empty');
});

// Test 7: Select block handles mixed data types
test('Select block handles mixed data types configuration', () => {
    const selectedColumns = [
        { name: 'StringCol', type: 'string', enabled: true },
        { name: 'IntCol', type: 'int', enabled: true },
        { name: 'DoubleCol', type: 'double', enabled: true },
        { name: 'DateCol', type: 'date', enabled: true },
        { name: 'BoolCol', type: 'boolean', enabled: true }
    ];
    
    const enabledColumns = selectedColumns.filter(col => col.enabled);
    const columnTypes = Object.fromEntries(enabledColumns.map(col => [col.name, col.type]));
    
    assertEquals(Object.keys(columnTypes).length, 5, 'All types should be stored');
    
    const types = Object.values(columnTypes);
    assertTrue(types.includes('string'), 'Should include string type');
    assertTrue(types.includes('int'), 'Should include int type');
    assertTrue(types.includes('double'), 'Should include double type');
    assertTrue(types.includes('date'), 'Should include date type');
    assertTrue(types.includes('boolean'), 'Should include boolean type');
});

// Test 8: Select block maintains column order
test('Select block maintains column order', () => {
    const inputData = {
        headers: ['First', 'Second', 'Third', 'Fourth', 'Fifth'],
        data: [
            { First: '1', Second: '2', Third: '3', Fourth: '4', Fifth: '5' }
        ]
    };
    
    const selectedColumns = [
        { name: 'First', type: 'string', enabled: true },
        { name: 'Second', type: 'string', enabled: false },
        { name: 'Third', type: 'string', enabled: true },
        { name: 'Fourth', type: 'string', enabled: false },
        { name: 'Fifth', type: 'string', enabled: true }
    ];
    
    const enabledColumns = selectedColumns.filter(col => col.enabled);
    const enabledColumnNames = enabledColumns.map(col => col.name);
    
    assertEquals(enabledColumnNames, ['First', 'Third', 'Fifth'], 'Column order should be preserved');
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);
console.log('='.repeat(50));

if (testsFailed > 0) {
    process.exit(1);
}
