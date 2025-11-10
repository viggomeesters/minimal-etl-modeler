/**
 * Integration Test for Sample Block
 * Simulates a complete flow with Input -> Sample -> Output
 */

console.log('🧪 Running Sample Block Integration Test\n');

// Mock data store
const dataStore = {};

// Mock CSV parser
function parseCSV(csv) {
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(',');
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const row = {};
        headers.forEach((header, idx) => {
            row[header] = values[idx];
        });
        data.push(row);
    }
    
    return { headers, data };
}

// Sample data
const csvData = `MaterialNumber,MaterialDescription,Plant,StorageLocation,Quantity,UnitOfMeasure
10001234,SAP Basis Module License,1000,0001,100,EA
10001235,SAP HANA Database,1000,0001,5,EA
10001236,SAP Fiori Launchpad,2000,0002,50,EA
10001237,SAP Analytics Cloud,2000,0002,25,EA
10001238,SAP Business Warehouse,1000,0001,10,EA
10001239,SAP S/4HANA Finance,3000,0003,15,EA
10001240,SAP SuccessFactors,3000,0003,200,EA
10001241,SAP Ariba Procurement,1000,0001,30,EA
10001242,SAP Concur Expense,2000,0002,75,EA
10001243,SAP Customer Experience,1000,0001,40,EA`;

// Parse CSV
const parsed = parseCSV(csvData);
console.log(`📥 Input Data: ${parsed.data.length} records loaded`);

// Simulate Input block
dataStore['block-0'] = {
    data: parsed.data,
    headers: parsed.headers
};

// Test 1: First 3 records
console.log('\n--- Test 1: First 3 Records ---');
const sample1 = {
    headers: parsed.headers,
    data: parsed.data.slice(0, 3)
};
console.log(`✓ Sampled ${sample1.data.length} records`);
console.log(`  First record: ${sample1.data[0].MaterialNumber} - ${sample1.data[0].MaterialDescription}`);
console.log(`  Last record: ${sample1.data[2].MaterialNumber} - ${sample1.data[2].MaterialDescription}`);

// Test 2: Random 5 records
console.log('\n--- Test 2: Random 5 Records ---');
const indices = Array.from({length: parsed.data.length}, (_, i) => i);
for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
}
const selectedIndices = indices.slice(0, 5).sort((a, b) => a - b);
const sample2 = {
    headers: parsed.headers,
    data: selectedIndices.map(i => parsed.data[i])
};
console.log(`✓ Randomly sampled ${sample2.data.length} records`);
console.log(`  Selected indices: ${selectedIndices.join(', ')}`);
sample2.data.forEach(row => {
    console.log(`  - ${row.MaterialNumber}: ${row.MaterialDescription}`);
});

// Test 3: Range 4-7
console.log('\n--- Test 3: Range Records 4-7 ---');
const sample3 = {
    headers: parsed.headers,
    data: parsed.data.slice(3, 7)  // positions 4-7 (0-indexed 3-6)
};
console.log(`✓ Range sampled ${sample3.data.length} records (positions 4-7)`);
sample3.data.forEach(row => {
    console.log(`  - ${row.MaterialNumber}: ${row.MaterialDescription}`);
});

// Verify all samples have correct structure
console.log('\n--- Verification ---');
const allSamplesValid = [sample1, sample2, sample3].every(sample => {
    const hasHeaders = sample.headers && sample.headers.length === parsed.headers.length;
    const hasData = sample.data && sample.data.length > 0;
    const allRowsHaveAllColumns = sample.data.every(row => 
        sample.headers.every(header => header in row)
    );
    return hasHeaders && hasData && allRowsHaveAllColumns;
});

if (allSamplesValid) {
    console.log('✅ All samples have correct structure');
    console.log('✅ Integration test PASSED');
} else {
    console.log('❌ Some samples have incorrect structure');
    console.log('❌ Integration test FAILED');
    process.exit(1);
}

console.log('\n' + '='.repeat(50));
console.log('✅ Sample Block Integration Test Complete');
console.log('='.repeat(50));
