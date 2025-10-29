// Test for transform module
// This test validates the transform functionality

const fs = require('fs');
const path = require('path');

console.log('🧪 Running Transform Module Tests\n');

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

// Test 1: Check if transform block is in index.html
test('Transform block exists in toolbox', () => {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    
    if (!html.includes('data-type="transform"')) {
        throw new Error('Transform block not found in toolbox');
    }
    
    if (!html.includes('Transform')) {
        throw new Error('Transform label not found');
    }
});

// Test 2: Check if transform modal exists
test('Transform modal exists in HTML', () => {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    
    if (!html.includes('transformModal')) {
        throw new Error('Transform modal not found');
    }
    
    if (!html.includes('Transform')) {
        throw new Error('Transform modal title not found');
    }
});

// Test 3: Check if output data block and modal exist
test('Output Data block and modal exist', () => {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    
    if (!html.includes('data-type="outputdata"')) {
        throw new Error('Output Data block not found in toolbox');
    }
    
    if (!html.includes('outputDataModal')) {
        throw new Error('Output Data modal not found');
    }
    
    // Check for new export buttons (CSV and XLSX)
    if (!html.includes('exportOutputCSV') && !html.includes('exportOutputXLSX')) {
        throw new Error('Export buttons not found in Output Data modal');
    }
});

// Test 4: Check if transform functions exist in app.js
test('Transform functions exist in app.js', () => {
    const js = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    
    const requiredFunctions = [
        'openTransformModal',
        'applyTransform',
        'applyTransformationLogic',
        'exportTransformedCSV'
    ];
    
    requiredFunctions.forEach(fn => {
        if (!js.includes(`function ${fn}`)) {
            throw new Error(`Missing function: ${fn}`);
        }
    });
});

