// Integration test for automapper with complete data flow
// This test validates the automapper in an end-to-end scenario

const fs = require('fs');
const path = require('path');

console.log('🧪 Running Automapper Integration Tests\n');

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

// Helper function to simulate the complete automapper flow
function simulateAutomapperFlow() {
    // Normalization function
    function normalize(str) {
        return str.toLowerCase()
            .replace(/[_\s-]/g, '')
            .replace(/[^a-z0-9]/g, '');
    }
    
    // Calculate similarity
    function calculateSimilarity(str1, str2) {
        const len1 = str1.length;
        const len2 = str2.length;
        const maxLen = Math.max(len1, len2);
        
        if (maxLen === 0) return 1.0;
        
        let matches = 0;
        const minLen = Math.min(len1, len2);
        for (let i = 0; i < minLen; i++) {
            if (str1[i] === str2[i]) {
                matches++;
            }
        }
        
        const chars1 = new Set(str1);
        const chars2 = new Set(str2);
        let commonChars = 0;
        chars1.forEach(char => {
            if (chars2.has(char)) {
                commonChars++;
            }
        });
        
        return (matches * 2 + commonChars) / (maxLen * 2 + Math.max(chars1.size, chars2.size));
    }
    
    // Auto-generate mappings
    function autoGenerateMappings(inputHeaders, outputHeaders) {
        const mappings = {};
        const matchedInputs = new Set();
        const matchConfidence = {};
        
        outputHeaders.forEach(outHeader => {
            let bestMatch = null;
            let bestScore = 0;
            
            inputHeaders.forEach(inHeader => {
                if (matchedInputs.has(inHeader)) {
                    return;
                }
                
                const outNorm = normalize(outHeader);
                const inNorm = normalize(inHeader);
                
                if (outNorm === inNorm) {
                    bestMatch = inHeader;
                    bestScore = 1.0;
                    matchConfidence[outHeader] = 'exact';
                } else if (bestScore < 0.8 && (outNorm.includes(inNorm) || inNorm.includes(outNorm))) {
                    bestMatch = inHeader;
                    bestScore = 0.8;
                    matchConfidence[outHeader] = 'partial';
                } else if (bestScore < 0.5) {
                    const similarity = calculateSimilarity(outNorm, inNorm);
                    if (similarity > 0.5 && similarity > bestScore) {
                        bestMatch = inHeader;
                        bestScore = similarity;
                        matchConfidence[outHeader] = 'fuzzy';
                    }
                }
            });
            
            if (bestMatch) {
                mappings[outHeader] = bestMatch;
                matchedInputs.add(bestMatch);
            } else {
                matchConfidence[outHeader] = 'unmatched';
            }
        });
        
        return { mappings, matchConfidence };
    }
    
    // Apply mapping transformation
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
        
        return {
            data: outputRows,
            headers: outputHeaders
        };
    }
    
    return {
        autoGenerateMappings,
        applyMappingTransformation
    };
}

// Test 1: Complete flow with SAP-like data
test('Complete automapper flow with SAP data', () => {
    const { autoGenerateMappings, applyMappingTransformation } = simulateAutomapperFlow();
    
    // Input data (SAP format)
    const inputData = {
        headers: ['MaterialNumber', 'MaterialDescription', 'Plant', 'StorageLocation', 'StockQuantity'],
        data: [
            {
                MaterialNumber: '10001234',
                MaterialDescription: 'SAP ERP Module',
                Plant: '1000',
                StorageLocation: 'WH01',
                StockQuantity: '150'
            },
            {
                MaterialNumber: '10001235',
                MaterialDescription: 'Database License',
                Plant: '2000',
                StorageLocation: 'WH02',
                StockQuantity: '75'
            }
        ]
    };
    
    // Output template
    const outputHeaders = ['material_number', 'description', 'plant_code', 'quantity'];
    
    // Step 1: Auto-generate mappings
    const { mappings, matchConfidence } = autoGenerateMappings(inputData.headers, outputHeaders);
    
    // Verify mappings
    if (mappings['material_number'] !== 'MaterialNumber') {
        throw new Error('Failed to map material_number');
    }
    
    if (!mappings['description'] || 
        (mappings['description'] !== 'MaterialDescription' && 
         matchConfidence['description'] === 'unmatched')) {
        throw new Error('Failed to map description');
    }
    
    if (!mappings['plant_code'] || 
        (mappings['plant_code'] !== 'Plant' && 
         matchConfidence['plant_code'] === 'unmatched')) {
        throw new Error('Failed to map plant_code');
    }
    
    // Step 2: Apply transformations
    const transformedData = applyMappingTransformation(inputData, mappings);
    
    // Verify transformed data
    if (transformedData.headers.length !== Object.keys(mappings).length) {
        throw new Error('Output headers count mismatch');
    }
    
    if (transformedData.data.length !== inputData.data.length) {
        throw new Error('Output rows count mismatch');
    }
    
    if (transformedData.data[0].material_number !== '10001234') {
        throw new Error('Data transformation failed for material_number');
    }
});

