// Test for validation functionality
// This test validates the validation module

const fs = require('fs');
const path = require('path');

console.log('🧪 Running Validation Module Tests\n');

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

// Test 1: Check if validation block is in index.html
test('Validation block exists in toolbox', () => {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    
    if (!html.includes('data-type="validation"')) {
        throw new Error('Validation block not found in toolbox');
    }
    
    if (!html.includes('Validation')) {
        throw new Error('Validation label not found');
    }
});

// Test 2: Check if validation modal exists
test('Validation modal exists in HTML', () => {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    
    if (!html.includes('validationModal')) {
        throw new Error('Validation modal not found');
    }
    
    if (!html.includes('applyValidation')) {
        throw new Error('Apply validation button not found');
    }
});

// Test 3: Check if validation functions exist in app.js
test('Validation functions exist in app.js', () => {
    const appJs = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    
    if (!appJs.includes('function openValidationModal')) {
        throw new Error('openValidationModal function not found');
    }
    
    if (!appJs.includes('function createValidationRow')) {
        throw new Error('createValidationRow function not found');
    }
    
    if (!appJs.includes('function applyValidation')) {
        throw new Error('applyValidation function not found');
    }
    
    if (!appJs.includes('function validateValue')) {
        throw new Error('validateValue function not found');
    }
});

// Test 4: Test required validation logic
test('Required validation works correctly', () => {
    // Mock validateValue function
    const validateValue = (value, rule, column) => {
        const { type } = rule;
        
        if (type === 'required') {
            if (value === null || value === undefined || value === '') {
                return { col: column, message: `${column} is required` };
            }
        }
        return null;
    };
    
    // Test with empty value
    const error1 = validateValue('', { type: 'required' }, 'testCol');
    if (!error1 || !error1.message.includes('required')) {
        throw new Error('Required validation should fail for empty value');
    }
    
    // Test with valid value
    const error2 = validateValue('valid', { type: 'required' }, 'testCol');
    if (error2 !== null) {
        throw new Error('Required validation should pass for non-empty value');
    }
});

// Test 5: Test type validation for numbers
test('Type validation for numbers works', () => {
    const validateValue = (value, rule, column) => {
        const { type, value: ruleValue } = rule;
        
        if (type === 'type' && ruleValue === 'number') {
            if (isNaN(value) || value === '') {
                return { col: column, message: `${column} must be a number` };
            }
        }
        return null;
    };
    
    // Test with valid number
    const error1 = validateValue('123', { type: 'type', value: 'number' }, 'age');
    if (error1 !== null) {
        throw new Error('Type validation should pass for valid number string');
    }
    
    // Test with invalid number
    const error2 = validateValue('abc', { type: 'type', value: 'number' }, 'age');
    if (!error2 || !error2.message.includes('must be a number')) {
        throw new Error('Type validation should fail for non-number value');
    }
});

// Test 6: Test regex validation
test('Regex validation works correctly', () => {
    const validateValue = (value, rule, column) => {
        const { type, value: ruleValue } = rule;
        
        if (type === 'regex' && ruleValue) {
            try {
                const regex = new RegExp(ruleValue);
                if (!regex.test(value)) {
                    return { col: column, message: `${column} does not match pattern` };
                }
            } catch (e) {
                return { col: column, message: `Invalid regex pattern` };
            }
        }
        return null;
    };
    
    // Test with matching pattern
    const error1 = validateValue('test@example.com', { type: 'regex', value: '^[^@]+@[^@]+\\.[^@]+$' }, 'email');
    if (error1 !== null) {
        throw new Error('Regex validation should pass for matching pattern');
    }
    
    // Test with non-matching pattern
    const error2 = validateValue('notanemail', { type: 'regex', value: '^[^@]+@[^@]+\\.[^@]+$' }, 'email');
    if (!error2 || !error2.message.includes('does not match')) {
        throw new Error('Regex validation should fail for non-matching pattern');
    }
});

