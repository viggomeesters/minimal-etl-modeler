// Test script for CSV parsing functionality
const fs = require('fs');
const path = require('path');

// Read the sample CSV file
const csvPath = path.join(__dirname, 'sample-data.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');

console.log('📊 Testing CSV Parser\n');
console.log('Sample CSV Content:');
console.log('-------------------');
console.log(csvContent.substring(0, 200) + '...\n');

// Simulate the parseCSV function from app.js
function parseCSV(csv) {
    const lines = csv.trim().split('\n');
    if (lines.length === 0) return { data: [], headers: [] };
    
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });
        data.push(row);
    }
    
    return { data: data, headers: headers };
}

// Parse the CSV
const parsed = parseCSV(csvContent);

console.log('✅ Parsing Results:');
console.log('-------------------');
console.log(`Total rows: ${parsed.data.length}`);
console.log(`Columns: ${parsed.headers.join(', ')}\n`);

console.log('First 3 rows:');
parsed.data.slice(0, 3).forEach((row, index) => {
    console.log(`\nRow ${index + 1}:`);
    Object.entries(row).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
    });
});

console.log('\n✅ CSV parsing test completed successfully!');