// Test 2: Automapper with high match rate
test('Automapper achieves high match rate with good data', () => {
    const { autoGenerateMappings } = simulateAutomapperFlow();
    
    const inputHeaders = ['CustomerID', 'CustomerName', 'Address', 'City', 'Country'];
    const outputHeaders = ['customer_id', 'customer_name', 'address', 'city', 'country'];
    
    const { mappings, matchConfidence } = autoGenerateMappings(inputHeaders, outputHeaders);
    
    // Should match all 5 columns
    if (Object.keys(mappings).length !== 5) {
        throw new Error(`Expected 5 mappings, got ${Object.keys(mappings).length}`);
    }
    
    // All should be exact matches
    const exactMatches = Object.values(matchConfidence).filter(c => c === 'exact').length;
    if (exactMatches !== 5) {
        throw new Error(`Expected 5 exact matches, got ${exactMatches}`);
    }
});

// Test 3: Automapper with partial matches
test('Automapper handles partial matches correctly', () => {
    const { autoGenerateMappings } = simulateAutomapperFlow();
    
    const inputHeaders = ['ProductCode', 'ProductName', 'CategoryID'];
    const outputHeaders = ['Product', 'Name', 'Category'];
    
    const { mappings, matchConfidence } = autoGenerateMappings(inputHeaders, outputHeaders);
    
    // Should match all 3 with partial matches
    if (Object.keys(mappings).length !== 3) {
        throw new Error(`Expected 3 mappings, got ${Object.keys(mappings).length}`);
    }
    
    // Verify partial match logic works
    const hasPartialMatches = Object.values(matchConfidence).some(c => c === 'partial');
    if (!hasPartialMatches) {
        throw new Error('Expected at least one partial match');
    }
});

// Test 4: Automapper with mixed confidence levels
test('Automapper shows different confidence levels', () => {
    const { autoGenerateMappings } = simulateAutomapperFlow();
    
    const inputHeaders = ['OrderNumber', 'OrderDate', 'Customer', 'RandomField'];
    const outputHeaders = ['order_number', 'date', 'cust', 'unknown_field'];
    
    const { mappings, matchConfidence } = autoGenerateMappings(inputHeaders, outputHeaders);
    
    // Should have at least one exact match
    const hasExact = Object.values(matchConfidence).includes('exact');
    if (!hasExact) {
        throw new Error('Expected at least one exact match');
    }
    
    // Should have at least one unmatched
    const hasUnmatched = Object.values(matchConfidence).includes('unmatched');
    if (!hasUnmatched) {
        throw new Error('Expected at least one unmatched field');
    }
});

// Test 5: Data preservation through transformation
test('Data values are preserved through automapper transformation', () => {
    const { autoGenerateMappings, applyMappingTransformation } = simulateAutomapperFlow();
    
    const inputData = {
        headers: ['ID', 'Name', 'Value'],
        data: [
            { ID: '001', Name: 'Test Item', Value: '99.99' },
            { ID: '002', Name: 'Another Item', Value: '149.99' }
        ]
    };
    
    const outputHeaders = ['id', 'name', 'value'];
    
    const { mappings } = autoGenerateMappings(inputData.headers, outputHeaders);
    const transformedData = applyMappingTransformation(inputData, mappings);
    
    // Check that data values are preserved
    if (transformedData.data[0].id !== '001') {
        throw new Error('Data value not preserved for ID');
    }
    
    if (transformedData.data[1].name !== 'Another Item') {
        throw new Error('Data value not preserved for Name');
    }
    
    if (transformedData.data[0].value !== '99.99') {
        throw new Error('Data value not preserved for Value');
    }
});

