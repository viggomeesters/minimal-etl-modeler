// Test for Save/Load Flow functionality
// This test validates the flow serialization and deserialization

const fs = require('fs');
const path = require('path');

console.log('🧪 Running Save/Load Flow Tests\n');

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

// Test 1: Check if save/load buttons exist in HTML
test('Save/Load buttons exist in index.html', () => {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    
    if (!html.includes('id="saveFlowBtn"')) {
        throw new Error('Save button not found in HTML');
    }
    if (!html.includes('id="loadFlowBtn"')) {
        throw new Error('Load button not found in HTML');
    }
    if (!html.includes('id="loadFlowInput"')) {
        throw new Error('Load file input not found in HTML');
    }
});

// Test 2: Check if flow-controls styling exists
test('Flow controls styling exists in CSS', () => {
    const css = fs.readFileSync(path.join(__dirname, 'style.css'), 'utf8');
    
    if (!css.includes('.flow-controls')) {
        throw new Error('Flow controls styling not found in CSS');
    }
    if (!css.includes('.flow-btn')) {
        throw new Error('Flow button styling not found in CSS');
    }
});

// Test 3: Check if save/load functions exist in app.js
test('Save/Load functions exist in app.js', () => {
    const js = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    
    if (!js.includes('function saveFlow()')) {
        throw new Error('saveFlow function not found in app.js');
    }
    if (!js.includes('function loadFlow(')) {
        throw new Error('loadFlow function not found in app.js');
    }
    if (!js.includes('function clearCanvas()')) {
        throw new Error('clearCanvas function not found in app.js');
    }
});

// Test 4: Validate save flow structure
test('Save flow creates correct data structure', () => {
    const js = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    
    // Check that the save function includes all necessary properties
    const requiredProperties = ['version', 'timestamp', 'blocks', 'connections', 'dataStore', 'blockCounter'];
    requiredProperties.forEach(prop => {
        if (!js.includes(`${prop}:`)) {
            throw new Error(`Save flow missing property: ${prop}`);
        }
    });
});

// Test 5: Check that load flow handles JSON parsing
test('Load flow includes JSON parsing', () => {
    const js = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    
    if (!js.includes('JSON.parse')) {
        throw new Error('Load flow does not parse JSON');
    }
    if (!js.includes('FileReader')) {
        throw new Error('Load flow does not use FileReader');
    }
});

// Test 6: Check that save creates download
test('Save flow creates file download', () => {
    const js = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    
    if (!js.includes('Blob')) {
        throw new Error('Save flow does not create Blob');
    }
    if (!js.includes('createElement(\'a\')')) {
        throw new Error('Save flow does not create download link');
    }
    if (!js.includes('download =')) {
        throw new Error('Save flow does not set download attribute');
    }
});

// Test 7: Check that load restores blocks
test('Load flow restores blocks and connections', () => {
    const js = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    
    const loadFlowSection = js.substring(js.indexOf('function loadFlow('));
    
    if (!loadFlowSection.includes('renderBlock')) {
        throw new Error('Load flow does not render blocks');
    }
    if (!loadFlowSection.includes('renderConnections')) {
        throw new Error('Load flow does not render connections');
    }
});

// Test 8: Check that clearCanvas resets state
test('Clear canvas resets all state', () => {
    const js = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    
    const clearCanvasSection = js.substring(js.indexOf('function clearCanvas()'));
    
    if (!clearCanvasSection.includes('blocks = []')) {
        throw new Error('Clear canvas does not reset blocks array');
    }
    if (!clearCanvasSection.includes('connections = []')) {
        throw new Error('Clear canvas does not reset connections array');
    }
    if (!clearCanvasSection.includes('dataStore = {}')) {
        throw new Error('Clear canvas does not reset dataStore');
    }
});

// Test 9: Check file input accept attribute
test('Load file input accepts JSON files', () => {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    
    if (!html.includes('accept=".json"')) {
        throw new Error('File input does not accept JSON files');
    }
});

// Test 10: Check for error handling in load
test('Load flow includes error handling', () => {
    const js = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    
    const loadFlowSection = js.substring(js.indexOf('function loadFlow('));
    
    if (!loadFlowSection.includes('try') || !loadFlowSection.includes('catch')) {
        throw new Error('Load flow does not have try-catch error handling');
    }
});

console.log('\n==================================================');
console.log('Test Summary');
console.log('==================================================');
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📊 Total:  ${testsPassed + testsFailed}`);
console.log('==================================================\n');

if (testsFailed === 0) {
    console.log('🎉 All save/load tests passed!');
    process.exit(0);
} else {
    console.log('⚠️  Some tests failed. Please review the errors above.');
    process.exit(1);
}
