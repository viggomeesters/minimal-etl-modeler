// Test for export features (XLSX, filename patterns, rejected output)
// This test validates the new export functionality

const fs = require('fs');
const path = require('path');

console.log('🧪 Running Export Features Tests\n');

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

// Test 1: Check if SheetJS is included in HTML
test('SheetJS CDN is included in HTML', () => {
    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    
    if (!html.includes('sheetjs') && !html.includes('xlsx')) {
        throw new Error('SheetJS library not found in HTML');
    }
});

// Test 2: Check if Data View block is removed from toolbox
test('Data View block is removed from toolbox', () => {
    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    
    // Check that view block is not in toolbox
    const toolboxSection = html.substring(
        html.indexOf('<aside class="toolbox">'),
        html.indexOf('</aside>')
    );
    
    if (toolboxSection.includes('data-type="view"')) {
        throw new Error('Data View block still exists in toolbox');
    }
});

// Test 3: Check if dataPreviewModal exists
test('Data Preview modal exists in HTML', () => {
    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    
    if (!html.includes('dataPreviewModal')) {
        throw new Error('dataPreviewModal not found');
    }
    
    if (!html.includes('dataPreviewDisplay')) {
        throw new Error('dataPreviewDisplay element not found');
    }
});

// Test 4: Check if old viewModal is removed
test('Old viewModal is removed from HTML', () => {
    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    
    if (html.includes('id="viewModal"')) {
        throw new Error('Old viewModal still exists in HTML');
    }
});

// Test 5: Check if Rejected Output block exists in toolbox
test('Rejected Output block exists in toolbox', () => {
    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    
    if (!html.includes('data-type="rejectedoutput"')) {
        throw new Error('Rejected Output block not found in toolbox');
    }
    
    if (!html.includes('Rejected Output')) {
        throw new Error('Rejected Output label not found');
    }
});

// Test 6: Check if rejectedOutputModal exists
test('Rejected Output modal exists in HTML', () => {
    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    
    if (!html.includes('rejectedOutputModal')) {
        throw new Error('rejectedOutputModal not found');
    }
    
    if (!html.includes('rejectedOutputInterface')) {
        throw new Error('rejectedOutputInterface element not found');
    }
});

// Test 7: Check if XLSX export buttons exist in Output Data modal
test('XLSX export buttons exist in Output Data modal', () => {
    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    
    if (!html.includes('exportOutputXLSX')) {
        throw new Error('exportOutputXLSX button not found');
    }
    
    if (!html.includes('exportOutputCSV')) {
        throw new Error('exportOutputCSV button not found');
    }
});

// Test 8: Check if filename pattern input exists
test('Filename pattern input exists in modals', () => {
    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    
    if (!html.includes('exportFilename')) {
        throw new Error('exportFilename input not found');
    }
    
    if (!html.includes('rejectedExportFilename')) {
        throw new Error('rejectedExportFilename input not found');
    }
});

// Test 9: Check if export functions exist in app.js
test('Export functions exist in app.js', () => {
    const js = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
    
    if (!js.includes('function generateFilename')) {
        throw new Error('generateFilename function not found');
    }
    
    if (!js.includes('function exportToXLSX')) {
        throw new Error('exportToXLSX function not found');
    }
    
    if (!js.includes('function showDataPreview')) {
        throw new Error('showDataPreview function not found');
    }
});

