// Test for logging functionality
// This test validates the logging module

const fs = require('fs');
const path = require('path');

console.log('🧪 Running Logging Module Tests\n');

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

// Test 1: Check if logging infrastructure exists in app.js
test('Logging global variable dataLogs exists', () => {
    const appJs = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    
    if (!appJs.includes('let dataLogs = {}')) {
        throw new Error('dataLogs global variable not found in app.js');
    }
});

// Test 2: Check if addLog function exists
test('addLog function exists in app.js', () => {
    const appJs = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    
    if (!appJs.includes('function addLog(blockId, message, details')) {
        throw new Error('addLog function not found in app.js');
    }
});

// Test 3: Check if getLogs function exists
test('getLogs function exists in app.js', () => {
    const appJs = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    
    if (!appJs.includes('function getLogs(blockId)')) {
        throw new Error('getLogs function not found in app.js');
    }
});

// Test 4: Check if clearLogs function exists
test('clearLogs function exists in app.js', () => {
    const appJs = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    
    if (!appJs.includes('function clearLogs(blockId)')) {
        throw new Error('clearLogs function not found in app.js');
    }
});

// Test 5: Check if displayLogs function exists
test('displayLogs function exists in app.js', () => {
    const appJs = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    
    if (!appJs.includes('function displayLogs(blockId)')) {
        throw new Error('displayLogs function not found in app.js');
    }
});

// Test 6: Check if tab navigation exists in HTML
test('Tab navigation exists in viewModal', () => {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    
    if (!html.includes('tab-navigation')) {
        throw new Error('tab-navigation class not found in HTML');
    }
    
    if (!html.includes('data-tab="dataTab"')) {
        throw new Error('dataTab not found in HTML');
    }
    
    if (!html.includes('data-tab="logsTab"')) {
        throw new Error('logsTab not found in HTML');
    }
});

// Test 7: Check if log display div exists in HTML
test('Logs display div exists in viewModal', () => {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    
    if (!html.includes('id="logsDisplay"')) {
        throw new Error('logsDisplay div not found in HTML');
    }
});

// Test 8: Check if tab styles exist in CSS
test('Tab styles exist in CSS', () => {
    const css = fs.readFileSync(path.join(__dirname, 'style.css'), 'utf8');
    
    if (!css.includes('.tab-navigation')) {
        throw new Error('.tab-navigation style not found in CSS');
    }
    
    if (!css.includes('.tab-button')) {
        throw new Error('.tab-button style not found in CSS');
    }
    
    if (!css.includes('.tab-content')) {
        throw new Error('.tab-content style not found in CSS');
    }
});

// Test 9: Check if log entry styles exist in CSS
test('Log entry styles exist in CSS', () => {
    const css = fs.readFileSync(path.join(__dirname, 'style.css'), 'utf8');
    
    if (!css.includes('.log-entry')) {
        throw new Error('.log-entry style not found in CSS');
    }
    
    if (!css.includes('.log-timestamp')) {
        throw new Error('.log-timestamp style not found in CSS');
    }
    
    if (!css.includes('.log-message')) {
        throw new Error('.log-message style not found in CSS');
    }
});

// Test 10: Check if initTabNavigation function exists
test('initTabNavigation function exists in app.js', () => {
    const appJs = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    
    if (!appJs.includes('function initTabNavigation()')) {
        throw new Error('initTabNavigation function not found in app.js');
    }
});

// Test 11: Check if logging is integrated in transferData
test('Logging integrated in transferData function', () => {
    const appJs = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    
    if (!appJs.includes('addLog(toId,') || !appJs.includes('Received data from')) {
        throw new Error('Logging not integrated in transferData function');
    }
});

// Test 12: Check if logging is integrated in file loading
test('Logging integrated in file loading', () => {
    const appJs = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    
    if (!appJs.includes('addLog(selectedBlock.id,') || !appJs.includes('Loaded CSV file')) {
        throw new Error('Logging not integrated in file loading');
    }
});

// Test 13: Check if logging is integrated in transformations
test('Logging integrated in transformation operations', () => {
    const appJs = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    
    const hasMappingLog = appJs.includes('Applied column mappings');
    const hasConcatenateLog = appJs.includes('Concatenated columns');
    const hasSplitLog = appJs.includes('Split column');
    
    if (!hasMappingLog && !hasConcatenateLog && !hasSplitLog) {
        throw new Error('Logging not integrated in transformation operations');
    }
});

// Test 14: Verify tab content areas exist
test('Tab content areas exist in HTML', () => {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    
    if (!html.includes('id="dataTab"') || !html.includes('class="tab-content active"')) {
        throw new Error('dataTab content area not properly configured');
    }
    
    if (!html.includes('id="logsTab"') || !html.includes('class="tab-content"')) {
        throw new Error('logsTab content area not found');
    }
});

// Summary
console.log('\n==================================================');
console.log('Test Summary');
console.log('==================================================');
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📊 Total:  ${testsPassed + testsFailed}`);
console.log('==================================================\n');

if (testsFailed === 0) {
    console.log('🎉 All logging tests passed!');
} else {
    console.log('❌ Some tests failed!');
    process.exit(1);
}