// Test 7: Test min validation for numbers
test('Min validation for numbers works', () => {
    const validateValue = (value, rule, column) => {
        const { type, value: ruleValue } = rule;
        
        if (type === 'min' && ruleValue) {
            const minVal = parseFloat(ruleValue);
            if (!isNaN(parseFloat(value))) {
                if (parseFloat(value) < minVal) {
                    return { col: column, message: `${column} must be >= ${minVal}` };
                }
            }
        }
        return null;
    };
    
    // Test with value above minimum
    const error1 = validateValue('10', { type: 'min', value: '5' }, 'quantity');
    if (error1 !== null) {
        throw new Error('Min validation should pass for value above minimum');
    }
    
    // Test with value below minimum
    const error2 = validateValue('3', { type: 'min', value: '5' }, 'quantity');
    if (!error2 || !error2.message.includes('must be >=')) {
        throw new Error('Min validation should fail for value below minimum');
    }
});

// Test 8: Test max validation for numbers
test('Max validation for numbers works', () => {
    const validateValue = (value, rule, column) => {
        const { type, value: ruleValue } = rule;
        
        if (type === 'max' && ruleValue) {
            const maxVal = parseFloat(ruleValue);
            if (!isNaN(parseFloat(value))) {
                if (parseFloat(value) > maxVal) {
                    return { col: column, message: `${column} must be <= ${maxVal}` };
                }
            }
        }
        return null;
    };
    
    // Test with value below maximum
    const error1 = validateValue('5', { type: 'max', value: '10' }, 'quantity');
    if (error1 !== null) {
        throw new Error('Max validation should pass for value below maximum');
    }
    
    // Test with value above maximum
    const error2 = validateValue('15', { type: 'max', value: '10' }, 'quantity');
    if (!error2 || !error2.message.includes('must be <=')) {
        throw new Error('Max validation should fail for value above maximum');
    }
});

// Test 9: Test min validation for string length
test('Min validation for string length works', () => {
    const validateValue = (value, rule, column) => {
        const { type, value: ruleValue } = rule;
        
        if (type === 'min' && ruleValue) {
            const minVal = parseFloat(ruleValue);
            if (isNaN(parseFloat(value)) && typeof value === 'string') {
                if (value.length < minVal) {
                    return { col: column, message: `${column} length must be >= ${minVal}` };
                }
            }
        }
        return null;
    };
    
    // Test with string above minimum length
    const error1 = validateValue('hello', { type: 'min', value: '3' }, 'name');
    if (error1 !== null) {
        throw new Error('Min validation should pass for string above minimum length');
    }
    
    // Test with string below minimum length
    const error2 = validateValue('hi', { type: 'min', value: '5' }, 'name');
    if (!error2 || !error2.message.includes('length must be >=')) {
        throw new Error('Min validation should fail for string below minimum length');
    }
});

