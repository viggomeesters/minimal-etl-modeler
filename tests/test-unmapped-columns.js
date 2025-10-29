// Test for unmapped columns passthrough functionality
// This test validates that unmapped input columns are preserved when applying automapper

console.log('🧪 Running Unmapped Columns Passthrough Tests\n');

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

// Helper function to simulate the new applyMappingTransformation
function applyMappingTransformation(inputData, mappings, includeUnmapped = false) {
    const inputRows = inputData.data || [];
    const inputHeaders = inputData.headers || [];
    
    // Create new headers based on mappings
    const outputHeaders = Object.keys(mappings);
    
    // Find unmapped input columns
    const mappedInputColumns = new Set(Object.values(mappings));
    const unmappedInputColumns = inputHeaders.filter(h => !mappedInputColumns.has(h));
    
    // Include unmapped columns if requested
    const allOutputHeaders = includeUnmapped 
        ? [...outputHeaders, ...unmappedInputColumns]
        : outputHeaders;
    
    // Transform each row
    const outputRows = inputRows.map(row => {
        const newRow = {};
        
        // Apply mappings
        outputHeaders.forEach(outputCol => {
            const inputCol = mappings[outputCol];
            newRow[outputCol] = row[inputCol] || '';
        });
        
        // Include unmapped input columns if requested
        if (includeUnmapped) {
            unmappedInputColumns.forEach(inputCol => {
                newRow[inputCol] = row[inputCol] || '';
            });
        }
        
        return newRow;
    });
    
    return {
        data: outputRows,
        headers: allOutputHeaders,
        unmappedColumns: includeUnmapped ? unmappedInputColumns : []
    };
}

// Test 1: Without includeUnmapped flag (original behavior)
test('Original behavior: only mapped columns without flag', () => {
    const inputData = {
        headers: ['A', 'B', 'C', 'D', 'E'],
        data: [
            { A: 'a1', B: 'b1', C: 'c1', D: 'd1', E: 'e1' }
        ]
    };
    
    const mappings = {
        'X': 'A',
        'Y': 'B'
    };
    
    const result = applyMappingTransformation(inputData, mappings, false);
    
    if (result.headers.length !== 2) {
        throw new Error(`Expected 2 headers, got ${result.headers.length}`);
    }
    
    if (!result.headers.includes('X') || !result.headers.includes('Y')) {
        throw new Error('Missing mapped headers');
    }
    
    if (result.unmappedColumns.length !== 0) {
        throw new Error('Should not return unmapped columns when flag is false');
    }
});

// Test 2: With includeUnmapped flag - unmapped columns are preserved
test('New behavior: unmapped columns are passed through with flag', () => {
    const inputData = {
        headers: ['A', 'B', 'C', 'D', 'E'],
        data: [
            { A: 'a1', B: 'b1', C: 'c1', D: 'd1', E: 'e1' }
        ]
    };
    
    const mappings = {
        'X': 'A',
        'Y': 'B'
    };
    
    const result = applyMappingTransformation(inputData, mappings, true);
    
    // Should have 2 mapped + 3 unmapped = 5 headers
    if (result.headers.length !== 5) {
        throw new Error(`Expected 5 headers (2 mapped + 3 unmapped), got ${result.headers.length}`);
    }
    
    // Check mapped headers
    if (!result.headers.includes('X') || !result.headers.includes('Y')) {
        throw new Error('Missing mapped headers');
    }
    
    // Check unmapped headers
    if (!result.headers.includes('C') || !result.headers.includes('D') || !result.headers.includes('E')) {
        throw new Error('Missing unmapped headers');
    }
    
    // Check unmappedColumns array
    if (result.unmappedColumns.length !== 3) {
        throw new Error(`Expected 3 unmapped columns, got ${result.unmappedColumns.length}`);
    }
});

// Test 3: Data integrity - unmapped column values are preserved
test('Data integrity: unmapped column values are preserved', () => {
    const inputData = {
        headers: ['A', 'B', 'C'],
        data: [
            { A: 'value_a', B: 'value_b', C: 'value_c' }
        ]
    };
    
    const mappings = {
        'X': 'A'
    };
    
    const result = applyMappingTransformation(inputData, mappings, true);
    
    const row = result.data[0];
    
    // Check mapped value
    if (row['X'] !== 'value_a') {
        throw new Error(`Expected X='value_a', got '${row['X']}'`);
    }
    
    // Check unmapped values
    if (row['B'] !== 'value_b') {
        throw new Error(`Expected B='value_b', got '${row['B']}'`);
    }
    
    if (row['C'] !== 'value_c') {
        throw new Error(`Expected C='value_c', got '${row['C']}'`);
    }
});

