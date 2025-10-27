// Test for Data Flow Logging feature
const fs = require('fs');
const path = require('path');

console.log('🧪 Running Data Flow Logging Tests\n');

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

// Test 1: Check if logging component exists in HTML
test('Logging component exists in toolbox', () => {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    
    if (!html.includes('data-type="logging"')) {
        throw new Error('Logging component not found in toolbox');
    }
    
    if (!html.includes('Data Flow Log')) {
        throw new Error('Data Flow Log label not found');
    }
});

// Test 2: Check if logging modal exists
test('Logging modal exists in HTML', () => {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    
    if (!html.includes('id="loggingModal"')) {
        throw new Error('Logging modal not found');
    }
    
    if (!html.includes('id="loggingInterface"')) {
        throw new Error('Logging interface div not found');
    }
    
    if (!html.includes('id="clearLog"')) {
        throw new Error('Clear log button not found');
    }
});

// Test 3: Check if logging functions exist in app.js
test('Logging functions exist in app.js', () => {
    const js = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    
    const requiredFunctions = [
        'addLogEntry',
        'formatLogEntry',
        'updateLoggingBlocks',
        'openLoggingModal'
    ];
    
    requiredFunctions.forEach(func => {
        if (!js.includes(`function ${func}`)) {
            throw new Error(`Function ${func} not found in app.js`);
        }
    });
});

// Test 4: Check if dataFlowLog global variable exists
test('dataFlowLog variable is initialized', () => {
    const js = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    
    if (!js.includes('let dataFlowLog = []')) {
        throw new Error('dataFlowLog variable not found or not initialized as array');
    }
});

// Test 5: Check if logging is integrated in key operations
test('Logging is integrated in data operations', () => {
    const js = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    
    // Check if addLogEntry is called for key operations
    const operations = [
        'DATA_LOADED',
        'DATA_TRANSFER',
        'MAPPING_APPLIED',
        'TRANSFORM_APPLIED'
    ];
    
    operations.forEach(op => {
        if (!js.includes(`'${op}'`)) {
            throw new Error(`Operation ${op} not logged`);
        }
    });
});

// Test 6: Check if logging block type is handled in renderBlock
test('Logging block type is rendered correctly', () => {
    const js = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    
    if (!js.includes("block.type === 'logging'")) {
        throw new Error('Logging block type not handled in renderBlock');
    }
});

// Test 7: Check if logging modal is opened in openBlockModal
test('Logging modal opens on block click', () => {
    const js = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    
    if (!js.includes("openLoggingModal(block)")) {
        throw new Error('Logging modal not opened in openBlockModal');
    }
});

// Test 8: Check clear log button initialization
test('Clear log button is initialized', () => {
    const js = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    
    if (!js.includes("getElementById('clearLog')")) {
        throw new Error('Clear log button not initialized');
    }
    
    if (!js.includes('dataFlowLog = []')) {
        throw new Error('Clear log button does not clear the log');
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
    console.log('🎉 All logging tests passed!');
    process.exit(0);
} else {
    console.log('⚠️  Some tests failed. Please review the errors above.');
    process.exit(1);
}
