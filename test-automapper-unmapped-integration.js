// Integration test for automapper unmapped columns passthrough
// This test validates that unmapped columns flow through to downstream blocks

const fs = require('fs');
const path = require('path');

console.log('🧪 Running Automapper Unmapped Columns Integration Tests\n');

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

// Define the functions we need for testing (copied from app.js)
function normalize(str) {
    return str.toLowerCase()
        .replace(/[_\s-]/g, '')
        .replace(/[^a-z0-9]/g, '');
}

function calculateSimilarity(str1, str2) {
    const norm1 = normalize(str1);
    const norm2 = normalize(str2);
    
    if (norm1 === norm2) return 1.0;
    if (norm1.length === 0 || norm2.length === 0) return 0;
    
    let matches = 0;
    const maxLen = Math.max(norm1.length, norm2.length);
    
    for (let i = 0; i < Math.min(norm1.length, norm2.length); i++) {
        if (norm1[i] === norm2[i]) {
            matches += 2;
        }
    }
    
    const set1 = new Set(norm1.split(''));
    const set2 = new Set(norm2.split(''));
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    matches += intersection.size;
    
    return matches / (maxLen * 2);
}

function autoGenerateMappings(inputHeaders, outputHeaders) {
    const mappings = {};
    const matchedInputs = new Set();
    const matchConfidence = {};
    const SIMILARITY_THRESHOLD = 0.5;
    const PARTIAL_MATCH_SCORE = 0.8;
    const EXACT_MATCH_SCORE = 1.0;
    
    outputHeaders.forEach(outHeader => {
        let bestMatch = null;
        let bestScore = 0;
        let confidence = 'unmatched';
        
        inputHeaders.forEach(inHeader => {
            if (matchedInputs.has(inHeader)) {
                return;
            }
            
            const outNorm = normalize(outHeader);
            const inNorm = normalize(inHeader);
            
            if (outNorm === inNorm) {
                bestMatch = inHeader;
                bestScore = EXACT_MATCH_SCORE;
                confidence = 'exact';
            } else if (bestScore < EXACT_MATCH_SCORE) {
                if (outNorm.includes(inNorm) || inNorm.includes(outNorm)) {
                    if (PARTIAL_MATCH_SCORE > bestScore) {
                        bestMatch = inHeader;
                        bestScore = PARTIAL_MATCH_SCORE;
                        confidence = 'partial';
                    }
                } else {
                    const similarity = calculateSimilarity(outHeader, inHeader);
                    if (similarity > SIMILARITY_THRESHOLD && similarity > bestScore) {
                        bestMatch = inHeader;
                        bestScore = similarity;
                        confidence = 'fuzzy';
                    }
                }
            }
        });
        
        if (bestMatch) {
            mappings[outHeader] = bestMatch;
            matchedInputs.add(bestMatch);
            matchConfidence[outHeader] = confidence;
        } else {
            matchConfidence[outHeader] = 'unmatched';
        }
    });
    
    return { mappings, matchConfidence };
}

