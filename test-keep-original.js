/**
 * Test Suite for Keep Original Column Feature
 * Tests the new keepOriginal toggle in transformation blocks
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

// Extract and evaluate the transformation logic function
const transformLogicMatch = appCode.match(/function applyAdvancedTransformationLogic[\s\S]*?(?=\n(?:function|\/\/))/);
if (!transformLogicMatch) {
    console.error('❌ Could not find applyAdvancedTransformationLogic function');
    process.exit(1);
}

// Evaluate the function
eval(transformLogicMatch[0]);

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

function assertUndefined(actual, message) {
    if (actual !== undefined) {
        throw new Error(`${message}\n   Expected: undefined\n   Actual: ${actual}`);
    }
}

console.log('🧪 Running Keep Original Column Feature Tests\n');

// Test data
const testInputData = {
    headers: ['FirstName', 'LastName', 'Email', 'Department'],
    data: [
        { FirstName: 'John', LastName: 'Doe', Email: 'john.doe@company.com', Department: 'Sales' },
        { FirstName: 'Jane', LastName: 'Smith', Email: 'jane.smith@company.com', Department: 'Marketing' }
    ]
};

// Test 1: Copy/Rename with keepOriginal=false (default behavior - removes original)
test('Copy/Rename without keepOriginal removes the original column', () => {
    const transformation = {
        'Material': {
            op: 'copy',
            inputs: ['FirstName'],
            params: { keepOriginal: false }
        }
    };
    
    const result = applyAdvancedTransformationLogic(testInputData, transformation, true);
    
    assertEqual(result.data[0].Material, 'John', 'Material should have copied value');
    assertUndefined(result.data[0].FirstName, 'FirstName should NOT be preserved');
    assertEqual(result.data[0].Email, 'john.doe@company.com', 'Email should still be there');
});

// Test 2: Copy/Rename with keepOriginal=true (keeps original)
test('Copy/Rename with keepOriginal preserves the original column', () => {
    const transformation = {
        'Material': {
            op: 'copy',
            inputs: ['FirstName'],
            params: { keepOriginal: true }
        }
    };
    
    const result = applyAdvancedTransformationLogic(testInputData, transformation, true);
    
    assertEqual(result.data[0].Material, 'John', 'Material should have copied value');
    assertEqual(result.data[0].FirstName, 'John', 'FirstName SHOULD be preserved');
    assertEqual(result.data[1].FirstName, 'Jane', 'FirstName SHOULD be preserved for all rows');
});

// Test 3: Split with keepOriginal=false (default behavior - removes original)
test('Split without keepOriginal removes the original column', () => {
    const transformation = {
        'Domain': {
            op: 'split',
            inputs: ['Email'],
            params: { delimiter: '@', index: 1, keepOriginal: false }
        }
    };
    
    const result = applyAdvancedTransformationLogic(testInputData, transformation, true);
    
    assertEqual(result.data[0].Domain, 'company.com', 'Domain should be extracted');
    assertUndefined(result.data[0].Email, 'Email should NOT be preserved');
});

// Test 4: Split with keepOriginal=true (keeps original)
test('Split with keepOriginal preserves the original column', () => {
    const transformation = {
        'Domain': {
            op: 'split',
            inputs: ['Email'],
            params: { delimiter: '@', index: 1, keepOriginal: true }
        }
    };
    
    const result = applyAdvancedTransformationLogic(testInputData, transformation, true);
    
    assertEqual(result.data[0].Domain, 'company.com', 'Domain should be extracted');
    assertEqual(result.data[0].Email, 'john.doe@company.com', 'Email SHOULD be preserved');
});

// Test 5: Case Change with keepOriginal=false
test('Case Change without keepOriginal removes the original column', () => {
    const transformation = {
        'UpperDept': {
            op: 'case',
            inputs: ['Department'],
            params: { type: 'upper', keepOriginal: false }
        }
    };
    
    const result = applyAdvancedTransformationLogic(testInputData, transformation, true);
    
    assertEqual(result.data[0].UpperDept, 'SALES', 'UpperDept should be uppercase');
    assertUndefined(result.data[0].Department, 'Department should NOT be preserved');
});

// Test 6: Case Change with keepOriginal=true
test('Case Change with keepOriginal preserves the original column', () => {
    const transformation = {
        'UpperDept': {
            op: 'case',
            inputs: ['Department'],
            params: { type: 'upper', keepOriginal: true }
        }
    };
    
    const result = applyAdvancedTransformationLogic(testInputData, transformation, true);
    
    assertEqual(result.data[0].UpperDept, 'SALES', 'UpperDept should be uppercase');
    assertEqual(result.data[0].Department, 'Sales', 'Department SHOULD be preserved');
});

// Test 7: Math with keepOriginal=false (removes all input columns)
test('Math without keepOriginal removes the original columns', () => {
    const mathData = {
        headers: ['Price', 'Quantity', 'Tax'],
        data: [
            { Price: '100', Quantity: '5', Tax: '10' },
            { Price: '200', Quantity: '3', Tax: '20' }
        ]
    };
    
    const transformation = {
        'Total': {
            op: 'math',
            inputs: ['Price', 'Quantity'],
            params: { mathOp: 'multiply', round: '0', keepOriginal: false }
        }
    };
    
    const result = applyAdvancedTransformationLogic(mathData, transformation, true);
    
    assertEqual(result.data[0].Total, '500', 'Total should be calculated');
    assertUndefined(result.data[0].Price, 'Price should NOT be preserved');
    assertUndefined(result.data[0].Quantity, 'Quantity should NOT be preserved');
    assertEqual(result.data[0].Tax, '10', 'Tax (unused column) should still be there');
});

// Test 8: Math with keepOriginal=true (keeps all input columns)
test('Math with keepOriginal preserves the original columns', () => {
    const mathData = {
        headers: ['Price', 'Quantity', 'Tax'],
        data: [
            { Price: '100', Quantity: '5', Tax: '10' },
            { Price: '200', Quantity: '3', Tax: '20' }
        ]
    };
    
    const transformation = {
        'Total': {
            op: 'math',
            inputs: ['Price', 'Quantity'],
            params: { mathOp: 'multiply', round: '0', keepOriginal: true }
        }
    };
    
    const result = applyAdvancedTransformationLogic(mathData, transformation, true);
    
    assertEqual(result.data[0].Total, '500', 'Total should be calculated');
    assertEqual(result.data[0].Price, '100', 'Price SHOULD be preserved');
    assertEqual(result.data[0].Quantity, '5', 'Quantity SHOULD be preserved');
});

// Test 9: Regex Replace with keepOriginal=false
test('Regex Replace without keepOriginal removes the original column', () => {
    const regexData = {
        headers: ['Code', 'Name'],
        data: [
            { Code: 'ABC123DEF', Name: 'Product1' },
            { Code: 'XYZ456', Name: 'Product2' }
        ]
    };
    
    const transformation = {
        'CleanCode': {
            op: 'regex',
            inputs: ['Code'],
            params: { pattern: '[0-9]+', replacement: '', keepOriginal: false }
        }
    };
    
    const result = applyAdvancedTransformationLogic(regexData, transformation, true);
    
    assertEqual(result.data[0].CleanCode, 'ABCDEF', 'CleanCode should be cleaned');
    assertUndefined(result.data[0].Code, 'Code should NOT be preserved');
});

// Test 10: Regex Replace with keepOriginal=true
test('Regex Replace with keepOriginal preserves the original column', () => {
    const regexData = {
        headers: ['Code', 'Name'],
        data: [
            { Code: 'ABC123DEF', Name: 'Product1' },
            { Code: 'XYZ456', Name: 'Product2' }
        ]
    };
    
    const transformation = {
        'CleanCode': {
            op: 'regex',
            inputs: ['Code'],
            params: { pattern: '[0-9]+', replacement: '', keepOriginal: true }
        }
    };
    
    const result = applyAdvancedTransformationLogic(regexData, transformation, true);
    
    assertEqual(result.data[0].CleanCode, 'ABCDEF', 'CleanCode should be cleaned');
    assertEqual(result.data[0].Code, 'ABC123DEF', 'Code SHOULD be preserved');
});

// Test 11: Multiple transformations with different keepOriginal settings
test('Multiple transformations can have independent keepOriginal settings', () => {
    const transformation1 = {
        'Material': {
            op: 'copy',
            inputs: ['FirstName'],
            params: { keepOriginal: true }  // Keep FirstName
        }
    };
    
    const result1 = applyAdvancedTransformationLogic(testInputData, transformation1, true);
    
    // Now apply another transformation that doesn't keep original
    const transformation2 = {
        'UpperDept': {
            op: 'case',
            inputs: ['Department'],
            params: { type: 'upper', keepOriginal: false }  // Don't keep Department
        }
    };
    
    const result2 = applyAdvancedTransformationLogic(result1, transformation2, true);
    
    // FirstName should still be there (from transformation1 with keepOriginal=true)
    assertEqual(result2.data[0].FirstName, 'John', 'FirstName should be preserved from first transformation');
    assertEqual(result2.data[0].Material, 'John', 'Material should exist');
    
    // Department should be gone (from transformation2 with keepOriginal=false)
    assertUndefined(result2.data[0].Department, 'Department should NOT be preserved');
    assertEqual(result2.data[0].UpperDept, 'SALES', 'UpperDept should exist');
});

// Test 12: Backward compatibility - no keepOriginal param defaults to false
test('Transformation without keepOriginal param defaults to removing original column', () => {
    const transformation = {
        'Material': {
            op: 'copy',
            inputs: ['FirstName'],
            params: {}  // No keepOriginal specified
        }
    };
    
    const result = applyAdvancedTransformationLogic(testInputData, transformation, true);
    
    assertEqual(result.data[0].Material, 'John', 'Material should have copied value');
    assertUndefined(result.data[0].FirstName, 'FirstName should NOT be preserved (default behavior)');
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
