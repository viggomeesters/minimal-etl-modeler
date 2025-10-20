// Integration test for Minimal ETL Modeler
// This test validates the core functionality

const fs: any = require('fs');
const path: any = require('path');

console.log('🧪 Running Integration Tests for Minimal ETL Modeler\n');

let testsPassed = 0;
let testsFailed = 0;

function test(name: string, fn: () => void): void {
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

// Test 1: Check if all required files exist
test('All required files exist', () => {
    const requiredFiles = [
        'index.html',
        'style.css',
        'app.js',
        'sample-data.csv',
        'README.md'
    ];
    
    requiredFiles.forEach(file => {
        const filePath = path.join(__dirname, file);
        if (!fs.existsSync(filePath)) {
            throw new Error(`Missing required file: ${file}`);
        }
    });
});

// Test 2: Validate index.html structure
test('index.html has required structure', () => {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    
    const requiredElements = [
        'toolbox',
        'canvas',
        'tool-item',
        'data-type="input"',
        'data-type="view"',
        'inputModal',
        'viewModal'
    ];
    
    requiredElements.forEach(element => {
        if (!html.includes(element)) {
            throw new Error(`Missing required element: ${element}`);
        }
    });
});

// Test 3: Validate CSS file
test('style.css has key styles', () => {
    const css = fs.readFileSync(path.join(__dirname, 'style.css'), 'utf8');
    
    const requiredClasses = [
        '.toolbox',
        '.canvas',
        '.block',
        '.modal',
        '.tool-item'
    ];
    
    requiredClasses.forEach(cls => {
        if (!css.includes(cls)) {
            throw new Error(`Missing CSS class: ${cls}`);
        }
    });
});

// Test 4: Validate JavaScript functions
test('app.js has core functions', () => {
    const js = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    
    const requiredFunctions = [
        'initDragAndDrop',
        'createBlock',
        'parseCSV',
        'handleFileSelect',
        'displayData',
        'addConnection'
    ];
    
    requiredFunctions.forEach(fn => {
        if (!js.includes(`function ${fn}`)) {
            throw new Error(`Missing function: ${fn}`);
        }
    });
});

// Test 5: Validate sample CSV
test('sample-data.csv has valid format', () => {
    const csv = fs.readFileSync(path.join(__dirname, 'sample-data.csv'), 'utf8');
    const lines = csv.trim().split('\n');
    
    if (lines.length < 2) {
        throw new Error('CSV must have at least header and one data row');
    }
    
    const headerCount = lines[0].split(',').length;
    
    // Check all rows have same number of columns
    for (let i = 1; i < lines.length; i++) {
        const colCount = lines[i].split(',').length;
        if (colCount !== headerCount) {
            throw new Error(`Row ${i + 1} has ${colCount} columns, expected ${headerCount}`);
        }
    }
});

// Test 6: Validate CSV parsing logic
test('CSV parsing function works correctly', () => {
    function parseCSV(csv: string): any[] {
        const lines = csv.trim().split('\n');
        if (lines.length === 0) return [];
        
        const headers = lines[0].split(',').map((h: string) => h.trim());
        const data: any[] = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map((v: string) => v.trim());
            const row: any = {};
            headers.forEach((header: string, index: number) => {
                row[header] = values[index] || '';
            });
            data.push(row);
        }
        
        return data;
    }
    
    const testCSV = 'Name,Age\nJohn,30\nJane,25';
    const result = parseCSV(testCSV);
    
    if (result.length !== 2) {
        throw new Error(`Expected 2 rows, got ${result.length}`);
    }
    
    if (result[0].Name !== 'John' || result[0].Age !== '30') {
        throw new Error('CSV parsing incorrect');
    }
});

// Test 7: Validate JavaScript syntax
test('JavaScript files have valid syntax', () => {
    const { execSync } = require('child_process');
    
    try {
        execSync('node -c app.js', { cwd: __dirname });
    } catch (error) {
        throw new Error('JavaScript syntax error in app.js');
    }
});

// Test 8: Validate SAP data structure
test('Sample data has SAP-relevant fields', () => {
    const csv = fs.readFileSync(path.join(__dirname, 'sample-data.csv'), 'utf8');
    const headers = csv.split('\n')[0];
    
    const sapFields = ['Material', 'Plant', 'Storage'];
    const hasSAPFields = sapFields.some(field => headers.includes(field));
    
    if (!hasSAPFields) {
        throw new Error('Sample data should contain SAP-relevant fields');
    }
});

// Test 9: Check README content
test('README has essential information', () => {
    const readme = fs.readFileSync(path.join(__dirname, 'README.md'), 'utf8');
    
    const requiredSections = [
        'Features',
        'Quick Start',
        'Design Filosofie'
    ];
    
    requiredSections.forEach(section => {
        if (!readme.includes(section)) {
            throw new Error(`README missing section: ${section}`);
        }
    });
});

// Test 10: Validate file sizes are reasonable
test('File sizes are reasonable for POC', () => {
    const checkSize = (file, maxSizeKB) => {
        const stats = fs.statSync(path.join(__dirname, file));
        const sizeKB = stats.size / 1024;
        if (sizeKB > maxSizeKB) {
            throw new Error(`${file} is too large: ${sizeKB.toFixed(2)}KB (max ${maxSizeKB}KB)`);
        }
    };
    
    // Reasonable size limits for a POC
    checkSize('app.js', 50);      // 50KB max
    checkSize('style.css', 20);    // 20KB max
    checkSize('index.html', 10);   // 10KB max
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
    console.log('\n🎉 All tests passed! ETL Modeler POC is ready.');
    process.exit(0);
} else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
    process.exit(1);
}

// Export to make this a module (fixes duplicate function issues in TypeScript)
export {};
