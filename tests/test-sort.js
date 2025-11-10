/**
 * Test Suite for Sort Block
 * Tests the Sort block functionality
 */

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

function assertNotEqual(actual, expected, message) {
    if (JSON.stringify(actual) === JSON.stringify(expected)) {
        throw new Error(`${message}\n   Expected different from: ${JSON.stringify(expected)}\n   Actual: ${JSON.stringify(actual)}`);
    }
}

console.log('🧪 Running Sort Block Tests\n');

// Test data
const testInputData = {
    headers: ['Name', 'Age', 'Salary', 'Department'],
    data: [
        { Name: 'John', Age: '30', Salary: '50000', Department: 'Sales' },
        { Name: 'Alice', Age: '25', Salary: '60000', Department: 'Marketing' },
        { Name: 'Bob', Age: '35', Salary: '55000', Department: 'Sales' },
        { Name: 'Charlie', Age: '28', Salary: '70000', Department: 'Engineering' },
        { Name: 'Diana', Age: '32', Salary: '65000', Department: 'Marketing' }
    ]
};

// Test 1: Sort by single column ascending (string)
test('Sort by Name ascending', () => {
    const sortedData = {
        headers: testInputData.headers,
        data: [...testInputData.data]
    };
    
    sortedData.data.sort((a, b) => {
        return String(a.Name).localeCompare(String(b.Name));
    });
    
    assertEqual(sortedData.data[0].Name, 'Alice', 'First row should be Alice');
    assertEqual(sortedData.data[1].Name, 'Bob', 'Second row should be Bob');
    assertEqual(sortedData.data[4].Name, 'John', 'Last row should be John');
});

// Test 2: Sort by single column descending (string)
test('Sort by Name descending', () => {
    const sortedData = {
        headers: testInputData.headers,
        data: [...testInputData.data]
    };
    
    sortedData.data.sort((a, b) => {
        return -String(a.Name).localeCompare(String(b.Name));
    });
    
    assertEqual(sortedData.data[0].Name, 'John', 'First row should be John');
    assertEqual(sortedData.data[4].Name, 'Alice', 'Last row should be Alice');
});

// Test 3: Sort by numeric column ascending
test('Sort by Age ascending (numeric)', () => {
    const sortedData = {
        headers: testInputData.headers,
        data: [...testInputData.data]
    };
    
    sortedData.data.sort((a, b) => {
        const aNum = parseFloat(a.Age);
        const bNum = parseFloat(b.Age);
        return aNum - bNum;
    });
    
    assertEqual(sortedData.data[0].Age, '25', 'First row should have age 25');
    assertEqual(sortedData.data[0].Name, 'Alice', 'First row should be Alice');
    assertEqual(sortedData.data[4].Age, '35', 'Last row should have age 35');
});

// Test 4: Sort by numeric column descending
test('Sort by Salary descending (numeric)', () => {
    const sortedData = {
        headers: testInputData.headers,
        data: [...testInputData.data]
    };
    
    sortedData.data.sort((a, b) => {
        const aNum = parseFloat(a.Salary);
        const bNum = parseFloat(b.Salary);
        return bNum - aNum;
    });
    
    assertEqual(sortedData.data[0].Salary, '70000', 'First row should have highest salary');
    assertEqual(sortedData.data[0].Name, 'Charlie', 'First row should be Charlie');
    assertEqual(sortedData.data[4].Salary, '50000', 'Last row should have lowest salary');
});

