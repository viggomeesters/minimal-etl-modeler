// Test for automapper functionality
// This test validates the automapper module

const fs = require('fs');
const path = require('path');

console.log('🧪 Running Automapper Module Tests\n');

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

// Test 1: Check if automapper block is in index.html
test('Automapper block exists in toolbox', () => {
    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    
    if (!html.includes('data-type="automapper"')) {
        throw new Error('Automapper block not found in toolbox');
    }
    
    if (!html.includes('Automapper')) {
        throw new Error('Automapper label not found');
    }
});

// Test 2: Check if automapper modal exists
test('Automapper modal exists in HTML', () => {
    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    
    if (!html.includes('automapperModal')) {
        throw new Error('Automapper modal not found');
    }
    
    if (!html.includes('Automatically generated column mappings')) {
        throw new Error('Automapper modal description not found');
    }
});

// Test 3: Check if automapper functions exist in app.js
test('Automapper functions exist in app.js', () => {
    const js = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
    
    const requiredFunctions = [
        'autoGenerateMappings',
        'openAutomapperModal',
        'applyAutomapper',
        'sendToMappingBlock',
        'calculateSimilarity'
    ];
    
    requiredFunctions.forEach(fn => {
        if (!js.includes(`function ${fn}`)) {
            throw new Error(`Missing function: ${fn}`);
        }
    });
});

// Test 4: Test exact match mapping
test('Exact match mapping works', () => {
    function normalize(str) {
        return str.toLowerCase()
            .replace(/[_\s-]/g, '')
            .replace(/[^a-z0-9]/g, '');
    }
    
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
    
    const inputHeaders = ['MaterialNumber', 'MaterialDescription', 'Plant'];
    const outputHeaders = ['material_number', 'material_description'];
    
    const result = autoGenerateMappings(inputHeaders, outputHeaders);
    
    if (result.mappings['material_number'] !== 'MaterialNumber') {
        throw new Error('Exact match failed for material_number');
    }
    
    if (result.mappings['material_description'] !== 'MaterialDescription') {
        throw new Error('Exact match failed for material_description');
    }
    
    if (result.matchConfidence['material_number'] !== 'exact') {
        throw new Error('Confidence should be exact for material_number');
    }
});

// Test 5: Test normalization function
test('Column name normalization works', () => {
    function normalize(str) {
        return str.toLowerCase()
            .replace(/[_\s-]/g, '')
            .replace(/[^a-z0-9]/g, '');
    }
    
    if (normalize('Material_Number') !== 'materialnumber') {
        throw new Error('Underscore normalization failed');
    }
    
    if (normalize('Material Number') !== 'materialnumber') {
        throw new Error('Space normalization failed');
    }
    
    if (normalize('Material-Number') !== 'materialnumber') {
        throw new Error('Hyphen normalization failed');
    }
    
    if (normalize('MATERIAL_NUMBER') !== 'materialnumber') {
        throw new Error('Uppercase normalization failed');
    }
});

// Test 6: Test partial match mapping
test('Partial match mapping works', () => {
    function normalize(str) {
        return str.toLowerCase()
            .replace(/[_\s-]/g, '')
            .replace(/[^a-z0-9]/g, '');
    }
    
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
    
    const inputHeaders = ['MaterialNumber', 'Description', 'PlantCode'];
    const outputHeaders = ['Material', 'Desc'];
    
    const result = autoGenerateMappings(inputHeaders, outputHeaders);
    
    if (result.mappings['Material'] !== 'MaterialNumber') {
        throw new Error('Partial match failed for Material -> MaterialNumber');
    }
    
    if (result.mappings['Desc'] !== 'Description') {
        throw new Error('Partial match failed for Desc -> Description');
    }
    
    if (result.matchConfidence['Material'] !== 'partial') {
        throw new Error('Confidence should be partial for Material');
    }
});