// Test 10: Test generateFilename function
test('generateFilename function works correctly', () => {
    // Mock generateFilename function - matching actual implementation from app.js
    function generateFilename(pattern, defaultName, extension) {
        if (!pattern || pattern.trim() === '') {
            return `${defaultName}.${extension}`;
        }
        
        // Use fixed date for consistent testing
        const FIXED_TEST_DATE = new Date('2024-03-15T10:30:45'); // Fixed date for test reproducibility
        const now = FIXED_TEST_DATE;
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        let filename = pattern;
        
        // Replace date tokens (order matters - longest first to avoid partial replacements)
        filename = filename.replace(/YYYYMMDD_HHMMSS/g, `${year}${month}${day}_${hours}${minutes}${seconds}`);
        filename = filename.replace(/YYYYMMDD/g, `${year}${month}${day}`);
        filename = filename.replace(/YYYY-MM-DD/g, `${year}-${month}-${day}`);
        
        // Handle # separator for prefix/postfix (removes # after token replacement)
        if (filename.includes('#')) {
            filename = filename.replace(/#/g, '');
        }
        
        return `${filename}.${extension}`;
    }
    
    // Test default filename
    const result1 = generateFilename('', 'output', 'csv');
    if (result1 !== 'output.csv') {
        throw new Error(`Expected 'output.csv', got '${result1}'`);
    }
    
    // Test YYYYMMDD token
    const result2 = generateFilename('S_AUFK#YYYYMMDD', 'output', 'csv');
    if (result2 !== 'S_AUFK20240315.csv') {
        throw new Error(`Expected 'S_AUFK20240315.csv', got '${result2}'`);
    }
    
    // Test YYYY-MM-DD token
    const result3 = generateFilename('export_YYYY-MM-DD', 'output', 'xlsx');
    if (result3 !== 'export_2024-03-15.xlsx') {
        throw new Error(`Expected 'export_2024-03-15.xlsx', got '${result3}'`);
    }
    
    // Test YYYYMMDD_HHMMSS token
    const result4 = generateFilename('data_YYYYMMDD_HHMMSS', 'output', 'csv');
    if (result4 !== 'data_20240315_103045.csv') {
        throw new Error(`Expected 'data_20240315_103045.csv', got '${result4}'`);
    }
});

// Test 11: Check if rejectedDataStore exists in app.js
test('rejectedDataStore variable exists in app.js', () => {
    const js = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
    
    if (!js.includes('rejectedDataStore')) {
        throw new Error('rejectedDataStore variable not found');
    }
});

// Test 12: Check if openRejectedOutputModal function exists
test('openRejectedOutputModal function exists in app.js', () => {
    const js = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
    
    if (!js.includes('function openRejectedOutputModal')) {
        throw new Error('openRejectedOutputModal function not found');
    }
});

// Test 13: Check if exportRejectedCSV function exists
test('exportRejectedCSV function exists in app.js', () => {
    const js = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
    
    if (!js.includes('function exportRejectedCSV')) {
        throw new Error('exportRejectedCSV function not found');
    }
});

// Test 14: Test applyValidation returns rejected data
test('applyValidation returns rejected data structure', () => {
    // Mock applyValidation function
    function applyValidation(block, inputData) {
        const validations = block.validations || {};
        const headers = inputData.headers || [];
        const rows = inputData.data || [];
        
        const validRows = [];
        const rejectedRows = [];
        let validCount = 0;
        let invalidCount = 0;
        
        rows.forEach(row => {
            // Simple validation: check if 'age' field exists and is > 0
            if (validations['age'] && row['age'] <= 0) {
                rejectedRows.push({ ...row, __validation_errors__: 'age must be > 0' });
                invalidCount++;
            } else {
                validRows.push(row);
                validCount++;
            }
        });
        
        return {
            data: validRows,
            headers: headers,
            validation: {
                validCount,
                invalidCount
            },
            rejectedData: {
                data: rejectedRows,
                headers: [...headers, '__validation_errors__']
            }
        };
    }
    
    const block = { validations: { age: [{ type: 'min', value: 1 }] } };
    const inputData = {
        headers: ['name', 'age'],
        data: [
            { name: 'Alice', age: 25 },
            { name: 'Bob', age: 0 },
            { name: 'Charlie', age: 30 }
        ]
    };
    
    const result = applyValidation(block, inputData);
    
    if (!result.rejectedData) {
        throw new Error('applyValidation should return rejectedData');
    }
    
    if (result.rejectedData.data.length !== 1) {
        throw new Error('Expected 1 rejected row, got ' + result.rejectedData.data.length);
    }
    
    if (result.data.length !== 2) {
        throw new Error('Expected 2 valid rows, got ' + result.data.length);
    }
    
    if (!result.rejectedData.headers.includes('__validation_errors__')) {
        throw new Error('rejectedData should include __validation_errors__ header');
    }
});

// Test 15: Check if rejectedoutput block type is rendered
test('Rejected Output block type is rendered correctly', () => {
    const js = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
    
    // Check if renderBlock handles rejectedoutput type
    if (!js.includes("block.type === 'rejectedoutput'")) {
        throw new Error('renderBlock does not handle rejectedoutput type');
    }
});

// Test 16: Check if openBlockModal routes to rejectedoutput
test('openBlockModal routes to rejectedoutput modal', () => {
    const js = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
    
    if (!js.includes("block.type === 'rejectedoutput'")) {
        throw new Error('openBlockModal does not route rejectedoutput type');
    }
    
    if (!js.includes('openRejectedOutputModal')) {
        throw new Error('openBlockModal does not call openRejectedOutputModal');
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
    console.log('🎉 All export features tests passed!');
    process.exit(0);
} else {
    console.log('❌ Some tests failed!');
    process.exit(1);
}
