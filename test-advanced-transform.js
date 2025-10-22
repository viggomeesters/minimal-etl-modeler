// Test for advanced transform module
// This test validates the advanced transformation functionality

const fs = require('fs');
const path = require('path');

console.log('🧪 Running Advanced Transform Module Tests\n');

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

// Load app.js to get transformation functions
const appJs = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');

// Extract and evaluate the transformation functions
// We need to create a safe evaluation context
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

// Helper to evaluate functions in context
function evalInContext(code) {
    return function() {
        return eval(code);
    }.call(context);
}

// Extract the applyAdvancedTransformationLogic function
const advancedTransformMatch = appJs.match(/function applyAdvancedTransformationLogic\([\s\S]*?\n(?=\n\/\/|function [a-zA-Z])/);
if (!advancedTransformMatch) {
    console.error('Could not extract applyAdvancedTransformationLogic function');
    process.exit(1);
}
const advancedTransformCode = advancedTransformMatch[0];

// Extract helper functions
const formatDateMatch = appJs.match(/function formatDate\([\s\S]*?\n(?=\n\/\/|function [a-zA-Z])/);
const formatDateCode = formatDateMatch ? formatDateMatch[0] : '';

const evaluateSafeExpressionMatch = appJs.match(/function evaluateSafeExpression\([\s\S]*?\n(?=\n\/\/|function [a-zA-Z])/);
const evaluateSafeExpressionCode = evaluateSafeExpressionMatch ? evaluateSafeExpressionMatch[0] : '';

// Create the functions
eval(formatDateCode);
eval(evaluateSafeExpressionCode);
eval(advancedTransformCode);

// Test 1: Concatenate operation
test('Concatenate operation combines columns', () => {
    const inputData = {
        headers: ['FirstName', 'LastName'],
        data: [
            { FirstName: 'John', LastName: 'Doe' },
            { FirstName: 'Jane', LastName: 'Smith' }
        ]
    };
    
    const transformations = {
        'FullName': {
            op: 'concatenate',
            inputs: ['FirstName', 'LastName'],
            params: { separator: ' ' }
        }
    };
    
    const result = applyAdvancedTransformationLogic(inputData, transformations);
    
    if (result.data[0].FullName !== 'John Doe') {
        throw new Error(`Expected 'John Doe', got '${result.data[0].FullName}'`);
    }
    
    if (result.data[1].FullName !== 'Jane Smith') {
        throw new Error(`Expected 'Jane Smith', got '${result.data[1].FullName}'`);
    }
});

// Test 2: Concatenate with custom separator
test('Concatenate with custom separator', () => {
    const inputData = {
        headers: ['City', 'Country'],
        data: [
            { City: 'Amsterdam', Country: 'Netherlands' }
        ]
    };
    
    const transformations = {
        'Location': {
            op: 'concatenate',
            inputs: ['City', 'Country'],
            params: { separator: ', ' }
        }
    };
    
    const result = applyAdvancedTransformationLogic(inputData, transformations);
    
    if (result.data[0].Location !== 'Amsterdam, Netherlands') {
        throw new Error(`Expected 'Amsterdam, Netherlands', got '${result.data[0].Location}'`);
    }
});

// Test 3: Split operation
test('Split operation extracts part of string', () => {
    const inputData = {
        headers: ['Email'],
        data: [
            { Email: 'john.doe@example.com' },
            { Email: 'jane.smith@company.org' }
        ]
    };
    
    const transformations = {
        'Username': {
            op: 'split',
            inputs: ['Email'],
            params: { delimiter: '@', index: 0 }
        },
        'Domain': {
            op: 'split',
            inputs: ['Email'],
            params: { delimiter: '@', index: 1 }
        }
    };
    
    const result = applyAdvancedTransformationLogic(inputData, transformations);
    
    if (result.data[0].Username !== 'john.doe') {
        throw new Error(`Expected 'john.doe', got '${result.data[0].Username}'`);
    }
    
    if (result.data[0].Domain !== 'example.com') {
        throw new Error(`Expected 'example.com', got '${result.data[0].Domain}'`);
    }
});

// Test 4: Case change - uppercase
test('Case change to uppercase', () => {
    const inputData = {
        headers: ['Name'],
        data: [
            { Name: 'john doe' }
        ]
    };
    
    const transformations = {
        'UpperName': {
            op: 'case',
            inputs: ['Name'],
            params: { type: 'upper' }
        }
    };
    
    const result = applyAdvancedTransformationLogic(inputData, transformations);
    
    if (result.data[0].UpperName !== 'JOHN DOE') {
        throw new Error(`Expected 'JOHN DOE', got '${result.data[0].UpperName}'`);
    }
});

// Test 5: Case change - lowercase
test('Case change to lowercase', () => {
    const inputData = {
        headers: ['Name'],
        data: [
            { Name: 'JOHN DOE' }
        ]
    };
    
    const transformations = {
        'LowerName': {
            op: 'case',
            inputs: ['Name'],
            params: { type: 'lower' }
        }
    };
    
    const result = applyAdvancedTransformationLogic(inputData, transformations);
    
    if (result.data[0].LowerName !== 'john doe') {
        throw new Error(`Expected 'john doe', got '${result.data[0].LowerName}'`);
    }
});

// Test 6: Case change - capitalize
test('Case change to capitalize', () => {
    const inputData = {
        headers: ['Name'],
        data: [
            { Name: 'jOHN dOE' }
        ]
    };
    
    const transformations = {
        'CapitalName': {
            op: 'case',
            inputs: ['Name'],
            params: { type: 'capitalize' }
        }
    };
    
    const result = applyAdvancedTransformationLogic(inputData, transformations);
    
    if (result.data[0].CapitalName !== 'John doe') {
        throw new Error(`Expected 'John doe', got '${result.data[0].CapitalName}'`);
    }
});

// Test 7: Math - addition
test('Math operation - addition', () => {
    const inputData = {
        headers: ['Price', 'Tax'],
        data: [
            { Price: '100', Tax: '21' }
        ]
    };
    
    const transformations = {
        'Total': {
            op: 'math',
            inputs: ['Price', 'Tax'],
            params: { mathOp: 'add', round: 'none' }
        }
    };
    
    const result = applyAdvancedTransformationLogic(inputData, transformations);
    
    if (result.data[0].Total !== '121') {
        throw new Error(`Expected '121', got '${result.data[0].Total}'`);
    }
});

// Test 8: Math - subtraction
test('Math operation - subtraction', () => {
    const inputData = {
        headers: ['Total', 'Discount'],
        data: [
            { Total: '100', Discount: '15' }
        ]
    };
    
    const transformations = {
        'FinalPrice': {
            op: 'math',
            inputs: ['Total', 'Discount'],
            params: { mathOp: 'subtract', round: 'none' }
        }
    };
    
    const result = applyAdvancedTransformationLogic(inputData, transformations);
    
    if (result.data[0].FinalPrice !== '85') {
        throw new Error(`Expected '85', got '${result.data[0].FinalPrice}'`);
    }
});

// Test 9: Math - multiplication
test('Math operation - multiplication', () => {
    const inputData = {
        headers: ['Quantity', 'Price'],
        data: [
            { Quantity: '5', Price: '10.50' }
        ]
    };
    
    const transformations = {
        'Total': {
            op: 'math',
            inputs: ['Quantity', 'Price'],
            params: { mathOp: 'multiply', round: '2' }
        }
    };
    
    const result = applyAdvancedTransformationLogic(inputData, transformations);
    
    if (result.data[0].Total !== '52.5') {
        throw new Error(`Expected '52.5', got '${result.data[0].Total}'`);
    }
});

// Test 10: Math - division with rounding
test('Math operation - division with rounding', () => {
    const inputData = {
        headers: ['Total', 'Count'],
        data: [
            { Total: '100', Count: '3' }
        ]
    };
    
    const transformations = {
        'Average': {
            op: 'math',
            inputs: ['Total', 'Count'],
            params: { mathOp: 'divide', round: '2' }
        }
    };
    
    const result = applyAdvancedTransformationLogic(inputData, transformations);
    
    const avg = parseFloat(result.data[0].Average);
    if (Math.abs(avg - 33.33) > 0.01) {
        throw new Error(`Expected '33.33', got '${result.data[0].Average}'`);
    }
});

// Test 11: Regex replace
test('Regex replace removes digits', () => {
    const inputData = {
        headers: ['Code'],
        data: [
            { Code: 'ABC123XYZ' }
        ]
    };
    
    const transformations = {
        'Letters': {
            op: 'regex',
            inputs: ['Code'],
            params: { pattern: '[0-9]+', replacement: '' }
        }
    };
    
    const result = applyAdvancedTransformationLogic(inputData, transformations);
    
    if (result.data[0].Letters !== 'ABCXYZ') {
        throw new Error(`Expected 'ABCXYZ', got '${result.data[0].Letters}'`);
    }
});

// Test 12: Regex replace with replacement text
test('Regex replace substitutes pattern', () => {
    const inputData = {
        headers: ['Phone'],
        data: [
            { Phone: '123-456-7890' }
        ]
    };
    
    const transformations = {
        'CleanPhone': {
            op: 'regex',
            inputs: ['Phone'],
            params: { pattern: '-', replacement: '' }
        }
    };
    
    const result = applyAdvancedTransformationLogic(inputData, transformations);
    
    if (result.data[0].CleanPhone !== '1234567890') {
        throw new Error(`Expected '1234567890', got '${result.data[0].CleanPhone}'`);
    }
});

// Test 13: Copy operation (simple rename)
test('Copy operation renames column', () => {
    const inputData = {
        headers: ['OldName'],
        data: [
            { OldName: 'Value1' }
        ]
    };
    
    const transformations = {
        'NewName': {
            op: 'copy',
            inputs: ['OldName'],
            params: {}
        }
    };
    
    const result = applyAdvancedTransformationLogic(inputData, transformations);
    
    if (result.data[0].NewName !== 'Value1') {
        throw new Error(`Expected 'Value1', got '${result.data[0].NewName}'`);
    }
});

// Test 14: Expression with column substitution
test('Expression substitutes column values', () => {
    const inputData = {
        headers: ['A', 'B'],
        data: [
            { A: 'Hello', B: 'World' }
        ]
    };
    
    const transformations = {
        'Combined': {
            op: 'expression',
            inputs: [],
            params: { expression: '${A}-${B}' }
        }
    };
    
    const result = applyAdvancedTransformationLogic(inputData, transformations);
    
    if (result.data[0].Combined !== 'Hello-World') {
        throw new Error(`Expected 'Hello-World', got '${result.data[0].Combined}'`);
    }
});

// Test 15: Date formatting to YYYY-MM-DD
test('Date formatting to YYYY-MM-DD', () => {
    const inputData = {
        headers: ['ISODate'],
        data: [
            { ISODate: '2024-01-15T10:30:00.000Z' }
        ]
    };
    
    const transformations = {
        'FormattedDate': {
            op: 'date',
            inputs: ['ISODate'],
            params: { inputFormat: 'ISO', outputFormat: 'YYYY-MM-DD' }
        }
    };
    
    const result = applyAdvancedTransformationLogic(inputData, transformations);
    
    if (result.data[0].FormattedDate !== '2024-01-15') {
        throw new Error(`Expected '2024-01-15', got '${result.data[0].FormattedDate}'`);
    }
});

// Test 16: Multiple transformations on same dataset
test('Multiple transformations work together', () => {
    const inputData = {
        headers: ['First', 'Last', 'Email'],
        data: [
            { First: 'john', Last: 'doe', Email: 'john.doe@example.com' }
        ]
    };
    
    const transformations = {
        'FullName': {
            op: 'concatenate',
            inputs: ['First', 'Last'],
            params: { separator: ' ' }
        },
        'UpperName': {
            op: 'case',
            inputs: ['First'],
            params: { type: 'upper' }
        },
        'Domain': {
            op: 'split',
            inputs: ['Email'],
            params: { delimiter: '@', index: 1 }
        }
    };
    
    const result = applyAdvancedTransformationLogic(inputData, transformations);
    
    if (result.data[0].FullName !== 'john doe') {
        throw new Error(`Expected 'john doe', got '${result.data[0].FullName}'`);
    }
    
    if (result.data[0].UpperName !== 'JOHN') {
        throw new Error(`Expected 'JOHN', got '${result.data[0].UpperName}'`);
    }
    
    if (result.data[0].Domain !== 'example.com') {
        throw new Error(`Expected 'example.com', got '${result.data[0].Domain}'`);
    }
});

// Test 17: Empty input handling
test('Empty input values handled gracefully', () => {
    const inputData = {
        headers: ['A', 'B'],
        data: [
            { A: '', B: 'Value' }
        ]
    };
    
    const transformations = {
        'Result': {
            op: 'concatenate',
            inputs: ['A', 'B'],
            params: { separator: '-' }
        }
    };
    
    const result = applyAdvancedTransformationLogic(inputData, transformations);
    
    if (result.data[0].Result !== '-Value') {
        throw new Error(`Expected '-Value', got '${result.data[0].Result}'`);
    }
});

// Test 18: Check if advanced transform functions exist in app.js
test('Advanced transform functions exist in app.js', () => {
    const js = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    
    const requiredFunctions = [
        'applyAdvancedTransform',
        'applyAdvancedTransformationLogic',
        'formatDate',
        'evaluateSafeExpression'
    ];
    
    requiredFunctions.forEach(fn => {
        if (!js.includes(`function ${fn}`)) {
            throw new Error(`Missing function: ${fn}`);
        }
    });
});

// Test 19: Verify createTransformMappingRow supports operations
test('createTransformMappingRow function supports operation parameter', () => {
    const js = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    
    if (!js.includes('transform-operation')) {
        throw new Error('Operation selector not found in createTransformMappingRow');
    }
    
    if (!js.includes('concatenate')) {
        throw new Error('Concatenate operation not found');
    }
    
    if (!js.includes('split')) {
        throw new Error('Split operation not found');
    }
});

// Test 20: Check if getParameterFields helper exists
test('getParameterFields helper function exists', () => {
    const js = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    
    if (!js.includes('function getParameterFields')) {
        throw new Error('getParameterFields function not found');
    }
    
    if (!js.includes('param-separator')) {
        throw new Error('Separator parameter field not found');
    }
    
    if (!js.includes('param-delimiter')) {
        throw new Error('Delimiter parameter field not found');
    }
});

// Print summary
console.log('\n' + '='.repeat(50));
console.log('Test Summary');
console.log('='.repeat(50));
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📊 Total:  ${testsPassed + testsFailed}`);
console.log('='.repeat(50));

if (testsFailed === 0) {
    console.log('\n🎉 All advanced transform tests passed!');
    process.exit(0);
} else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
    process.exit(1);
}
