// Test for data propagation after flow load
// This test validates that data is properly propagated after loading a flow

const fs = require('fs');
const path = require('path');

console.log('🧪 Running Flow Load Data Propagation Tests\n');

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

// Test 1: Verify propagateData is called after loading flow
test('loadFlow includes propagateData call after restoring state', () => {
    const js = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    
    // Find the loadFlow function
    const loadFlowMatch = js.match(/function loadFlow\(event\)\s*{[\s\S]*?^}/m);
    if (!loadFlowMatch) {
        throw new Error('loadFlow function not found');
    }
    
    const loadFlowCode = loadFlowMatch[0];
    
    // Check that propagateData is called
    if (!loadFlowCode.includes('propagateData')) {
        throw new Error('loadFlow does not call propagateData after loading');
    }
    
    // Check that it's called after renderConnections
    const renderConnectionsIndex = loadFlowCode.indexOf('renderConnections()');
    const propagateDataIndex = loadFlowCode.indexOf('propagateData');
    
    if (renderConnectionsIndex === -1) {
        throw new Error('renderConnections not found in loadFlow');
    }
    
    if (propagateDataIndex < renderConnectionsIndex) {
        throw new Error('propagateData should be called after renderConnections');
    }
});

// Test 2: Verify propagateData iterates over blocks with data
test('loadFlow iterates over blocks to propagate data', () => {
    const js = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    
    const loadFlowMatch = js.match(/function loadFlow\(event\)\s*{[\s\S]*?^}/m);
    if (!loadFlowMatch) {
        throw new Error('loadFlow function not found');
    }
    
    const loadFlowCode = loadFlowMatch[0];
    
    // Check for iteration pattern
    if (!loadFlowCode.includes('blocks.forEach') && !loadFlowCode.includes('for (')) {
        throw new Error('loadFlow should iterate over blocks to propagate data');
    }
    
    // Check that it checks for data existence
    if (!loadFlowCode.includes('dataStore[')) {
        throw new Error('loadFlow should check dataStore for block data');
    }
});

// Test 3: Verify the fix is in the correct location
test('Data propagation happens after connections are rendered', () => {
    const js = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    
    const loadFlowMatch = js.match(/function loadFlow\(event\)\s*{[\s\S]*?^}/m);
    if (!loadFlowMatch) {
        throw new Error('loadFlow function not found');
    }
    
    const loadFlowCode = loadFlowMatch[0];
    
    // Find the order of operations
    const renderConnectionsIndex = loadFlowCode.indexOf('renderConnections()');
    const propagateDataIndex = loadFlowCode.indexOf('propagateData');
    const consoleLogIndex = loadFlowCode.indexOf('console.log(\'Flow loaded successfully\')');
    
    if (renderConnectionsIndex === -1 || propagateDataIndex === -1 || consoleLogIndex === -1) {
        throw new Error('Required function calls not found');
    }
    
    // Verify order: renderConnections -> propagateData -> console.log
    if (!(renderConnectionsIndex < propagateDataIndex && propagateDataIndex < consoleLogIndex)) {
        throw new Error('Incorrect order of operations in loadFlow');
    }
});

// Test 4: Verify comment explains the purpose
test('Data propagation includes explanatory comment', () => {
    const js = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    
    const loadFlowMatch = js.match(/function loadFlow\(event\)\s*{[\s\S]*?^}/m);
    if (!loadFlowMatch) {
        throw new Error('loadFlow function not found');
    }
    
    const loadFlowCode = loadFlowMatch[0];
    
    // Check for comment near propagateData
    const propagateSection = loadFlowCode.substring(
        loadFlowCode.indexOf('renderConnections()'),
        loadFlowCode.indexOf('console.log(\'Flow loaded successfully\')')
    );
    
    if (!propagateSection.includes('//') && !propagateSection.includes('/*')) {
        throw new Error('Data propagation should include explanatory comment');
    }
});

console.log('\n' + '='.repeat(50));
console.log('Test Summary');
console.log('='.repeat(50));
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📊 Total:  ${testsPassed + testsFailed}`);
console.log('='.repeat(50) + '\n');

if (testsFailed === 0) {
    console.log('🎉 All data propagation tests passed!');
    process.exit(0);
} else {
    console.log('💥 Some tests failed!');
    process.exit(1);
}
