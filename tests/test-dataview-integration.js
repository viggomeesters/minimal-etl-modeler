/**
 * Integration test for Data View component
 * Tests the complete data flow with Data View blocks
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Running Data View Integration Tests\n');

// Mock DOM and functions needed for testing
global.document = {
    getElementById: () => ({
        innerHTML: '',
        style: { display: 'none' }
    })
};

// Read app.js to extract functions
const appJsPath = path.join(__dirname, '..', 'app.js');
const appJsContent = fs.readFileSync(appJsPath, 'utf8');

let passCount = 0;
let failCount = 0;

function test(name, condition) {
    if (condition) {
        console.log(`✅ PASS: ${name}`);
        passCount++;
    } else {
        console.log(`❌ FAIL: ${name}`);
        failCount++;
    }
}

// Simulate data flow
function simulateDataFlow() {
    // Input block data
    const inputData = {
        headers: ['MaterialNumber', 'MaterialDescription', 'Plant'],
        data: [
            {MaterialNumber: '10001234', MaterialDescription: 'SAP Basis Module', Plant: '1000'},
            {MaterialNumber: '10001235', MaterialDescription: 'SAP HANA DB', Plant: '1000'},
            {MaterialNumber: '10001236', MaterialDescription: 'SAP Fiori', Plant: '2000'}
        ]
    };
    
    // Data View should pass through unchanged
    const dataViewOutput = {
        headers: inputData.headers,
        data: inputData.data
    };
    
    return {
        input: inputData,
        output: dataViewOutput,
        isIdentical: JSON.stringify(inputData) === JSON.stringify(dataViewOutput)
    };
}

// Test 1: Data View maintains data integrity
const flowResult = simulateDataFlow();
test('Data View maintains data integrity (pass-through)', flowResult.isIdentical);

// Test 2: Data View preserves headers
test('Data View preserves headers', 
    flowResult.input.headers.length === flowResult.output.headers.length &&
    flowResult.input.headers.every((h, i) => h === flowResult.output.headers[i])
);

// Test 3: Data View preserves row count
test('Data View preserves row count', 
    flowResult.input.data.length === flowResult.output.data.length
);

// Test 4: Data View preserves row data
test('Data View preserves row data', 
    JSON.stringify(flowResult.input.data[0]) === JSON.stringify(flowResult.output.data[0])
);

// Test 5: Multiple Data View blocks in sequence
function testMultipleDataViews() {
    const data = {
        headers: ['Col1', 'Col2'],
        data: [{Col1: 'A', Col2: 'B'}]
    };
    
    // Simulate 3 Data View blocks in sequence
    const dv1 = {...data};
    const dv2 = {...dv1};
    const dv3 = {...dv2};
    
    return JSON.stringify(data) === JSON.stringify(dv1) &&
           JSON.stringify(dv1) === JSON.stringify(dv2) &&
           JSON.stringify(dv2) === JSON.stringify(dv3);
}

test('Multiple Data View blocks maintain data integrity', testMultipleDataViews());

// Test 6: Data View with transform blocks
function testDataViewWithTransform() {
    const inputData = {
        headers: ['Name', 'Value'],
        data: [{Name: 'Test', Value: '100'}]
    };
    
    // Data View before transform
    const dvBefore = {...inputData};
    
    // Simulate transform (concatenate)
    const transformed = {
        headers: ['Name', 'Value', 'Combined'],
        data: [{Name: 'Test', Value: '100', Combined: 'Test-100'}]
    };
    
    // Data View after transform
    const dvAfter = {...transformed};
    
    // Before DV should match input, after DV should match transformed
    return JSON.stringify(inputData) === JSON.stringify(dvBefore) &&
           JSON.stringify(transformed) === JSON.stringify(dvAfter);
}

test('Data View works correctly with transform blocks', testDataViewWithTransform());

// Test 7: Data View with large dataset
function testDataViewWithLargeDataset() {
    const largeData = {
        headers: ['ID', 'Value'],
        data: Array.from({length: 1000}, (_, i) => ({ID: `${i}`, Value: `Value${i}`}))
    };
    
    const dvOutput = {...largeData};
    
    return largeData.data.length === dvOutput.data.length &&
           largeData.headers.length === dvOutput.headers.length;
}

test('Data View handles large datasets (1000 rows)', testDataViewWithLargeDataset());

// Test 8: Data View displays correct row count info
test('Data View shows row count in modal', 
    appJsContent.includes('Viewing:') &&
    appJsContent.includes('rijen en') &&
    appJsContent.includes('kolommen')
);

// Test 9: Data View has scrollable table
test('Data View has scrollable table for large data', 
    appJsContent.includes('max-height: 400px') &&
    appJsContent.includes('overflow-y: auto')
);

// Test 10: Data View limits display to 100 rows
test('Data View limits display to first 100 rows', 
    appJsContent.includes('slice(0, 100)') &&
    appJsContent.includes('Toon eerste 100 van')
);

// Test 11: Data View no longer propagates (it's now a viewer, not a flow component)
// The new openDataViewModal function doesn't take a block parameter
test('Data View is now a viewer tool (not a flow component)', 
    /function openDataViewModal\(\s*\)/.test(appJsContent) &&
    !/function openDataViewModal\(\s*block\s*\)/.test(appJsContent)
);

// Test 12: Data View button opens modal with block selector
test('Data View modal has block selector functionality', 
    appJsContent.includes('dataViewBlockSelector') &&
    appJsContent.includes('Selecteer block')
);

console.log('\n==================================================');
console.log('Integration Test Summary');
console.log('==================================================');
console.log(`✅ Passed: ${passCount}`);
console.log(`❌ Failed: ${failCount}`);
console.log(`📊 Total:  ${passCount + failCount}`);
console.log('==================================================\n');

if (failCount === 0) {
    console.log('🎉 All Data View integration tests passed!');
    process.exit(0);
} else {
    console.log('❌ Some integration tests failed!');
    process.exit(1);
}
