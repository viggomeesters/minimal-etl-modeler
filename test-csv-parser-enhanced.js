// Test for CSV parser with quoted values
// This test validates that the CSV parser correctly handles quoted values containing commas

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing CSV Parser with Quoted Values\n');

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

// Extract parseCSV function from app.js
const appJs = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');

// Create a minimal execution environment
const parseCSVMatch = appJs.match(/function parseCSV\(csv\) \{[\s\S]*?^}/m);
if (!parseCSVMatch) {
    console.error('❌ Could not find parseCSV function');
    process.exit(1);
}

// Execute the function in a safe context
// NOTE: eval() is used here for test purposes only, with controlled input (local file)
// This is acceptable for testing but should never be used with untrusted input
eval(parseCSVMatch[0]);

// Test 1: Basic CSV without quotes
test('Parse simple CSV without quotes', () => {
    const csv = 'Name,Age,City\nJohn,25,NYC\nJane,30,LA';
    const result = parseCSV(csv);
    
    if (result.headers.length !== 3) {
        throw new Error(`Expected 3 headers, got ${result.headers.length}`);
    }
    
    if (result.data.length !== 2) {
        throw new Error(`Expected 2 rows, got ${result.data.length}`);
    }
    
    if (result.data[0].Name !== 'John') {
        throw new Error(`Expected "John", got "${result.data[0].Name}"`);
    }
});

// Test 2: CSV with quoted values containing commas
test('Parse CSV with quoted values containing commas', () => {
    const csv = 'Product,Description,Price\nWidget,"High quality, durable widget",29.99\nGadget,Simple gadget,19.99';
    const result = parseCSV(csv);
    
    if (result.data.length !== 2) {
        throw new Error(`Expected 2 rows, got ${result.data.length}`);
    }
    
    if (result.data[0].Description !== 'High quality, durable widget') {
        throw new Error(`Expected "High quality, durable widget", got "${result.data[0].Description}"`);
    }
    
    if (result.data[1].Description !== 'Simple gadget') {
        throw new Error(`Expected "Simple gadget", got "${result.data[1].Description}"`);
    }
});

// Test 3: CSV with multiple quoted fields per row
test('Parse CSV with multiple quoted fields', () => {
    const csv = 'ID,Name,Address,Notes\n1,"John Doe","123 Main St, Apt 4","VIP, Premium"\n2,Jane Smith,456 Oak Ave,Regular';
    const result = parseCSV(csv);
    
    if (result.data[0].Name !== 'John Doe') {
        throw new Error(`Expected "John Doe", got "${result.data[0].Name}"`);
    }
    
    if (result.data[0].Address !== '123 Main St, Apt 4') {
        throw new Error(`Expected "123 Main St, Apt 4", got "${result.data[0].Address}"`);
    }
    
    if (result.data[0].Notes !== 'VIP, Premium') {
        throw new Error(`Expected "VIP, Premium", got "${result.data[0].Notes}"`);
    }
});

// Test 4: Empty lines are skipped
test('Empty lines are skipped', () => {
    const csv = 'Name,Value\nTest,123\n\nAnother,456\n\n';
    const result = parseCSV(csv);
    
    if (result.data.length !== 2) {
        throw new Error(`Expected 2 rows (empty lines skipped), got ${result.data.length}`);
    }
});

// Test 5: Empty values
test('Parse CSV with empty values', () => {
    const csv = 'A,B,C\n1,,3\n4,5,';
    const result = parseCSV(csv);
    
    if (result.data[0].B !== '') {
        throw new Error(`Expected empty string for B, got "${result.data[0].B}"`);
    }
    
    if (result.data[1].C !== '') {
        throw new Error(`Expected empty string for C, got "${result.data[1].C}"`);
    }
});

// Test 6: Headers only (no data rows)
test('Parse CSV with headers only', () => {
    const csv = 'Header1,Header2,Header3';
    const result = parseCSV(csv);
    
    if (result.headers.length !== 3) {
        throw new Error(`Expected 3 headers, got ${result.headers.length}`);
    }
    
    if (result.data.length !== 0) {
        throw new Error(`Expected 0 data rows, got ${result.data.length}`);
    }
});

// Test 7: Complex SAP-like data
test('Parse SAP-like CSV data', () => {
    const csv = 'MaterialNumber,MaterialDescription,Plant,Notes\n10001234,"SAP Basis Module, Enterprise License",1000,"Version 7.5, includes support"\n10001235,SAP HANA Database,1000,Standard';
    const result = parseCSV(csv);
    
    if (result.data[0].MaterialDescription !== 'SAP Basis Module, Enterprise License') {
        throw new Error(`Quoted description not parsed correctly: "${result.data[0].MaterialDescription}"`);
    }
    
    if (result.data[0].Notes !== 'Version 7.5, includes support') {
        throw new Error(`Quoted notes not parsed correctly: "${result.data[0].Notes}"`);
    }
});

// Print summary
console.log('\n==================================================');
console.log('Test Summary');
console.log('==================================================');
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📊 Total:  ${testsPassed + testsFailed}`);
console.log('==================================================\n');

if (testsFailed === 0) {
    console.log('🎉 All CSV parser tests passed!');
    process.exit(0);
} else {
    console.log('⚠️  Some tests failed. Please review the errors above.');
    process.exit(1);
}