// Test 4: Multiple rows - all unmapped columns preserved
test('Multiple rows: all unmapped columns preserved', () => {
    const inputData = {
        headers: ['A', 'B', 'C', 'D'],
        data: [
            { A: 'a1', B: 'b1', C: 'c1', D: 'd1' },
            { A: 'a2', B: 'b2', C: 'c2', D: 'd2' },
            { A: 'a3', B: 'b3', C: 'c3', D: 'd3' }
        ]
    };
    
    const mappings = {
        'X': 'A',
        'Y': 'B'
    };
    
    const result = applyMappingTransformation(inputData, mappings, true);
    
    if (result.data.length !== 3) {
        throw new Error(`Expected 3 rows, got ${result.data.length}`);
    }
    
    // Check each row has all columns
    result.data.forEach((row, i) => {
        if (!row.hasOwnProperty('X') || !row.hasOwnProperty('Y') || 
            !row.hasOwnProperty('C') || !row.hasOwnProperty('D')) {
            throw new Error(`Row ${i} missing columns`);
        }
    });
    
    // Check values
    if (result.data[1].C !== 'c2' || result.data[2].D !== 'd3') {
        throw new Error('Unmapped column values not preserved correctly');
    }
});

// Test 5: Edge case - all columns mapped (no unmapped)
test('Edge case: all columns mapped (no unmapped)', () => {
    const inputData = {
        headers: ['A', 'B', 'C'],
        data: [
            { A: 'a1', B: 'b1', C: 'c1' }
        ]
    };
    
    const mappings = {
        'X': 'A',
        'Y': 'B',
        'Z': 'C'
    };
    
    const result = applyMappingTransformation(inputData, mappings, true);
    
    // Should have 3 headers (all mapped)
    if (result.headers.length !== 3) {
        throw new Error(`Expected 3 headers, got ${result.headers.length}`);
    }
    
    // Should have no unmapped columns
    if (result.unmappedColumns.length !== 0) {
        throw new Error(`Expected 0 unmapped columns, got ${result.unmappedColumns.length}`);
    }
});

// Test 6: Edge case - no columns mapped (all unmapped)
test('Edge case: no columns mapped (all unmapped)', () => {
    const inputData = {
        headers: ['A', 'B', 'C'],
        data: [
            { A: 'a1', B: 'b1', C: 'c1' }
        ]
    };
    
    const mappings = {};
    
    const result = applyMappingTransformation(inputData, mappings, true);
    
    // Should have 3 headers (all unmapped)
    if (result.headers.length !== 3) {
        throw new Error(`Expected 3 headers, got ${result.headers.length}`);
    }
    
    // Should have 3 unmapped columns
    if (result.unmappedColumns.length !== 3) {
        throw new Error(`Expected 3 unmapped columns, got ${result.unmappedColumns.length}`);
    }
    
    // All headers should be original input headers
    if (!result.headers.includes('A') || !result.headers.includes('B') || !result.headers.includes('C')) {
        throw new Error('Missing input headers in output');
    }
});

// Test 7: SAP scenario - 6/9 columns mapped
test('SAP scenario: 6 out of 9 columns mapped', () => {
    const inputData = {
        headers: ['Material_Number', 'Material_Description', 'Plant', 'Storage_Location', 
                  'Batch', 'Quantity', 'Unit', 'Created_By', 'Created_Date'],
        data: [
            {
                'Material_Number': 'MAT001',
                'Material_Description': 'Steel Plate',
                'Plant': 'P001',
                'Storage_Location': 'SL01',
                'Batch': 'B001',
                'Quantity': '100',
                'Unit': 'KG',
                'Created_By': 'USER1',
                'Created_Date': '2024-01-01'
            }
        ]
    };
    
    const mappings = {
        'MaterialNumber': 'Material_Number',
        'MaterialDesc': 'Material_Description',
        'PlantCode': 'Plant',
        'StorageLoc': 'Storage_Location',
        'Qty': 'Quantity',
        'UOM': 'Unit'
    };
    
    const result = applyMappingTransformation(inputData, mappings, true);
    
    // Should have 6 mapped + 3 unmapped = 9 headers
    if (result.headers.length !== 9) {
        throw new Error(`Expected 9 headers (6 mapped + 3 unmapped), got ${result.headers.length}`);
    }
    
    // Check unmapped columns are preserved
    if (!result.headers.includes('Batch') || !result.headers.includes('Created_By') || 
        !result.headers.includes('Created_Date')) {
        throw new Error('Unmapped columns (Batch, Created_By, Created_Date) not preserved');
    }
    
    // Check unmappedColumns array
    if (result.unmappedColumns.length !== 3) {
        throw new Error(`Expected 3 unmapped columns, got ${result.unmappedColumns.length}`);
    }
    
    // Check data values
    const row = result.data[0];
    if (row['MaterialNumber'] !== 'MAT001' || row['Batch'] !== 'B001' || row['Created_Date'] !== '2024-01-01') {
        throw new Error('Data values not preserved correctly');
    }
});

// Test 8: Empty data handling
test('Empty data handling', () => {
    const inputData = {
        headers: ['A', 'B', 'C'],
        data: []
    };
    
    const mappings = {
        'X': 'A'
    };
    
    const result = applyMappingTransformation(inputData, mappings, true);
    
    if (result.headers.length !== 3) {
        throw new Error(`Expected 3 headers, got ${result.headers.length}`);
    }
    
    if (result.data.length !== 0) {
        throw new Error(`Expected 0 rows, got ${result.data.length}`);
    }
    
    if (result.unmappedColumns.length !== 2) {
        throw new Error(`Expected 2 unmapped columns, got ${result.unmappedColumns.length}`);
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
    console.log('🎉 All unmapped columns tests passed!');
    process.exit(0);
} else {
    console.log('❌ Some tests failed. Please review the errors above.');
    process.exit(1);
}
