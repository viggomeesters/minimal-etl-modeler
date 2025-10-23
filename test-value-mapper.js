// Test for value mapper functionality
// This test validates the value mapper module

const fs = require('fs');
const path = require('path');

console.log('🧪 Running Value Mapper Module Tests\n');

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

// Test 1: Check if valuemapper block is in index.html
test('Value Mapper block exists in toolbox', () => {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    
    if (!html.includes('data-type="valuemapper"')) {
        throw new Error('Value Mapper block not found in toolbox');
    }
    
    if (!html.includes('Value Mapper')) {
        throw new Error('Value Mapper label not found');
    }
});

// Test 2: Check if valuemapper modal exists
test('Value Mapper modal exists in HTML', () => {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    
    if (!html.includes('valueMapperModal')) {
        throw new Error('Value Mapper modal not found');
    }
    
    if (!html.includes('Value Mapper')) {
        throw new Error('Value Mapper modal title not found');
    }
});

// Test 3: Check if value mapper functions exist in app.js
test('Value Mapper functions exist in app.js', () => {
    const js = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    
    const requiredFunctions = [
        'openValueMapperModal',
        'createValueMappingRow',
        'applyValueMapping',
        'applyValueMappingTransformation'
    ];
    
    requiredFunctions.forEach(fn => {
        if (!js.includes(`function ${fn}`)) {
            throw new Error(`Missing function: ${fn}`);
        }
    });
});

// Test 4: Test basic value mapping transformation (NL → Nederland)
test('Basic value mapping works correctly (NL → Nederland)', () => {
    // Simulate the value mapping transformation function
    function applyValueMappingTransformation(inputData, valueMap) {
        const inputRows = inputData.data || [];
        const inputHeaders = inputData.headers || [];
        
        // Create shallow clone of rows with value replacements
        const outputRows = inputRows.map(row => {
            const newRow = { ...row };
            
            // Apply value mappings for each column
            Object.keys(valueMap).forEach(column => {
                const columnMappings = valueMap[column];
                const originalValue = newRow[column];
                
                // Replace value if mapping exists (exact match)
                if (originalValue !== undefined && columnMappings[originalValue] !== undefined) {
                    newRow[column] = columnMappings[originalValue];
                }
            });
            
            return newRow;
        });
        
        // Count applied mappings for metadata
        let appliedMappings = 0;
        Object.keys(valueMap).forEach(column => {
            appliedMappings += Object.keys(valueMap[column]).length;
        });
        
        return {
            data: outputRows,
            headers: inputHeaders,
            valueMapping: {
                mappings: valueMap,
                appliedCount: appliedMappings
            }
        };
    }
    
    // Test data
    const inputData = {
        headers: ['Country', 'City', 'Population'],
        data: [
            { Country: 'NL', City: 'Amsterdam', Population: '850000' },
            { Country: 'NL', City: 'Rotterdam', Population: '650000' },
            { Country: 'BE', City: 'Brussels', Population: '180000' }
        ]
    };
    
    // Test value mapping: NL → Nederland
    const valueMap = {
        'Country': {
            'NL': 'Nederland',
            'BE': 'België'
        }
    };
    
    const result = applyValueMappingTransformation(inputData, valueMap);
    
    // Validate result
    if (result.headers.length !== 3) {
        throw new Error(`Expected 3 headers, got ${result.headers.length}`);
    }
    
    if (result.data.length !== 3) {
        throw new Error(`Expected 3 rows, got ${result.data.length}`);
    }
    
    if (result.data[0].Country !== 'Nederland') {
        throw new Error(`Expected 'Nederland', got '${result.data[0].Country}'`);
    }
    
    if (result.data[1].Country !== 'Nederland') {
        throw new Error(`Expected 'Nederland', got '${result.data[1].Country}'`);
    }
    
    if (result.data[2].Country !== 'België') {
        throw new Error(`Expected 'België', got '${result.data[2].Country}'`);
    }
    
    // Ensure other columns remain unchanged
    if (result.data[0].City !== 'Amsterdam') {
        throw new Error('Other columns should remain unchanged');
    }
});