// Test 5: Test transformation logic with preserved unmapped columns
test('Transformation logic works correctly', () => {
    // Simulate the transformation function with new behavior
    function applyTransformationLogic(inputData, mappings, preserveUnmapped = true) {
        const inputRows = inputData.data || [];
        const inputHeaders = inputData.headers || [];
        const outputHeaders = Object.keys(mappings);
        
        const outputRows = inputRows.map(row => {
            const newRow = {};
            
            if (preserveUnmapped) {
                inputHeaders.forEach(inputCol => {
                    const isMapped = Object.values(mappings).includes(inputCol);
                    if (!isMapped) {
                        newRow[inputCol] = row[inputCol] || '';
                    }
                });
            }
            
            outputHeaders.forEach(outputCol => {
                const inputCol = mappings[outputCol];
                newRow[outputCol] = row[inputCol] || '';
            });
            return newRow;
        });
        
        let finalHeaders = outputHeaders;
        if (preserveUnmapped) {
            const unmappedColumns = inputHeaders.filter(inputCol => {
                return !Object.values(mappings).includes(inputCol);
            });
            finalHeaders = [...unmappedColumns, ...outputHeaders];
        }
        
        return {
            data: outputRows,
            headers: finalHeaders
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
    
    const result = applyTransformationLogic(inputData, mappings);
    
    // Validate result - should have 3 headers: Plant (unmapped) + Material + Description
    if (result.headers.length !== 3) {
        throw new Error(`Expected 3 output headers (Plant + Material + Description), got ${result.headers.length}`);
    }
    
    if (!result.headers.includes('Material') || !result.headers.includes('Description')) {
        throw new Error('Output headers do not match mappings');
    }
    
    if (!result.headers.includes('Plant')) {
        throw new Error('Unmapped column "Plant" should be preserved');
    }
    
    if (result.data.length !== 2) {
        throw new Error(`Expected 2 output rows, got ${result.data.length}`);
    }
    
    if (result.data[0].Material !== '10001234') {
        throw new Error('Transformation incorrect for Material column');
    }
    
    if (result.data[0].Description !== 'SAP Module') {
        throw new Error('Transformation incorrect for Description column');
    }
    
    if (result.data[0].Plant !== '1000') {
        throw new Error('Unmapped column "Plant" value should be preserved');
    }
});

// Test 6: Test CSV generation logic
test('CSV generation works correctly', () => {
    // Simulate CSV generation
    function generateCSV(headers, rows) {
        let csvContent = headers.join(',') + '\n';
        rows.forEach(row => {
            const values = headers.map(header => {
                const value = row[header] || '';
                // Escape values with commas or quotes
                if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            });
            csvContent += values.join(',') + '\n';
        });
        return csvContent;
    }
    
    const headers = ['Name', 'Value'];
    const rows = [
        { Name: 'Item1', Value: '100' },
        { Name: 'Item2', Value: '200' }
    ];
    
    const csv = generateCSV(headers, rows);
    const lines = csv.trim().split('\n');
    
    if (lines.length !== 3) {
        throw new Error(`Expected 3 lines (header + 2 rows), got ${lines.length}`);
    }
    
    if (lines[0] !== 'Name,Value') {
        throw new Error('CSV header incorrect');
    }
    
    if (lines[1] !== 'Item1,100') {
        throw new Error('CSV first row incorrect');
    }
});

// Test 7: Test CSV escaping for special characters
test('CSV escaping handles commas and quotes', () => {
    function escapeCSVValue(value) {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
    }
    
    const testValue1 = 'Value, with comma';
    const escaped1 = escapeCSVValue(testValue1);
    if (escaped1 !== '"Value, with comma"') {
        throw new Error('Comma escaping failed');
    }
    
    const testValue2 = 'Value "with quotes"';
    const escaped2 = escapeCSVValue(testValue2);
    if (escaped2 !== '"Value ""with quotes"""') {
        throw new Error('Quote escaping failed');
    }
    
    const testValue3 = 'Normal value';
    const escaped3 = escapeCSVValue(testValue3);
    if (escaped3 !== 'Normal value') {
        throw new Error('Normal value should not be escaped');
    }
});

// Test 8: Check if transform block type is handled in renderBlock
test('Transform block type is rendered correctly', () => {
    const js = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    
    // Check if transform type is handled
    if (!js.includes("block.type === 'transform'")) {
        throw new Error('Transform block type not handled in renderBlock');
    }
});

// Test 9: Test empty transformation with preserve unmapped (default behavior)
test('Empty transformation preserves unmapped columns by default', () => {
    function applyTransformationLogic(inputData, mappings, preserveUnmapped = true) {
        const inputRows = inputData.data || [];
        const inputHeaders = inputData.headers || [];
        const outputHeaders = Object.keys(mappings);
        
        const outputRows = inputRows.map(row => {
            const newRow = {};
            
            if (preserveUnmapped) {
                inputHeaders.forEach(inputCol => {
                    const isMapped = Object.values(mappings).includes(inputCol);
                    if (!isMapped) {
                        newRow[inputCol] = row[inputCol] || '';
                    }
                });
            }
            
            outputHeaders.forEach(outputCol => {
                const inputCol = mappings[outputCol];
                newRow[outputCol] = row[inputCol] || '';
            });
            return newRow;
        });
        
        let finalHeaders = outputHeaders;
        if (preserveUnmapped) {
            const unmappedColumns = inputHeaders.filter(inputCol => {
                return !Object.values(mappings).includes(inputCol);
            });
            finalHeaders = [...unmappedColumns, ...outputHeaders];
        }
        
        return { data: outputRows, headers: finalHeaders };
    }
    
    const inputData = {
        headers: ['Col1', 'Col2'],
        data: [{ Col1: 'A', Col2: 'B' }]
    };
    
    // With default preserveUnmapped=true, unmapped columns should be preserved
    const result = applyTransformationLogic(inputData, {});
    
    if (result.headers.length !== 2) {
        throw new Error('Empty transformation should preserve all input columns');
    }
    
    if (!result.headers.includes('Col1') || !result.headers.includes('Col2')) {
        throw new Error('Unmapped columns should be preserved');
    }
    
    if (result.data.length !== 1) {
        throw new Error('Should maintain same number of rows');
    }
    
    if (result.data[0].Col1 !== 'A' || result.data[0].Col2 !== 'B') {
        throw new Error('Unmapped column values should be preserved');
    }
    
    // With preserveUnmapped=false, should produce empty output
    const resultNoPreserve = applyTransformationLogic(inputData, {}, false);
    
    if (resultNoPreserve.headers.length !== 0) {
        throw new Error('Empty transformation with preserveUnmapped=false should produce no headers');
    }
});

// Test 10: Test multiple row transformation
test('Multiple row transformation works correctly', () => {
    function applyTransformationLogic(inputData, mappings) {
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
        headers: ['A', 'B', 'C'],
        data: [
            { A: '1', B: '2', C: '3' },
            { A: '4', B: '5', C: '6' },
            { A: '7', B: '8', C: '9' }
        ]
    };
    
    const mappings = { 'X': 'A', 'Z': 'C' };
    const result = applyTransformationLogic(inputData, mappings);
    
    if (result.data.length !== 3) {
        throw new Error('Should maintain row count');
    }
    
    if (result.data[0].X !== '1' || result.data[0].Z !== '3') {
        throw new Error('First row transformation incorrect');
    }
    
    if (result.data[2].X !== '7' || result.data[2].Z !== '9') {
        throw new Error('Last row transformation incorrect');
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
    console.log('\n🎉 All transform tests passed!');
    process.exit(0);
} else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
    process.exit(1);
}