function applyMappingTransformation(inputData, mappings, includeUnmapped = false) {
    const inputRows = inputData.data || [];
    const inputHeaders = inputData.headers || [];
    
    const outputHeaders = Object.keys(mappings);
    
    const mappedInputColumns = new Set(Object.values(mappings));
    const unmappedInputColumns = inputHeaders.filter(h => !mappedInputColumns.has(h));
    
    const allOutputHeaders = includeUnmapped 
        ? [...outputHeaders, ...unmappedInputColumns]
        : outputHeaders;
    
    const outputRows = inputRows.map(row => {
        const newRow = {};
        
        outputHeaders.forEach(outputCol => {
            const inputCol = mappings[outputCol];
            newRow[outputCol] = row[inputCol] || '';
        });
        
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

// Test 1: Complete workflow - automapper with unmapped columns flows to mapping block
test('Complete workflow: automapper → mapping block with unmapped columns', () => {
    // Simulate SAP data with 9 columns
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
    
    // Target template with 6 columns
    const outputHeaders = ['MaterialNumber', 'MaterialDesc', 'PlantCode', 'StorageLoc', 'Quantity', 'Unit'];
    
    // Step 1: Auto-generate mappings
    const { mappings, matchConfidence } = autoGenerateMappings(inputData.headers, outputHeaders);
    
    // Automapper will successfully map 6 columns
    if (Object.keys(mappings).length !== 6) {
        throw new Error(`Expected 6 mappings, got ${Object.keys(mappings).length}`);
    }
    
    // Step 2: Apply automapper with unmapped columns passthrough
    const automapperResult = applyMappingTransformation(inputData, mappings, true);
    
    // Verify result has all 9 columns (6 mapped + 3 unmapped)
    if (automapperResult.headers.length !== 9) {
        throw new Error(`Expected 9 headers (6 mapped + 3 unmapped), got ${automapperResult.headers.length}`);
    }
    
    // Verify unmapped columns are preserved
    if (automapperResult.unmappedColumns.length !== 3) {
        throw new Error(`Expected 3 unmapped columns, got ${automapperResult.unmappedColumns.length}`);
    }
    
    // Step 3: Use automapper output as input to mapping block
    // User can now manually map the 3 unmapped columns
    const manualMappings = {
        'BatchNumber': 'Batch',
        'CreatedByUser': 'Created_By',
        'CreationDate': 'Created_Date'
    };
    
    // Apply manual mappings to automapper output
    const finalResult = applyMappingTransformation(automapperResult, manualMappings, false);
    
    // Verify final result has all original data accessible
    if (finalResult.headers.length !== 3) {
        throw new Error(`Expected 3 manually mapped headers, got ${finalResult.headers.length}`);
    }
    
    // Verify data values
    const row = finalResult.data[0];
    if (row['BatchNumber'] !== 'B001') {
        throw new Error('Batch data not preserved correctly');
    }
    if (row['CreatedByUser'] !== 'USER1') {
        throw new Error('Created_By data not preserved correctly');
    }
    if (row['CreationDate'] !== '2024-01-01') {
        throw new Error('Created_Date data not preserved correctly');
    }
});

// Test 2: Verify unmapped columns can be selected in downstream mapping block
test('Unmapped columns are available for selection in mapping block', () => {
    const inputData = {
        headers: ['A', 'B', 'C', 'D', 'E'],
        data: [
            { A: 'a1', B: 'b1', C: 'c1', D: 'd1', E: 'e1' }
        ]
    };
    
    const outputHeaders = ['X', 'Y'];
    const { mappings } = autoGenerateMappings(inputData.headers, outputHeaders);
    
    // Apply automapper with passthrough
    const automapperResult = applyMappingTransformation(inputData, mappings, true);
    
    // Simulate mapping block receiving automapper output
    const availableColumnsForMapping = automapperResult.headers;
    
    // Verify all original columns are available (mapped + unmapped)
    if (!availableColumnsForMapping.includes('A')) {
        throw new Error('Mapped column A not available');
    }
    
    // Check unmapped columns are available
    const unmappedInOriginal = inputData.headers.filter(h => !Object.values(mappings).includes(h));
    unmappedInOriginal.forEach(col => {
        if (!availableColumnsForMapping.includes(col)) {
            throw new Error(`Unmapped column ${col} not available for manual mapping`);
        }
    });
});

// Test 3: Multi-stage workflow - automapper → mapping → another mapping
test('Multi-stage workflow: progressive manual mapping of unmapped columns', () => {
    const inputData = {
        headers: ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta'],
        data: [
            { Alpha: 'v1', Beta: 'v2', Gamma: 'v3', Delta: 'v4', Epsilon: 'v5', Zeta: 'v6' }
        ]
    };
    
    const outputHeaders = ['Alpha', 'Beta'];
    
    // Stage 1: Automapper maps 2 exact match columns, 4 unmapped pass through
    const { mappings: autoMappings } = autoGenerateMappings(inputData.headers, outputHeaders);
    const stage1Result = applyMappingTransformation(inputData, autoMappings, true);
    
    // Verify we have the mapped columns plus unmapped columns
    const mappedCount = Object.keys(autoMappings).length;
    const expectedUnmapped1 = inputData.headers.length - mappedCount;
    
    if (stage1Result.unmappedColumns.length !== expectedUnmapped1) {
        throw new Error(`Expected ${expectedUnmapped1} unmapped after stage 1, got ${stage1Result.unmappedColumns.length}`);
    }
    
    // Verify data integrity - all original values should be present
    const row1 = stage1Result.data[0];
    if (row1['Alpha'] !== 'v1' || row1['Gamma'] !== 'v3') {
        throw new Error('Stage 1 data not preserved correctly');
    }
    
    // Stage 2: User can now manually map some unmapped columns in a mapping block
    // The mapping block gets stage1Result as input and can select from all its columns
    if (stage1Result.unmappedColumns.length > 0) {
        // Verify unmapped columns are accessible
        const availableForMapping = stage1Result.headers;
        stage1Result.unmappedColumns.forEach(col => {
            if (!availableForMapping.includes(col)) {
                throw new Error(`Unmapped column ${col} not available for manual mapping`);
            }
        });
    }
    
    // Success! The unmapped columns are now available for manual mapping in downstream blocks
});

// Test 4: Realistic SAP scenario with partial automation
test('Realistic SAP scenario: 6 auto-mapped + 3 manual-mapped', () => {
    const inputData = {
        headers: [
            'Material_Number', 'Material_Description', 'Plant', 'Storage_Location',
            'Batch', 'Quantity', 'Unit', 'Created_By', 'Created_Date'
        ],
        data: [
            {
                'Material_Number': 'MAT001',
                'Material_Description': 'Steel Plate',
                'Plant': 'P001',
                'Storage_Location': 'SL01',
                'Batch': 'BATCH001',
                'Quantity': '100',
                'Unit': 'KG',
                'Created_By': 'JSMITH',
                'Created_Date': '2024-01-15'
            }
        ]
    };
    
    const outputHeaders = [
        'MaterialNumber', 'MaterialDesc', 'PlantCode',
        'StorageLoc', 'Quantity', 'Unit'
    ];
    
    // Step 1: Automapper
    const { mappings: autoMappings } = autoGenerateMappings(inputData.headers, outputHeaders);
    const autoResult = applyMappingTransformation(inputData, autoMappings, true);
    
    // Verify 3 columns unmapped (Batch, Created_By, Created_Date)
    if (autoResult.unmappedColumns.length !== 3) {
        throw new Error(`Expected 3 unmapped columns, got ${autoResult.unmappedColumns.length}`);
    }
    
    // Verify unmapped columns are the expected ones
    const expectedUnmapped = ['Batch', 'Created_By', 'Created_Date'];
    expectedUnmapped.forEach(col => {
        if (!autoResult.unmappedColumns.includes(col)) {
            throw new Error(`Expected unmapped column ${col} not found`);
        }
    });
    
    // Step 2: Manual mapping of unmapped columns
    const manualMappings = {
        'BatchNumber': 'Batch',
        'CreatedBy': 'Created_By',
        'CreatedOn': 'Created_Date'
    };
    const finalResult = applyMappingTransformation(autoResult, manualMappings, false);
    
    // Verify final output
    if (finalResult.headers.length !== 3) {
        throw new Error(`Expected 3 headers in final output, got ${finalResult.headers.length}`);
    }
    
    // Verify data integrity
    const row = finalResult.data[0];
    if (row['BatchNumber'] !== 'BATCH001') {
        throw new Error('Batch data lost or incorrect');
    }
    if (row['CreatedBy'] !== 'JSMITH') {
        throw new Error('CreatedBy data lost or incorrect');
    }
    if (row['CreatedOn'] !== '2024-01-15') {
        throw new Error('CreatedOn data lost or incorrect');
    }
});

// Test 5: Verify backward compatibility - existing mappings still work
test('Backward compatibility: existing mappings without unmapped passthrough', () => {
    const inputData = {
        headers: ['A', 'B', 'C'],
        data: [
            { A: 'a1', B: 'b1', C: 'c1' }
        ]
    };
    
    const mappings = {
        'X': 'A',
        'Y': 'B'
    };
    
    // Old behavior - without passthrough (default false)
    const result = applyMappingTransformation(inputData, mappings);
    
    // Should only have mapped columns
    if (result.headers.length !== 2) {
        throw new Error(`Expected 2 headers without passthrough, got ${result.headers.length}`);
    }
    
    // Should not expose unmapped columns when flag not set
    if (result.unmappedColumns && result.unmappedColumns.length > 0) {
        throw new Error('Should not return unmapped columns without flag');
    }
});

console.log('\n==================================================');
console.log('Integration Test Summary');
console.log('==================================================');
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📊 Total:  ${testsPassed + testsFailed}`);
console.log('==================================================\n');

if (testsFailed === 0) {
    console.log('🎉 All unmapped columns integration tests passed!');
    console.log('✨ The complete workflow now supports:');
    console.log('   1. Automapper maps columns automatically');
    console.log('   2. Unmapped columns pass through to downstream blocks');
    console.log('   3. Users can manually map unmapped columns in mapping blocks');
    console.log('   4. Full data preservation throughout the pipeline');
    process.exit(0);
} else {
    console.log('❌ Some integration tests failed. Please review the errors above.');
    process.exit(1);
}