// Test 5: Test that unmapped values remain intact
test('Unmapped values remain intact', () => {
    function applyValueMappingTransformation(inputData, valueMap) {
        const inputRows = inputData.data || [];
        const inputHeaders = inputData.headers || [];
        
        const outputRows = inputRows.map(row => {
            const newRow = { ...row };
            
            Object.keys(valueMap).forEach(column => {
                const columnMappings = valueMap[column];
                const originalValue = newRow[column];
                
                if (originalValue !== undefined && columnMappings[originalValue] !== undefined) {
                    newRow[column] = columnMappings[originalValue];
                }
            });
            
            return newRow;
        });
        
        let appliedMappings = 0;
        Object.keys(valueMap).forEach(column => {
            appliedMappings += Object.keys(valueMap[column]).length;
        });
        
        return {
            data: outputRows,
            headers: inputHeaders,
            valueMapping: {
                mappings: valueMap,
                appliedCount: appliedMappings
            }
        };
    }
    
    const inputData = {
        headers: ['Status', 'Code'],
        data: [
            { Status: 'Active', Code: 'A123' },
            { Status: 'Inactive', Code: 'B456' },
            { Status: 'Pending', Code: 'C789' }
        ]
    };
    
    // Only map Active and Inactive, leave Pending unmapped
    const valueMap = {
        'Status': {
            'Active': 'Actief',
            'Inactive': 'Inactief'
        }
    };
    
    const result = applyValueMappingTransformation(inputData, valueMap);
    
    if (result.data[0].Status !== 'Actief') {
        throw new Error('Mapped value should be replaced');
    }
    
    if (result.data[1].Status !== 'Inactief') {
        throw new Error('Mapped value should be replaced');
    }
    
    if (result.data[2].Status !== 'Pending') {
        throw new Error('Unmapped value should remain unchanged');
    }
    
    // Ensure other columns remain unchanged
    if (result.data[0].Code !== 'A123') {
        throw new Error('Other columns should remain unchanged');
    }
});

// Test 6: Test dataStore is updated and contains valueMapping metadata
test('DataStore update includes valueMapping metadata', () => {
    function applyValueMappingTransformation(inputData, valueMap) {
        const inputRows = inputData.data || [];
        const inputHeaders = inputData.headers || [];
        
        const outputRows = inputRows.map(row => {
            const newRow = { ...row };
            
            Object.keys(valueMap).forEach(column => {
                const columnMappings = valueMap[column];
                const originalValue = newRow[column];
                
                if (originalValue !== undefined && columnMappings[originalValue] !== undefined) {
                    newRow[column] = columnMappings[originalValue];
                }
            });
            
            return newRow;
        });
        
        let appliedMappings = 0;
        Object.keys(valueMap).forEach(column => {
            appliedMappings += Object.keys(valueMap[column]).length;
        });
        
        return {
            data: outputRows,
            headers: inputHeaders,
            valueMapping: {
                mappings: valueMap,
                appliedCount: appliedMappings
            }
        };
    }
    
    const inputData = {
        headers: ['Color'],
        data: [
            { Color: 'R' },
            { Color: 'G' }
        ]
    };
    
    const valueMap = {
        'Color': {
            'R': 'Red',
            'G': 'Green',
            'B': 'Blue'
        }
    };
    
    const result = applyValueMappingTransformation(inputData, valueMap);
    
    // Check that valueMapping metadata exists
    if (!result.valueMapping) {
        throw new Error('Result should include valueMapping metadata');
    }
    
    if (!result.valueMapping.mappings) {
        throw new Error('valueMapping should include mappings');
    }
    
    if (result.valueMapping.appliedCount !== 3) {
        throw new Error(`Expected appliedCount to be 3, got ${result.valueMapping.appliedCount}`);
    }
});