// Test 5: Multi-column sort (Department asc, then Salary desc)
test('Sort by Department ascending, then Salary descending', () => {
    const sortedData = {
        headers: testInputData.headers,
        data: [...testInputData.data]
    };
    
    sortedData.data.sort((a, b) => {
        // First by Department
        const deptComp = String(a.Department).localeCompare(String(b.Department));
        if (deptComp !== 0) return deptComp;
        
        // Then by Salary descending
        const aNum = parseFloat(a.Salary);
        const bNum = parseFloat(b.Salary);
        return bNum - aNum;
    });
    
    // Engineering should be first (only one)
    assertEqual(sortedData.data[0].Department, 'Engineering', 'First should be Engineering');
    assertEqual(sortedData.data[0].Name, 'Charlie', 'First should be Charlie');
    
    // Marketing should be next (Diana has higher salary than Alice)
    assertEqual(sortedData.data[1].Department, 'Marketing', 'Second should be Marketing');
    assertEqual(sortedData.data[1].Name, 'Diana', 'Second should be Diana');
    assertEqual(sortedData.data[2].Department, 'Marketing', 'Third should be Marketing');
    assertEqual(sortedData.data[2].Name, 'Alice', 'Third should be Alice');
    
    // Sales should be last (Bob has higher salary than John)
    assertEqual(sortedData.data[3].Department, 'Sales', 'Fourth should be Sales');
    assertEqual(sortedData.data[3].Name, 'Bob', 'Fourth should be Bob');
    assertEqual(sortedData.data[4].Department, 'Sales', 'Fifth should be Sales');
    assertEqual(sortedData.data[4].Name, 'John', 'Fifth should be John');
});

// Test 6: Sort preserves all columns
test('Sort preserves all columns and data', () => {
    const sortedData = {
        headers: testInputData.headers,
        data: [...testInputData.data]
    };
    
    sortedData.data.sort((a, b) => {
        return String(a.Name).localeCompare(String(b.Name));
    });
    
    assertEqual(sortedData.headers.length, testInputData.headers.length, 'Headers should be preserved');
    assertEqual(sortedData.data.length, testInputData.data.length, 'Row count should be preserved');
    
    // Check that all original data is still present
    const originalNames = testInputData.data.map(r => r.Name).sort();
    const sortedNames = sortedData.data.map(r => r.Name).sort();
    assertEqual(sortedNames, originalNames, 'All names should still be present');
});

// Test 7: Sort with null/undefined values
test('Sort handles null/undefined values', () => {
    const dataWithNulls = {
        headers: ['Name', 'Value'],
        data: [
            { Name: 'C', Value: '30' },
            { Name: 'A', Value: null },
            { Name: 'B', Value: '20' },
            { Name: 'D', Value: undefined }
        ]
    };
    
    const sortedData = {
        headers: dataWithNulls.headers,
        data: [...dataWithNulls.data]
    };
    
    sortedData.data.sort((a, b) => {
        const aVal = a.Value;
        const bVal = b.Value;
        
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1; // nulls at end for ascending
        if (bVal == null) return -1;
        
        const aNum = parseFloat(aVal);
        const bNum = parseFloat(bVal);
        return aNum - bNum;
    });
    
    // Values 20, 30 should come first, then nulls
    assertEqual(sortedData.data[0].Value, '20', 'First should be 20');
    assertEqual(sortedData.data[1].Value, '30', 'Second should be 30');
    assertEqual(sortedData.data[2].Value, null, 'Third should be null');
    assertEqual(sortedData.data[3].Value, undefined, 'Fourth should be undefined');
});

// Test 8: Sort doesn't mutate original data
test('Sort creates a copy and does not mutate original', () => {
    const originalData = {
        headers: ['Name', 'Age'],
        data: [
            { Name: 'Bob', Age: '30' },
            { Name: 'Alice', Age: '25' }
        ]
    };
    
    const sortedData = {
        headers: originalData.headers,
        data: [...originalData.data]
    };
    
    sortedData.data.sort((a, b) => {
        return String(a.Name).localeCompare(String(b.Name));
    });
    
    // Original should still have Bob first
    assertEqual(originalData.data[0].Name, 'Bob', 'Original data should not be mutated');
    
    // Sorted should have Alice first
    assertEqual(sortedData.data[0].Name, 'Alice', 'Sorted data should have Alice first');
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