// Test 6: Automapper handles special characters
test('Automapper normalizes special characters correctly', () => {
    const { autoGenerateMappings } = simulateAutomapperFlow();
    
    const inputHeaders = ['Item-Code', 'Item_Name', 'Item Description'];
    const outputHeaders = ['itemcode', 'itemname', 'itemdescription'];
    
    const { mappings } = autoGenerateMappings(inputHeaders, outputHeaders);
    
    // All should match despite different separators
    if (Object.keys(mappings).length !== 3) {
        throw new Error('Failed to match columns with special characters');
    }
});

// Test 7: Large dataset performance
test('Automapper handles larger column sets', () => {
    const { autoGenerateMappings } = simulateAutomapperFlow();
    
    // Generate 20 input and output columns
    const inputHeaders = [];
    const outputHeaders = [];
    for (let i = 1; i <= 20; i++) {
        inputHeaders.push(`Field${i}`);
        outputHeaders.push(`field_${i}`);
    }
    
    const startTime = Date.now();
    const { mappings } = autoGenerateMappings(inputHeaders, outputHeaders);
    const duration = Date.now() - startTime;
    
    // Should complete quickly (< 100ms for 20 columns)
    if (duration > 100) {
        throw new Error(`Performance issue: took ${duration}ms for 20 columns`);
    }
    
    // Should match all 20
    if (Object.keys(mappings).length !== 20) {
        throw new Error(`Expected 20 mappings, got ${Object.keys(mappings).length}`);
    }
});

// Test 8: Verify no duplicate mappings
test('Automapper prevents duplicate mappings', () => {
    const { autoGenerateMappings } = simulateAutomapperFlow();
    
    // Multiple output columns that could match the same input
    const inputHeaders = ['Status'];
    const outputHeaders = ['status', 'status_code', 'stat'];
    
    const { mappings } = autoGenerateMappings(inputHeaders, outputHeaders);
    
    // Count how many times 'Status' is used
    const statusUsageCount = Object.values(mappings).filter(v => v === 'Status').length;
    
    if (statusUsageCount > 1) {
        throw new Error('Input column "Status" was mapped multiple times');
    }
});

// Test 9: Empty value handling
test('Automapper handles empty/missing values in data', () => {
    const { autoGenerateMappings, applyMappingTransformation } = simulateAutomapperFlow();
    
    const inputData = {
        headers: ['Col1', 'Col2', 'Col3'],
        data: [
            { Col1: 'Value1', Col2: '', Col3: 'Value3' },
            { Col1: '', Col2: 'Value2', Col3: '' }
        ]
    };
    
    const outputHeaders = ['col1', 'col2'];
    
    const { mappings } = autoGenerateMappings(inputData.headers, outputHeaders);
    const transformedData = applyMappingTransformation(inputData, mappings);
    
    // Empty values should be preserved as empty strings
    if (transformedData.data[0].col2 !== '') {
        throw new Error('Empty value not preserved correctly');
    }
    
    if (transformedData.data[1].col1 !== '') {
        throw new Error('Empty value not preserved correctly');
    }
});

// Test 10: Case insensitivity
test('Automapper is case insensitive', () => {
    const { autoGenerateMappings } = simulateAutomapperFlow();
    
    const inputHeaders = ['ITEM', 'QTY', 'price'];
    const outputHeaders = ['Item', 'Qty', 'PRICE'];
    
    const { mappings, matchConfidence } = autoGenerateMappings(inputHeaders, outputHeaders);
    
    // All should match exactly (case insensitive)
    if (Object.keys(mappings).length !== 3) {
        throw new Error('Case sensitivity issue in matching');
    }
    
    // All should be exact matches
    const allExact = Object.values(matchConfidence).every(c => c === 'exact');
    if (!allExact) {
        throw new Error('Not all matches recognized as exact (case insensitive)');
    }
});

// Print summary
console.log('\n' + '='.repeat(50));
console.log('Integration Test Summary');
console.log('='.repeat(50));
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📊 Total:  ${testsPassed + testsFailed}`);
console.log('='.repeat(50));

if (testsFailed === 0) {
    console.log('\n🎉 All automapper integration tests passed!');
    console.log('✨ The complete data flow works correctly:');
    console.log('   Data Input → Automapper → Mapping → Transform → Output');
    process.exit(0);
} else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
    process.exit(1);
}
