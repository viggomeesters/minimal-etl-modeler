/**
 * Test suite for Data View component
 * Tests the Data View button-based functionality
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

// Test 1: Data View block does NOT exist in toolbox (removed as per requirement)
test('Data View block removed from toolbox', 
    !htmlContent.includes('data-type="dataview"')
);

// Test 2: Data View button exists in flow controls
test('Data View button exists in flow controls', 
    htmlContent.includes('id="dataViewBtn"') &&
    htmlContent.includes('Data View')
);

// Test 3: Data View button has accessibility attributes
test('Data View button has aria-label for accessibility', 
    htmlContent.includes('aria-label="Open Data View"')
);

// Test 4: Data View modal exists in HTML
test('Data View modal exists in HTML', 
    htmlContent.includes('id="dataViewModal"') &&
    htmlContent.includes('id="dataViewInterface"')
);

// Test 5: Data View functions exist in app.js
test('openDataViewModal function exists', 
    appJsContent.includes('function openDataViewModal')
);

// Test 6: Data View button event listener exists
test('Data View button event listener exists', 
    appJsContent.includes("getElementById('dataViewBtn')") &&
    appJsContent.includes('openDataViewModal')
);

// Test 7: Data View block rendering logic removed
test('Data View block rendering logic removed', 
    !(appJsContent.includes("block.type === 'dataview'") &&
    appJsContent.includes("title = 'Data View'"))
);

// Test 8: Data View is NOT in openBlockModal switch (removed as per requirement)
test('Data View removed from openBlockModal', 
    !appJsContent.includes('openDataViewModal(block)')
);

// Test 9: Data View shows data overview
test('Data View shows data overview', 
    appJsContent.includes('Data Overview') &&
    appJsContent.includes('Viewing:')
);

// Test 10: Data View handles no data scenario
test('Data View handles missing data', 
    appJsContent.includes('Geen blocks met data gevonden')
);

// Test 11: Data View icon is in button
test('Data View button has correct icon', 
    htmlContent.includes('👁️')
);

// Test 12: Shift+double-click still works for all blocks
test('Shift+double-click functionality preserved', 
    appJsContent.includes('e.shiftKey') &&
    appJsContent.includes('showDataPreview')
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