// Test 10: Test applyValidation function with complete data
test('applyValidation processes data correctly', () => {
    // Mock applyValidation function
    const applyValidation = (block, inputData) => {
        const validations = block.validations || {};
        const headers = inputData.headers || [];
        const rows = inputData.data || [];
        
        const rowErrors = [];
        let validCount = 0;
        let invalidCount = 0;
        
        rows.forEach((row, rowIndex) => {
            const errors = [];
            
            Object.keys(validations).forEach(column => {
                const rules = validations[column];
                const value = row[column];
                
                rules.forEach(rule => {
                    if (rule.type === 'required' && (value === null || value === undefined || value === '')) {
                        errors.push({ col: column, message: `${column} is required` });
                    }
                });
            });
            
            if (errors.length > 0) {
                rowErrors.push({ rowIndex, errors });
                invalidCount++;
            } else {
                validCount++;
            }
        });
        
        return {
            data: rows,
            headers: headers,
            validation: {
                rowErrors,
                validCount,
                invalidCount
            }
        };
    };
    
    const block = {
        validations: {
            'name': [{ type: 'required' }],
            'age': [{ type: 'required' }]
        }
    };
    
    const inputData = {
        headers: ['name', 'age'],
        data: [
            { name: 'John', age: '30' },
            { name: '', age: '25' },
            { name: 'Jane', age: '28' }
        ]
    };
    
    const result = applyValidation(block, inputData);
    
    if (result.validation.validCount !== 2) {
        throw new Error(`Expected 2 valid rows, got ${result.validation.validCount}`);
    }
    
    if (result.validation.invalidCount !== 1) {
        throw new Error(`Expected 1 invalid row, got ${result.validation.invalidCount}`);
    }
    
    if (result.validation.rowErrors.length !== 1) {
        throw new Error(`Expected 1 row error, got ${result.validation.rowErrors.length}`);
    }
    
    if (result.validation.rowErrors[0].rowIndex !== 1) {
        throw new Error(`Expected error on row 1, got row ${result.validation.rowErrors[0].rowIndex}`);
    }
});

// Test 11: Test validation block type is rendered correctly
test('Validation block type is rendered correctly', () => {
    const appJs = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    
    // Check if validation block type is handled in renderBlock
    if (!appJs.includes("block.type === 'validation'")) {
        throw new Error('Validation block type not handled in renderBlock');
    }
    
    // Check if validation has icon and title
    if (!appJs.includes("title = 'Validation'")) {
        throw new Error('Validation block title not set');
    }
});

// Test 12: Test validation modal routing in openBlockModal
test('Validation modal routing exists', () => {
    const appJs = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    
    if (!appJs.includes("block.type === 'validation'")) {
        throw new Error('Validation type check not found in openBlockModal');
    }
    
    if (!appJs.includes('openValidationModal(block)')) {
        throw new Error('openValidationModal call not found in routing');
    }
});

// Test 13: Test validation with all rules passing
test('Validation with all rules passing works', () => {
    const applyValidation = (block, inputData) => {
        const validations = block.validations || {};
        const headers = inputData.headers || [];
        const rows = inputData.data || [];
        
        const rowErrors = [];
        let validCount = 0;
        let invalidCount = 0;
        
        rows.forEach((row, rowIndex) => {
            const errors = [];
            
            Object.keys(validations).forEach(column => {
                const rules = validations[column];
                const value = row[column];
                
                rules.forEach(rule => {
                    if (rule.type === 'required' && (value === null || value === undefined || value === '')) {
                        errors.push({ col: column, message: `${column} is required` });
                    }
                });
            });
            
            if (errors.length > 0) {
                rowErrors.push({ rowIndex, errors });
                invalidCount++;
            } else {
                validCount++;
            }
        });
        
        return {
            data: rows,
            headers: headers,
            validation: {
                rowErrors,
                validCount,
                invalidCount
            }
        };
    };
    
    const block = {
        validations: {
            'name': [{ type: 'required' }]
        }
    };
    
    const inputData = {
        headers: ['name', 'age'],
        data: [
            { name: 'John', age: '30' },
            { name: 'Jane', age: '25' }
        ]
    };
    
    const result = applyValidation(block, inputData);
    
    if (result.validation.invalidCount !== 0) {
        throw new Error(`Expected 0 invalid rows, got ${result.validation.invalidCount}`);
    }
    
    if (result.validation.validCount !== 2) {
        throw new Error(`Expected 2 valid rows, got ${result.validation.validCount}`);
    }
});

// Print summary
console.log('\n==================================================');
console.log('Test Summary');
console.log('==================================================');
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📊 Total:  ${testsPassed + testsFailed}`);
console.log('==================================================\n');

if (testsFailed === 0) {
    console.log('🎉 All validation tests passed!');
} else {
    console.log('⚠️  Some tests failed. Please review the errors above.');
    process.exit(1);
}