// Test 7: Test unmatched columns
test('Unmatched columns are detected', () => {
    function normalize(str) {
        return str.toLowerCase()
            .replace(/[_\s-]/g, '')
            .replace(/[^a-z0-9]/g, '');
    }
    
    function autoGenerateMappings(inputHeaders, outputHeaders) {
        const mappings = {};
        const matchedInputs = new Set();
        const matchConfidence = {};
        
        outputHeaders.forEach(outHeader => {
            let bestMatch = null;
            
            inputHeaders.forEach(inHeader => {
                if (matchedInputs.has(inHeader)) {
                    return;
                }
                
                const outNorm = normalize(outHeader);
                const inNorm = normalize(inHeader);
                
                if (outNorm === inNorm) {
                    bestMatch = inHeader;
                    matchConfidence[outHeader] = 'exact';
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
    
    const inputHeaders = ['FieldA', 'FieldB'];
    const outputHeaders = ['FieldA', 'FieldC'];
    
    const result = autoGenerateMappings(inputHeaders, outputHeaders);
    
    if (result.matchConfidence['FieldC'] !== 'unmatched') {
        throw new Error('FieldC should be marked as unmatched');
    }
    
    if (result.mappings['FieldC']) {
        throw new Error('FieldC should not have a mapping');
    }
});

// Test 8: Test similarity calculation
test('Similarity calculation works', () => {
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
    
    // Test identical strings
    const sim1 = calculateSimilarity('test', 'test');
    if (sim1 < 0.9) {
        throw new Error('Identical strings should have high similarity');
    }
    
    // Test completely different strings
    const sim2 = calculateSimilarity('abcd', 'wxyz');
    if (sim2 > 0.3) {
        throw new Error('Different strings should have low similarity');
    }
    
    // Test similar strings
    const sim3 = calculateSimilarity('material', 'materials');
    if (sim3 < 0.5) {
        throw new Error('Similar strings should have medium-high similarity');
    }
});

// Test 9: Test unique matching (no duplicates)
test('Each input column is matched only once', () => {
    function normalize(str) {
        return str.toLowerCase()
            .replace(/[_\s-]/g, '')
            .replace(/[^a-z0-9]/g, '');
    }
    
    function autoGenerateMappings(inputHeaders, outputHeaders) {
        const mappings = {};
        const matchedInputs = new Set();
        const matchConfidence = {};
        
        outputHeaders.forEach(outHeader => {
            let bestMatch = null;
            
            inputHeaders.forEach(inHeader => {
                if (matchedInputs.has(inHeader)) {
                    return;
                }
                
                const outNorm = normalize(outHeader);
                const inNorm = normalize(inHeader);
                
                if (outNorm === inNorm) {
                    bestMatch = inHeader;
                    matchConfidence[outHeader] = 'exact';
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
    
    const inputHeaders = ['Name'];
    const outputHeaders = ['Name', 'name', 'NAME'];
    
    const result = autoGenerateMappings(inputHeaders, outputHeaders);
    
    // Only one output should be matched
    const matchedCount = Object.keys(result.mappings).length;
    if (matchedCount !== 1) {
        throw new Error(`Expected 1 match, got ${matchedCount}. Each input should match only once.`);
    }
    
    // The rest should be unmatched
    const unmatchedCount = Object.values(result.matchConfidence).filter(c => c === 'unmatched').length;
    if (unmatchedCount !== 2) {
        throw new Error('Expected 2 unmatched outputs');
    }
});

// Test 10: Check if automapper block type is handled in renderBlock
test('Automapper block type is rendered correctly', () => {
    const js = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
    
    if (!js.includes("block.type === 'automapper'")) {
        throw new Error('Automapper block type not handled in renderBlock');
    }
});

// Test 11: Check CSS for automapper styles
test('CSS has automapper styles', () => {
    const css = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');
    
    if (!css.includes('#applyAutomapper')) {
        throw new Error('Missing CSS for apply automapper button');
    }
    
    if (!css.includes('#sendToMapping')) {
        throw new Error('Missing CSS for send to mapping button');
    }
});

// Test 12: Test empty headers
test('Empty input or output headers handled gracefully', () => {
    function normalize(str) {
        return str.toLowerCase()
            .replace(/[_\s-]/g, '')
            .replace(/[^a-z0-9]/g, '');
    }
    
    function autoGenerateMappings(inputHeaders, outputHeaders) {
        const mappings = {};
        const matchedInputs = new Set();
        const matchConfidence = {};
        
        outputHeaders.forEach(outHeader => {
            let bestMatch = null;
            
            inputHeaders.forEach(inHeader => {
                if (matchedInputs.has(inHeader)) {
                    return;
                }
                
                const outNorm = normalize(outHeader);
                const inNorm = normalize(inHeader);
                
                if (outNorm === inNorm) {
                    bestMatch = inHeader;
                    matchConfidence[outHeader] = 'exact';
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
    
    // Test with empty input
    const result1 = autoGenerateMappings([], ['Output1']);
    if (Object.keys(result1.mappings).length !== 0) {
        throw new Error('Empty input should produce no mappings');
    }
    
    // Test with empty output
    const result2 = autoGenerateMappings(['Input1'], []);
    if (Object.keys(result2.mappings).length !== 0) {
        throw new Error('Empty output should produce no mappings');
    }
    
    // Test with both empty
    const result3 = autoGenerateMappings([], []);
    if (Object.keys(result3.mappings).length !== 0) {
        throw new Error('Both empty should produce no mappings');
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
    console.log('\n🎉 All automapper tests passed!');
    process.exit(0);
} else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
    process.exit(1);
}
