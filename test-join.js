/**
 * Test Suite for Join Block
 * Tests the join functionality for combining two datasets
 */

// Mock DOM elements needed for testing
global.document = {
    getElementById: function(id) {
        return {
            innerHTML: '',
            style: { display: 'none' },
            value: '',
            addEventListener: function() {},
            querySelectorAll: function() { return []; }
        };
    },
    createElement: function() {
        return {
            textContent: '',
            innerHTML: '',
            addEventListener: function() {}
        };
    },
    querySelectorAll: function() { return []; }
};

// Load the app.js file to test functions
const fs = require('fs');
const appCode = fs.readFileSync('./app.js', 'utf8');

// Extract and evaluate the performJoin function - it's at the end of the file
const joinFunctionMatch = appCode.match(/function performJoin[\s\S]*$/);
if (!joinFunctionMatch) {
    console.error('❌ Could not find performJoin function');
    process.exit(1);
}

// Evaluate the function
eval(joinFunctionMatch[0]);

// Test counters
let passed = 0;
let failed = 0;

function test(description, fn) {
    try {
        fn();
        console.log(`✅ PASS: ${description}`);
        passed++;
    } catch (error) {
        console.log(`❌ FAIL: ${description}`);
        console.log(`   Error: ${error.message}`);
        failed++;
    }
}

function assertEqual(actual, expected, message) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`${message}\n   Expected: ${JSON.stringify(expected)}\n   Actual: ${JSON.stringify(actual)}`);
    }
}

function assertGreaterThan(actual, expected, message) {
    if (actual <= expected) {
        throw new Error(`${message}\n   Expected: > ${expected}\n   Actual: ${actual}`);
    }
}

console.log('🧪 Running Join Block Tests\n');

// Test data - Employees dataset
const employeesData = {
    headers: ['EmpID', 'Name', 'DeptID'],
    data: [
        { EmpID: '1', Name: 'John Doe', DeptID: 'D1' },
        { EmpID: '2', Name: 'Jane Smith', DeptID: 'D2' },
        { EmpID: '3', Name: 'Bob Johnson', DeptID: 'D1' },
        { EmpID: '4', Name: 'Alice Brown', DeptID: 'D3' }
    ]
};

// Test data - Departments dataset
const departmentsData = {
    headers: ['DeptID', 'DeptName', 'Location'],
    data: [
        { DeptID: 'D1', DeptName: 'Sales', Location: 'New York' },
        { DeptID: 'D2', DeptName: 'Marketing', Location: 'London' },
        { DeptID: 'D4', DeptName: 'HR', Location: 'Paris' }
    ]
};

// Test 1: Inner Join - only matching records
test('Inner join returns only matching records', () => {
    const result = performJoin(employeesData, departmentsData, 'DeptID', 'DeptID', 'inner');
    
    // Should have 3 rows (D1, D1, D2) - D3 from employees and D4 from departments have no match
    assertEqual(result.data.length, 3, 'Inner join should return 3 matching rows');
    
    // Check that all result rows have data from both datasets
    assertEqual(result.data[0].Name, 'John Doe', 'First row should have employee name');
    assertEqual(result.data[0].DeptName, 'Sales', 'First row should have department name');
    
    // Check headers include columns from both datasets
    assertGreaterThan(result.headers.length, employeesData.headers.length, 'Headers should include columns from both datasets');
});

// Test 2: Left Join - all left records + matching right records
test('Left join returns all left records with matching right data', () => {
    const result = performJoin(employeesData, departmentsData, 'DeptID', 'DeptID', 'left');
    
    // Should have 4 rows (all employees)
    assertEqual(result.data.length, 4, 'Left join should return all 4 employee rows');
    
    // Check that matched rows have department data
    assertEqual(result.data[0].DeptName, 'Sales', 'Matched row should have department name');
    
    // Check that unmatched row (Alice Brown, D3) has empty department fields
    const aliceRow = result.data.find(row => row.Name === 'Alice Brown');
    assertEqual(aliceRow.DeptName, '', 'Unmatched row should have empty department name');
});

// Test 3: Right Join - all right records + matching left records
test('Right join returns all right records with matching left data', () => {
    const result = performJoin(employeesData, departmentsData, 'DeptID', 'DeptID', 'right');
    
    // Should have 4 rows (3 matched + 1 unmatched department D4)
    assertEqual(result.data.length, 4, 'Right join should return 4 rows');
    
    // Check that unmatched department (HR, D4) has empty employee fields
    const hrRow = result.data.find(row => row.DeptName === 'HR');
    assertEqual(hrRow.Name, '', 'Unmatched department should have empty employee name');
});

