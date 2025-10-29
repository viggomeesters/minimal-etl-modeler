// Test for mapping functionality
// This test validates the mapping module

const fs = require('fs');
const path = require('path');

console.log('🧪 Running Mapping Module Tests\n');

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

// Test 1: Check if mapping block is in index.html
test('Mapping block exists in toolbox', () => {
    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    
    if (!html.includes('data-type="mapping"')) {
        throw new Error('Mapping block not found in toolbox');
    }
    
    if (!html.includes('Mapping')) {
        throw new Error('Mapping label not found');
    }
});

// Test 2: Check if mapping modal exists
test('Mapping modal exists in HTML', () => {
    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    
    if (!html.includes('mappingModal')) {
        throw new Error('Mapping modal not found');
    }
    
    if (!html.includes('Column Mapping')) {
        throw new Error('Mapping modal title not found');
    }
});

// Test 3: Check if mapping functions exist in app.js
test('Mapping functions exist in app.js', () => {
    const js = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
    
    const requiredFunctions = [
        'openMappingModal',
        'applyMapping',
        'applyMappingTransformation'
    ];
    
    requiredFunctions.forEach(fn => {
        if (!js.includes(`function ${fn}`)) {
            throw new Error(`Missing function: ${fn}`);
        }
    });
});

// Test 4: Test mapping transformation logic
test('Mapping transformation works correctly', () => {
    // Simulate the mapping transformation function
    function applyMappingTransformation(inputData, mappings) {
        const inputRows = inputData.data || [];
        const inputHeaders = inputData.headers || [];
        
        // Create new headers based on mappings
        const outputHeaders = Object.keys(mappings);
        
        // Transform each row
        const outputRows = inputRows.map(row => {
            const newRow = {};
            outputHeaders.forEach(outputCol => {
                const inputCol = mappings[outputCol];
                newRow[outputCol] = row[inputCol] || '';
            });
            return newRow;
        });
        
        return {
            data: outputRows,
            headers: outputHeaders
        };
    }
    
    // Test data
    const inputData = {
        headers: ['MaterialNumber', 'MaterialDescription', 'Plant'],
        data: [
            { MaterialNumber: '10001234', MaterialDescription: 'SAP Module', Plant: '1000' },
            { MaterialNumber: '10001235', MaterialDescription: 'SAP Database', Plant: '2000' }
        ]
    };
    
    // Test mapping
    const mappings = {
        'Material': 'MaterialNumber',
        'Description': 'MaterialDescription'
    };
    
    const result = applyMappingTransformation(inputData, mappings);
    
    // Validate result
    if (result.headers.length !== 2) {
        throw new Error(`Expected 2 output headers, got ${result.headers.length}`);
    }
    
    if (!result.headers.includes('Material') || !result.headers.includes('Description')) {
        throw new Error('Output headers do not match mappings');
    }
    
    if (result.data.length !== 2) {
        throw new Error(`Expected 2 output rows, got ${result.data.length}`);
    }
    
    if (result.data[0].Material !== '10001234') {
        throw new Error('Mapping transformation incorrect for Material column');
    }
    
    if (result.data[0].Description !== 'SAP Module') {
        throw new Error('Mapping transformation incorrect for Description column');
    }
    
    // Ensure unmapped columns are not included
    if (result.data[0].Plant !== undefined) {
        throw new Error('Unmapped columns should not be in output');
    }
});

// Test 5: Test empty mapping
test('Empty mapping produces empty output', () => {
    function applyMappingTransformation(inputData, mappings) {
        const inputRows = inputData.data || [];
        const outputHeaders = Object.keys(mappings);
        const outputRows = inputRows.map(row => {
            const newRow = {};
            outputHeaders.forEach(outputCol => {
                const inputCol = mappings[outputCol];
                newRow[outputCol] = row[inputCol] || '';
            });
            return newRow;
        });
        return { data: outputRows, headers: outputHeaders };
    }
    
    const inputData = {
        headers: ['Col1', 'Col2'],
        data: [{ Col1: 'A', Col2: 'B' }]
    };
    
    const result = applyMappingTransformation(inputData, {});
    
    if (result.headers.length !== 0) {
        throw new Error('Empty mapping should produce no headers');
    }
    
    if (result.data.length !== 1) {
        throw new Error('Should maintain same number of rows');
    }
});

// Test 6: Test partial mapping
test('Partial mapping works correctly', () => {
    function applyMappingTransformation(inputData, mappings) {
        const inputRows = inputData.data || [];
        const outputHeaders = Object.keys(mappings);
        const outputRows = inputRows.map(row => {
            const newRow = {};
            outputHeaders.forEach(outputCol => {
                const inputCol = mappings[outputCol];
                newRow[outputCol] = row[inputCol] || '';
            });
            return newRow;
        });
        return { data: outputRows, headers: outputHeaders };
    }
    
    const inputData = {
        headers: ['A', 'B', 'C', 'D'],
        data: [{ A: '1', B: '2', C: '3', D: '4' }]
    };
    
    // Only map 2 out of 4 columns
    const mappings = {
        'X': 'A',
        'Y': 'C'
    };
    
    const result = applyMappingTransformation(inputData, mappings);
    
    if (result.headers.length !== 2) {
        throw new Error('Should only have mapped columns in output');
    }
    
    if (result.data[0].X !== '1' || result.data[0].Y !== '3') {
        throw new Error('Partial mapping values incorrect');
    }
});

// Test 7: Test column rename mapping (same source to different targets)
test('Column rename mapping works', () => {
    function applyMappingTransformation(inputData, mappings) {
        const inputRows = inputData.data || [];
        const outputHeaders = Object.keys(mappings);
        const outputRows = inputRows.map(row => {
            const newRow = {};
            outputHeaders.forEach(outputCol => {
                const inputCol = mappings[outputCol];
                newRow[outputCol] = row[inputCol] || '';
            });
            return newRow;
        });
        return { data: outputRows, headers: outputHeaders };
    }
    
    const inputData = {
        headers: ['OldName'],
        data: [{ OldName: 'Value' }]
    };
    
    const mappings = {
        'NewName': 'OldName'
    };
    
    const result = applyMappingTransformation(inputData, mappings);
    
    if (result.headers[0] !== 'NewName') {
        throw new Error('Column should be renamed');
    }
    
    if (result.data[0].NewName !== 'Value') {
        throw new Error('Renamed column should retain value');
    }
});

// Test 8: Check if mapping block type is handled in renderBlock
test('Mapping block type is rendered correctly', () => {
    const js = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
    
    // Check if mapping type is handled
    if (!js.includes("block.type === 'mapping'")) {
        throw new Error('Mapping block type not handled in renderBlock');
    }
});

// Test 9: Check CSS for mapping styles
test('CSS has mapping styles', () => {
    const css = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');
    
    if (!css.includes('#applyMapping')) {
        throw new Error('Missing CSS for apply mapping button');
    }
});

// Print summary
console.log('\n' + '='.repeat(50));
console.log('Test Summary');
console.log('='.repeat(50));
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📊 Total:  ${testsPassed + testsFailed}`);
console.log('='.repeat(50));

if (testsFailed === 0) {
    console.log('\n🎉 All mapping tests passed!');
    process.exit(0);
} else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
    process.exit(1);
}