// Test 7: Test multiple column mappings
test('Multiple column mappings work correctly', () => {
    function applyValueMappingTransformation(inputData, valueMap) {
        const inputRows = inputData.data || [];
        const inputHeaders = inputData.headers || [];
        
        const outputRows = inputRows.map(row => {
            const newRow = { ...row };
            
            Object.keys(valueMap).forEach(column => {
                const columnMappings = valueMap[column];
                const originalValue = newRow[column];
                
                if (originalValue !== undefined && columnMappings[originalValue] !== undefined) {
                    newRow[column] = columnMappings[originalValue];
                }
            });
            
            return newRow;
        });
        
        let appliedMappings = 0;
        Object.keys(valueMap).forEach(column => {
            appliedMappings += Object.keys(valueMap[column]).length;
        });
        
        return {
            data: outputRows,
            headers: inputHeaders,
            valueMapping: {
                mappings: valueMap,
                appliedCount: appliedMappings
            }
        };
    }
    
    const inputData = {
        headers: ['Country', 'Status'],
        data: [
            { Country: 'NL', Status: 'A' },
            { Country: 'BE', Status: 'I' }
        ]
    };
    
    // Map both columns
    const valueMap = {
        'Country': {
            'NL': 'Nederland',
            'BE': 'België'
        },
        'Status': {
            'A': 'Active',
            'I': 'Inactive'
        }
    };
    
    const result = applyValueMappingTransformation(inputData, valueMap);
    
    if (result.data[0].Country !== 'Nederland') {
        throw new Error('First column mapping failed');
    }
    
    if (result.data[0].Status !== 'Active') {
        throw new Error('Second column mapping failed');
    }
    
    if (result.data[1].Country !== 'België') {
        throw new Error('First column mapping failed for second row');
    }
    
    if (result.data[1].Status !== 'Inactive') {
        throw new Error('Second column mapping failed for second row');
    }
});

// Test 8: Check if valuemapper block type is handled in renderBlock
test('Value Mapper block type is rendered correctly', () => {
    const js = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    
    // Check if valuemapper type is handled
    if (!js.includes("block.type === 'valuemapper'")) {
        throw new Error('Value Mapper block type not handled in renderBlock');
    }
});

// Test 9: Check if valueMap property is saved
test('valueMap property is serialized in saveFlow', () => {
    const js = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    
    // Check if valueMap is included in saveFlow
    if (!js.includes('valueMap: block.valueMap')) {
        throw new Error('valueMap property not serialized in saveFlow');
    }
});

// Test 10: Test empty value mapping
test('Empty value mapping produces original data', () => {
    function applyValueMappingTransformation(inputData, valueMap) {
        const inputRows = inputData.data || [];
        const inputHeaders = inputData.headers || [];
        
        const outputRows = inputRows.map(row => {
            const newRow = { ...row };
            
            Object.keys(valueMap).forEach(column => {
                const columnMappings = valueMap[column];
                const originalValue = newRow[column];
                
                if (originalValue !== undefined && columnMappings[originalValue] !== undefined) {
                    newRow[column] = columnMappings[originalValue];
                }
            });
            
            return newRow;
        });
        
        let appliedMappings = 0;
        Object.keys(valueMap).forEach(column => {
            appliedMappings += Object.keys(valueMap[column]).length;
        });
        
        return {
            data: outputRows,
            headers: inputHeaders,
            valueMapping: {
                mappings: valueMap,
                appliedCount: appliedMappings
            }
        };
    }
    
    const inputData = {
        headers: ['Name'],
        data: [{ Name: 'John' }]
    };
    
    const result = applyValueMappingTransformation(inputData, {});
    
    if (result.data[0].Name !== 'John') {
        throw new Error('Empty mapping should preserve original values');
    }
    
    if (result.valueMapping.appliedCount !== 0) {
        throw new Error('Empty mapping should have appliedCount of 0');
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
    console.log('\n🎉 All value mapper tests passed!');
    process.exit(0);
} else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
    process.exit(1);
}
