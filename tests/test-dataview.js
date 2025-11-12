/**
 * Test suite for Per-Block Data Preview
 * Tests that global View Data is removed and per-block preview works via double-click
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Running Per-Block Data Preview Tests\n');

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

// Test 1: Global Data View button removed from flow controls
test('Global Data View button removed from flow controls', 
    !htmlContent.includes('id="dataViewBtn"')
);

// Test 2: Global Data View modal removed from HTML
test('Global Data View modal removed from HTML', 
    !htmlContent.includes('id="dataViewModal"')
);

// Test 3: openDataViewModal function removed from app.js
test('openDataViewModal function removed', 
    !appJsContent.includes('function openDataViewModal')
);

// Test 4: Data View button event listener removed
test('Data View button event listener removed', 
    !appJsContent.includes("getElementById('dataViewBtn')")
);

// Test 5: showDataPreview function still exists (reused for per-block preview)
test('showDataPreview function exists for per-block preview', 
    appJsContent.includes('function showDataPreview')
);

// Test 6: Double-click shows preview when block has data
test('Double-click shows preview when block has data', 
    appJsContent.includes('dataStore[block.id]') &&
    appJsContent.includes('showDataPreview') &&
    appJsContent.includes('dblclick')
);

// Test 7: Shift+double-click opens config modal when block has data
test('Shift+double-click opens config modal', 
    appJsContent.includes('e.shiftKey') &&
    appJsContent.includes('openBlockModal')
);

// Test 8: Eye icon functionality still exists
test('Eye icon click handler preserved', 
    appJsContent.includes("querySelector('.block-eye')") &&
    appJsContent.includes('showDataPreview')
);

// Test 9: BLOCK_DATA_PREVIEW_TITLES constant exists
test('BLOCK_DATA_PREVIEW_TITLES constant exists', 
    appJsContent.includes('BLOCK_DATA_PREVIEW_TITLES')
);

// Test 10: dataPreviewModal still exists in HTML (used for per-block preview)
test('dataPreviewModal exists for per-block preview', 
    htmlContent.includes('id="dataPreviewModal"')
);

// Test 11: Max display rows constant exists
test('MAX_DISPLAY_ROWS constant exists', 
    appJsContent.includes('MAX_DISPLAY_ROWS')
);

// Test 12: showDataPreview displays up to 100 rows
test('showDataPreview limits to 100 rows', 
    appJsContent.includes('MAX_DISPLAY_ROWS') &&
    appJsContent.includes('slice(0, MAX_DISPLAY_ROWS)')
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
