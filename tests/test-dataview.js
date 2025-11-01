/**
 * Test suite for Data View component
 * Tests the Data View block functionality
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Running Data View Component Tests\n');

// Read the necessary files
const htmlPath = path.join(__dirname, '..', 'index.html');
const appJsPath = path.join(__dirname, '..', 'app.js');

const htmlContent = fs.readFileSync(htmlPath, 'utf8');
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

// Test 1: Data View block exists in toolbox
test('Data View block exists in toolbox', 
    htmlContent.includes('data-type="dataview"') && 
    htmlContent.includes('Data View')
);

// Test 2: Data View modal exists in HTML
test('Data View modal exists in HTML', 
    htmlContent.includes('id="dataViewModal"') &&
    htmlContent.includes('id="dataViewInterface"')
);

// Test 3: Data View functions exist in app.js
test('openDataViewModal function exists', 
    appJsContent.includes('function openDataViewModal')
);

// Test 4: Data View block type is rendered correctly
test('Data View block rendering logic exists', 
    appJsContent.includes("block.type === 'dataview'") &&
    appJsContent.includes("title = 'Data View'")
);

// Test 5: Data View is in openBlockModal switch
test('Data View is handled in openBlockModal', 
    appJsContent.includes("block.type === 'dataview'") &&
    appJsContent.includes('openDataViewModal(block)')
);

// Test 6: Data View preview title exists
test('Data View has preview title', 
    appJsContent.includes("'dataview': 'Data View'")
);

// Test 7: Data View icon is correct
test('Data View has correct icon', 
    htmlContent.includes('👁️') && 
    appJsContent.includes("icon = '👁️'")
);

// Test 8: Data View is pass-through (stores data)
test('Data View stores and propagates data', 
    appJsContent.includes('dataStore[block.id] = {') &&
    appJsContent.includes('propagateData(block.id)')
);

// Test 9: Data View shows data overview
test('Data View shows data overview', 
    appJsContent.includes('Data Overview') &&
    appJsContent.includes('Viewing:')
);

// Test 10: Data View handles no input connection
test('Data View handles missing input connection', 
    appJsContent.includes('Verbind eerst een block met data aan deze Data View block')
);

console.log('\n==================================================');
console.log('Test Summary');
console.log('==================================================');
console.log(`✅ Passed: ${passCount}`);
console.log(`❌ Failed: ${failCount}`);
console.log(`📊 Total:  ${passCount + failCount}`);
console.log('==================================================\n');

if (failCount === 0) {
    console.log('🎉 All Data View tests passed!');
    process.exit(0);
} else {
    console.log('❌ Some tests failed!');
    process.exit(1);
}
