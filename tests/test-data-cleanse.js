/**
 * Test Suite for Data Cleanse Block
 * Tests the new data cleanse transformation
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
const transformLogicMatch = appCode.match(/function applyAdvancedTransformationLogic[\s\S]*?(?=\n(?:function|\/\/ Helper function))/);
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

function assertNotEqual(actual, expected, message) {
    if (JSON.stringify(actual) === JSON.stringify(expected)) {
        throw new Error(`${message}\n   Should not equal: ${JSON.stringify(expected)}`);
    }
}

console.log('🧪 Running Data Cleanse Block Tests\n');

// Test data with various issues to cleanse
const testInputData = {
    headers: ['Name', 'Email', 'Phone', 'Status', 'Price'],
    data: [
        { Name: 'john doe', Email: 'john@test.com', Phone: '(123) 456-7890', Status: '', Price: '99.99' },
        { Name: 'JANE SMITH', Email: 'jane@test.com', Phone: '456-7890-123', Status: null, Price: '' },
        { Name: 'Bob Jones', Email: 'bob@TEST.com', Phone: '789#012#345', Status: 'active', Price: '149.50' }
    ]
};

// Test 1: Replace nulls/empty values
test('Data cleanse replaces null and empty values', () => {
    const transformation = {
        'StatusCleaned': {
            op: 'cleanse',
            inputs: ['Status'],
            params: { 
                replaceNulls: true,
                nullReplacement: 'N/A',
                removePattern: '',
                caseType: 'none',
                keepOriginal: false
            }
        }
    };
    
    const result = applyAdvancedTransformationLogic(testInputData, transformation, true);
    
    assertEqual(result.data[0].StatusCleaned, 'N/A', 'Empty string should be replaced with N/A');
    assertEqual(result.data[1].StatusCleaned, 'N/A', 'Null value should be replaced with N/A');
    assertEqual(result.data[2].StatusCleaned, 'active', 'Non-empty value should remain unchanged');
});

// Test 2: Remove unwanted characters (phone formatting)
test('Data cleanse removes unwanted characters from phone numbers', () => {
    const transformation = {
        'PhoneCleaned': {
            op: 'cleanse',
            inputs: ['Phone'],
            params: { 
                replaceNulls: false,
                nullReplacement: '',
                removePattern: '[^0-9]', // Keep only digits
                caseType: 'none',
                keepOriginal: false
            }
        }
    };
    
    const result = applyAdvancedTransformationLogic(testInputData, transformation, true);
    
    assertEqual(result.data[0].PhoneCleaned, '1234567890', 'Should remove parentheses, spaces, and hyphens');
    assertEqual(result.data[1].PhoneCleaned, '4567890123', 'Should remove hyphens');
    assertEqual(result.data[2].PhoneCleaned, '789012345', 'Should remove hash symbols');
});

// Test 3: Uppercase transformation
test('Data cleanse converts to uppercase', () => {
    const transformation = {
        'NameUpper': {
            op: 'cleanse',
            inputs: ['Name'],
            params: { 
                replaceNulls: false,
                nullReplacement: '',
                removePattern: '',
                caseType: 'upper',
                keepOriginal: false
            }
        }
    };
    
    const result = applyAdvancedTransformationLogic(testInputData, transformation, true);
    
    assertEqual(result.data[0].NameUpper, 'JOHN DOE', 'Should convert to uppercase');
    assertEqual(result.data[1].NameUpper, 'JANE SMITH', 'Should remain uppercase');
    assertEqual(result.data[2].NameUpper, 'BOB JONES', 'Should convert to uppercase');
});

// Test 4: Lowercase transformation
test('Data cleanse converts to lowercase', () => {
    const transformation = {
        'EmailLower': {
            op: 'cleanse',
            inputs: ['Email'],
            params: { 
                replaceNulls: false,
                nullReplacement: '',
                removePattern: '',
                caseType: 'lower',
                keepOriginal: false
            }
        }
    };
    
    const result = applyAdvancedTransformationLogic(testInputData, transformation, true);
    
    assertEqual(result.data[0].EmailLower, 'john@test.com', 'Should remain lowercase');
    assertEqual(result.data[1].EmailLower, 'jane@test.com', 'Should remain lowercase');
    assertEqual(result.data[2].EmailLower, 'bob@test.com', 'Should convert TEST to test');
});

// Test 5: Title case transformation
test('Data cleanse converts to title case', () => {
    const transformation = {
        'NameTitle': {
            op: 'cleanse',
            inputs: ['Name'],
            params: { 
                replaceNulls: false,
                nullReplacement: '',
                removePattern: '',
                caseType: 'title',
                keepOriginal: false
            }
        }
    };
    
    const result = applyAdvancedTransformationLogic(testInputData, transformation, true);
    
    assertEqual(result.data[0].NameTitle, 'John Doe', 'Should convert to title case');
    assertEqual(result.data[1].NameTitle, 'Jane Smith', 'Should convert to title case');
    assertEqual(result.data[2].NameTitle, 'Bob Jones', 'Should maintain title case');
});

// Test 6: Combined operations - replace nulls and change case
test('Data cleanse combines null replacement and case change', () => {
    const transformation = {
        'StatusProcessed': {
            op: 'cleanse',
            inputs: ['Status'],
            params: { 
                replaceNulls: true,
                nullReplacement: 'unknown',
                removePattern: '',
                caseType: 'upper',
                keepOriginal: false
            }
        }
    };
    
    const result = applyAdvancedTransformationLogic(testInputData, transformation, true);
    
    assertEqual(result.data[0].StatusProcessed, 'UNKNOWN', 'Should replace empty and convert to uppercase');
    assertEqual(result.data[1].StatusProcessed, 'UNKNOWN', 'Should replace null and convert to uppercase');
    assertEqual(result.data[2].StatusProcessed, 'ACTIVE', 'Should convert to uppercase');
});

// Test 7: Combined operations - remove characters and change case
test('Data cleanse combines character removal and case change', () => {
    const transformation = {
        'EmailProcessed': {
            op: 'cleanse',
            inputs: ['Email'],
            params: { 
                replaceNulls: false,
                nullReplacement: '',
                removePattern: '@.*', // Remove domain
                caseType: 'upper',
                keepOriginal: false
            }
        }
    };
    
    const result = applyAdvancedTransformationLogic(testInputData, transformation, true);
    
    assertEqual(result.data[0].EmailProcessed, 'JOHN', 'Should remove domain and convert to uppercase');
    assertEqual(result.data[1].EmailProcessed, 'JANE', 'Should remove domain and convert to uppercase');
    assertEqual(result.data[2].EmailProcessed, 'BOB', 'Should remove domain and convert to uppercase');
});

// Test 8: Keep original column option
test('Data cleanse preserves original column when keepOriginal is true', () => {
    const transformation = {
        'NameCleaned': {
            op: 'cleanse',
            inputs: ['Name'],
            params: { 
                replaceNulls: false,
                nullReplacement: '',
                removePattern: '',
                caseType: 'upper',
                keepOriginal: true
            }
        }
    };
    
    const result = applyAdvancedTransformationLogic(testInputData, transformation, true);
    
    // Check that original Name column is preserved
    assertEqual(result.data[0].Name, 'john doe', 'Original Name should be preserved');
    assertEqual(result.data[0].NameCleaned, 'JOHN DOE', 'Cleaned Name should be uppercase');
    
    // Check headers include both
    const hasOriginal = result.headers.includes('Name');
    const hasCleaned = result.headers.includes('NameCleaned');
    if (!hasOriginal || !hasCleaned) {
        throw new Error('Headers should include both Name and NameCleaned');
    }
});

// Test 9: Complex character removal (keep only alphanumeric)
test('Data cleanse keeps only alphanumeric characters', () => {
    const transformation = {
        'PhoneDigits': {
            op: 'cleanse',
            inputs: ['Phone'],
            params: { 
                replaceNulls: false,
                nullReplacement: '',
                removePattern: '[^a-zA-Z0-9]', // Keep only alphanumeric
                caseType: 'none',
                keepOriginal: false
            }
        }
    };
    
    const result = applyAdvancedTransformationLogic(testInputData, transformation, true);
    
    assertEqual(result.data[0].PhoneDigits, '1234567890', 'Should keep only digits');
    assertEqual(result.data[1].PhoneDigits, '4567890123', 'Should keep only digits');
    assertEqual(result.data[2].PhoneDigits, '789012345', 'Should keep only digits');
});

// Test 10: All operations combined
test('Data cleanse applies all operations together', () => {
    const transformation = {
        'PriceFormatted': {
            op: 'cleanse',
            inputs: ['Price'],
            params: { 
                replaceNulls: true,
                nullReplacement: '0.00',
                removePattern: '[^0-9.]', // Keep only digits and decimal point
                caseType: 'none',
                keepOriginal: false
            }
        }
    };
    
    const result = applyAdvancedTransformationLogic(testInputData, transformation, true);
    
    assertEqual(result.data[0].PriceFormatted, '99.99', 'Should keep valid price');
    assertEqual(result.data[1].PriceFormatted, '0.00', 'Should replace empty with 0.00');
    assertEqual(result.data[2].PriceFormatted, '149.50', 'Should keep valid price');
});

// Test 11: Invalid regex pattern handling
test('Data cleanse handles invalid regex gracefully', () => {
    const transformation = {
        'NameCleaned': {
            op: 'cleanse',
            inputs: ['Name'],
            params: { 
                replaceNulls: false,
                nullReplacement: '',
                removePattern: '[invalid(', // Invalid regex
                caseType: 'none',
                keepOriginal: false
            }
        }
    };
    
    const result = applyAdvancedTransformationLogic(testInputData, transformation, true);
    
    // Should return original value when regex is invalid
    assertEqual(result.data[0].NameCleaned, 'john doe', 'Should keep original when regex is invalid');
});

// Test 12: Empty input handling
test('Data cleanse handles empty/null input column', () => {
    const emptyData = {
        headers: ['Empty1', 'Empty2'],
        data: [
            { Empty1: '', Empty2: null },
            { Empty1: null, Empty2: '' }
        ]
    };
    
    const transformation = {
        'Cleaned': {
            op: 'cleanse',
            inputs: ['Empty1'],
            params: { 
                replaceNulls: true,
                nullReplacement: 'DEFAULT',
                removePattern: '',
                caseType: 'upper',
                keepOriginal: false
            }
        }
    };
    
    const result = applyAdvancedTransformationLogic(emptyData, transformation, true);
    
    assertEqual(result.data[0].Cleaned, 'DEFAULT', 'Should replace empty string');
    assertEqual(result.data[1].Cleaned, 'DEFAULT', 'Should replace null');
});

// Print test summary
console.log('\n' + '='.repeat(50));
console.log(`Total Tests: ${passed + failed}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log('='.repeat(50));

if (failed > 0) {
    process.exit(1);
}
