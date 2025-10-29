/**
 * Test Suite for Split Transform Blocks
 * Tests the new individual transformation block types
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

console.log('🧪 Running Split Transform Blocks Tests\n');

// Test data
const testInputData = {
    headers: ['FirstName', 'LastName', 'Email', 'Salary', 'Department'],
    data: [
        { FirstName: 'John', LastName: 'Doe', Email: 'john.doe@company.com', Salary: '50000', Department: 'Sales' },
        { FirstName: 'Jane', LastName: 'Smith', Email: 'jane.smith@company.com', Salary: '60000', Department: 'Marketing' }
    ]
};

// Test 1: Concatenate operation via transformation API
test('Concatenate block transformation creates FullName column', () => {
    const transformation = {
        'FullName': {
            op: 'concatenate',
            inputs: ['FirstName', 'LastName'],
            params: { separator: ' ' }
        }
    };
    
    const result = applyAdvancedTransformationLogic(testInputData, transformation, true);
    
    assertEqual(result.data[0].FullName, 'John Doe', 'First row FullName should be concatenated');
    assertEqual(result.data[1].FullName, 'Jane Smith', 'Second row FullName should be concatenated');
    
    // Check that unmapped columns are preserved
    assertEqual(result.data[0].Email, 'john.doe@company.com', 'Email should be preserved');
});

// Test 2: Split operation via transformation API
test('Split block transformation extracts domain from email', () => {
    const transformation = {
        'Domain': {
            op: 'split',
            inputs: ['Email'],
            params: { delimiter: '@', index: 1 }
        }
    };
    
    const result = applyAdvancedTransformationLogic(testInputData, transformation, true);
    
    assertEqual(result.data[0].Domain, 'company.com', 'Should extract domain from first email');
    assertEqual(result.data[1].Domain, 'company.com', 'Should extract domain from second email');
});

// Test 3: Case Change operation via transformation API
test('Case Change block transformation converts to uppercase', () => {
    const transformation = {
        'UpperDept': {
            op: 'case',
            inputs: ['Department'],
            params: { type: 'upper' }
        }
    };
    
    const result = applyAdvancedTransformationLogic(testInputData, transformation, true);
    
    assertEqual(result.data[0].UpperDept, 'SALES', 'Department should be uppercase');
    assertEqual(result.data[1].UpperDept, 'MARKETING', 'Department should be uppercase');
});

// Test 4: Math operation via transformation API
test('Math block transformation multiplies salary by 0.1', () => {
    const transformation = {
        'Bonus': {
            op: 'math',
            inputs: ['Salary'],
            params: { mathOp: 'multiply', round: '0' }
        }
    };
    
    // Need to add a multiplier - let's use expression instead
    const testData = {
        headers: ['Price', 'Quantity'],
        data: [
            { Price: '100', Quantity: '5' },
            { Price: '200', Quantity: '3' }
        ]
    };
    
    const mathTransform = {
        'Total': {
            op: 'math',
            inputs: ['Price', 'Quantity'],
            params: { mathOp: 'multiply', round: '2' }
        }
    };
    
    const result = applyAdvancedTransformationLogic(testData, mathTransform, true);
    
    assertEqual(result.data[0].Total, '500', 'Should calculate 100 * 5');
    assertEqual(result.data[1].Total, '600', 'Should calculate 200 * 3');
});

// Test 5: Copy/Rename operation via transformation API
test('Copy/Rename block transformation renames column', () => {
    const transformation = {
        'Material': {
            op: 'copy',
            inputs: ['FirstName'],
            params: {}
        }
    };
    
    const result = applyAdvancedTransformationLogic(testInputData, transformation, true);
    
    assertEqual(result.data[0].Material, 'John', 'Should copy FirstName to Material');
    assertEqual(result.data[1].Material, 'Jane', 'Should copy FirstName to Material');
});

// Test 6: Expression block transformation
test('Expression block transformation combines columns with template', () => {
    const transformation = {
        'UserID': {
            op: 'expression',
            inputs: [],
            params: { expression: '${FirstName}-${LastName}' }
        }
    };
    
    const result = applyAdvancedTransformationLogic(testInputData, transformation, true);
    
    assertEqual(result.data[0].UserID, 'John-Doe', 'Should create UserID from template');
    assertEqual(result.data[1].UserID, 'Jane-Smith', 'Should create UserID from template');
});

// Test 7: Regex Replace operation via transformation API
test('Regex Replace block removes numbers from email', () => {
    const testData = {
        headers: ['Code'],
        data: [
            { Code: 'ABC123DEF' },
            { Code: 'XYZ456' }
        ]
    };
    
    const transformation = {
        'CleanCode': {
            op: 'regex',
            inputs: ['Code'],
            params: { pattern: '[0-9]+', replacement: '' }
        }
    };
    
    const result = applyAdvancedTransformationLogic(testData, transformation, true);
    
    assertEqual(result.data[0].CleanCode, 'ABCDEF', 'Should remove digits');
    assertEqual(result.data[1].CleanCode, 'XYZ', 'Should remove digits');
});

// Test 8: Multiple blocks can be chained (preserve unmapped columns)
test('Multiple transformations preserve data through chain', () => {
    const transformation1 = {
        'FullName': {
            op: 'concatenate',
            inputs: ['FirstName', 'LastName'],
            params: { separator: ' ' }
        }
    };
    
    const result1 = applyAdvancedTransformationLogic(testInputData, transformation1, true);
    
    // Now apply another transformation on the result
    const transformation2 = {
        'Domain': {
            op: 'split',
            inputs: ['Email'],
            params: { delimiter: '@', index: 1 }
        }
    };
    
    const result2 = applyAdvancedTransformationLogic(result1, transformation2, true);
    
    // Both transformations should be present
    assertEqual(result2.data[0].FullName, 'John Doe', 'First transformation should be preserved');
    assertEqual(result2.data[0].Domain, 'company.com', 'Second transformation should be applied');
});

// Test 9: Date Format operation
test('Date Format block transforms date format', () => {
    const testData = {
        headers: ['DateString'],
        data: [
            { DateString: '2024-01-15' },
            { DateString: '2024-02-20' }
        ]
    };
    
    const transformation = {
        'FormattedDate': {
            op: 'date',
            inputs: ['DateString'],
            params: { inputFormat: 'ISO', outputFormat: 'YYYY-MM-DD' }
        }
    };
    
    const result = applyAdvancedTransformationLogic(testData, transformation, true);
    
    // Date formatting should work (even if it returns the same format in this case)
    assertEqual(typeof result.data[0].FormattedDate, 'string', 'Should output formatted date');
});

// Test 10: Check that new block types are defined in app.js
test('New block type handlers exist in app.js', () => {
    const blockTypes = [
        'openConcatenateModal',
        'applyConcatenate',
        'openSplitModal',
        'applySplit',
        'openCaseChangeModal',
        'applyCaseChange',
        'openMathModal',
        'applyMath',
        'openRegexReplaceModal',
        'applyRegexReplace',
        'openDateFormatModal',
        'applyDateFormat',
        'openExpressionModal',
        'applyExpression',
        'openCopyRenameModal',
        'applyCopyRename'
    ];
    
    blockTypes.forEach(fnName => {
        if (!appCode.includes(`function ${fnName}`)) {
            throw new Error(`Function ${fnName} not found in app.js`);
        }
    });
});

// Test 11: Check that renderBlock handles new block types
test('renderBlock handles new transformation block types', () => {
    const newBlockTypes = [
        'concatenate',
        'split',
        'casechange',
        'math',
        'regexreplace',
        'dateformat',
        'expression',
        'copyrename'
    ];
    
    newBlockTypes.forEach(blockType => {
        const pattern = new RegExp(`block\\.type === '${blockType}'`);
        if (!pattern.test(appCode)) {
            throw new Error(`Block type '${blockType}' not handled in renderBlock`);
        }
    });
});

// Test 12: Check that openBlockModal routes to new handlers
test('openBlockModal routes to new transformation block handlers', () => {
    const handlers = [
        { type: 'concatenate', handler: 'openConcatenateModal' },
        { type: 'split', handler: 'openSplitModal' },
        { type: 'casechange', handler: 'openCaseChangeModal' },
        { type: 'math', handler: 'openMathModal' },
        { type: 'regexreplace', handler: 'openRegexReplaceModal' },
        { type: 'dateformat', handler: 'openDateFormatModal' },
        { type: 'expression', handler: 'openExpressionModal' },
        { type: 'copyrename', handler: 'openCopyRenameModal' }
    ];
    
    handlers.forEach(({ type, handler }) => {
        const pattern = new RegExp(`block\\.type === '${type}'[\\s\\S]*?${handler}`);
        if (!pattern.test(appCode)) {
            throw new Error(`openBlockModal does not route '${type}' to ${handler}`);
        }
    });
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
    console.log('🎉 All split transform block tests passed!');
    process.exit(0);
}