// Test 4: Outer Join - all records from both datasets
test('Outer join returns all records from both datasets', () => {
    const result = performJoin(employeesData, departmentsData, 'DeptID', 'DeptID', 'outer');
    
    // Should have 5 rows (3 matched + 1 unmatched employee + 1 unmatched department)
    assertEqual(result.data.length, 5, 'Outer join should return 5 rows');
    
    // Check that both unmatched records are present
    const aliceRow = result.data.find(row => row.Name === 'Alice Brown');
    const hrRow = result.data.find(row => row.DeptName === 'HR');
    
    assertEqual(aliceRow.DeptName, '', 'Unmatched employee should have empty department data');
    assertEqual(hrRow.Name, '', 'Unmatched department should have empty employee data');
});

// Test 5: Join with duplicate keys (one-to-many relationship)
test('Join handles one-to-many relationships correctly', () => {
    // D1 appears twice in employees (John and Bob)
    const result = performJoin(employeesData, departmentsData, 'DeptID', 'DeptID', 'inner');
    
    // Check that both John and Bob have the Sales department
    const johnRow = result.data.find(row => row.Name === 'John Doe');
    const bobRow = result.data.find(row => row.Name === 'Bob Johnson');
    
    assertEqual(johnRow.DeptName, 'Sales', 'John should be in Sales');
    assertEqual(bobRow.DeptName, 'Sales', 'Bob should be in Sales');
});

// Test 6: Join with different column names
test('Join works with different key column names', () => {
    const ordersData = {
        headers: ['OrderID', 'CustomerID', 'Amount'],
        data: [
            { OrderID: 'O1', CustomerID: 'C1', Amount: '100' },
            { OrderID: 'O2', CustomerID: 'C2', Amount: '200' }
        ]
    };
    
    const customersData = {
        headers: ['ID', 'CustomerName'],
        data: [
            { ID: 'C1', CustomerName: 'ACME Corp' },
            { ID: 'C2', CustomerName: 'TechCo' }
        ]
    };
    
    const result = performJoin(ordersData, customersData, 'CustomerID', 'ID', 'inner');
    
    assertEqual(result.data.length, 2, 'Should join 2 orders with customers');
    assertEqual(result.data[0].CustomerName, 'ACME Corp', 'First order should have customer name');
});

// Test 7: Join preserves all columns from both datasets
test('Join includes all columns from both datasets', () => {
    const result = performJoin(employeesData, departmentsData, 'DeptID', 'DeptID', 'inner');
    
    // Check that result headers include columns from both datasets
    const hasName = result.headers.includes('Name');
    const hasDeptName = result.headers.includes('DeptName');
    const hasLocation = result.headers.includes('Location');
    
    assertEqual(hasName, true, 'Should have Name column from left dataset');
    assertEqual(hasDeptName, true, 'Should have DeptName column from right dataset');
    assertEqual(hasLocation, true, 'Should have Location column from right dataset');
});

// Test 8: Join with empty dataset
test('Join with empty left dataset returns empty result for inner join', () => {
    const emptyData = {
        headers: ['EmpID', 'Name'],
        data: []
    };
    
    const result = performJoin(emptyData, departmentsData, 'DeptID', 'DeptID', 'inner');
    
    assertEqual(result.data.length, 0, 'Inner join with empty left should return no rows');
});

// Test 9: Join returns correct headers structure
test('Join returns proper data structure with headers and data', () => {
    const result = performJoin(employeesData, departmentsData, 'DeptID', 'DeptID', 'inner');
    
    assertEqual(Array.isArray(result.headers), true, 'Result should have headers array');
    assertEqual(Array.isArray(result.data), true, 'Result should have data array');
    assertEqual(typeof result.joinInfo, 'object', 'Result should have joinInfo metadata');
});

// Test 10: Join info contains correct metadata
test('Join includes metadata about the operation', () => {
    const result = performJoin(employeesData, departmentsData, 'DeptID', 'DeptID', 'inner');
    
    assertEqual(result.joinInfo.type, 'inner', 'Join info should have correct type');
    assertEqual(result.joinInfo.leftKey, 'DeptID', 'Join info should have left key');
    assertEqual(result.joinInfo.rightKey, 'DeptID', 'Join info should have right key');
    assertEqual(result.joinInfo.leftRows, 4, 'Join info should have left row count');
    assertEqual(result.joinInfo.rightRows, 3, 'Join info should have right row count');
});

console.log('\n==================================================');
console.log('Test Summary');
console.log('==================================================');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📊 Total:  ${passed + failed}`);
console.log('==================================================\n');

if (failed > 0) {
    console.log('❌ Some tests failed!');
    process.exit(1);
} else {
    console.log('✅ All tests passed!');
    process.exit(0);
}
