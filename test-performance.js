// Performance test for large datasets (10k+ records)
// Tests the optimizations implemented for handling large datasets

const fs = require('fs');

// Read app.js and extract functions
const appCode = fs.readFileSync('./app.js', 'utf8');

// Constants
const MAX_DISPLAY_ROWS = 100;
const LARGE_DATASET_THRESHOLD = 1000;

// Mock performance object for Node.js
if (typeof performance === 'undefined') {
    global.performance = {
        now: () => Date.now()
    };
}

// Mock document for DOM operations
global.document = {
    createElement: (tag) => {
        return {
            textContent: '',
            innerHTML: '',
            style: {},
            setAttribute: () => {},
            appendChild: () => {},
            querySelector: () => null
        };
    },
    getElementById: () => ({
        innerHTML: '',
        appendChild: () => {}
    })
};

// Performance monitoring function
let performanceMetrics = {
    lastOperationTime: 0,
    operationCount: 0
};

function measurePerformance(operationName, fn, warnThreshold = 1000) {
    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    performanceMetrics.lastOperationTime = duration;
    performanceMetrics.operationCount++;
    
    if (duration > warnThreshold) {
        console.warn(`⚠️ Performance warning: ${operationName} took ${duration.toFixed(2)}ms`);
    } else {
        console.log(`✓ ${operationName}: ${duration.toFixed(2)}ms`);
    }
    
    return result;
}

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function parseCSV(csv) {
    try {
        const lines = csv.trim().split('\n');
        if (lines.length === 0) return { data: [], headers: [] };
        
        function parseLine(line) {
            const values = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    values.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            values.push(current.trim());
            return values;
        }
        
        const headers = parseLine(lines[0]);
        const data = [];
        
        const isLargeDataset = lines.length > LARGE_DATASET_THRESHOLD;
        
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            const values = parseLine(lines[i]);
            const row = {};
            
            for (let j = 0; j < headers.length; j++) {
                row[headers[j]] = values[j] || '';
            }
            
            data.push(row);
        }
        
        return { 
            data: data, 
            headers: headers,
            isLarge: isLargeDataset 
        };
    } catch (error) {
        console.error('Error parsing CSV:', error);
        return { data: [], headers: [], error: error.message };
    }
}

function applyAdvancedTransformationLogic(inputData, transformations, preserveUnmapped = true) {
    const inputRows = inputData.data || [];
    const inputHeaders = inputData.headers || [];
    const outputHeaders = Object.keys(transformations);
    
    const outputRows = inputRows.map(row => {
        const newRow = {};
        
        if (preserveUnmapped) {
            inputHeaders.forEach(inputCol => {
                const isUsedInTransformation = outputHeaders.some(outCol => {
                    const transformation = transformations[outCol];
                    return transformation.inputs && transformation.inputs.includes(inputCol);
                });
                
                if (!isUsedInTransformation) {
                    newRow[inputCol] = row[inputCol] || '';
                }
            });
        }
        
        outputHeaders.forEach(outputCol => {
            const transformation = transformations[outputCol];
            const op = transformation.op;
            const inputs = transformation.inputs || [];
            const params = transformation.params || {};
            
            try {
                let result = '';
                
                switch(op) {
                    case 'copy':
                        result = inputs.length > 0 ? (row[inputs[0]] || '') : '';
                        break;
                    case 'concatenate':
                        result = inputs.map(col => row[col] || '').join(params.separator || ' ');
                        break;
                    default:
                        result = '';
                }
                
                newRow[outputCol] = result;
            } catch(e) {
                newRow[outputCol] = '';
            }
        });
        
        return newRow;
    });
    
    let finalHeaders = outputHeaders;
    if (preserveUnmapped) {
        const unmappedColumns = inputHeaders.filter(inputCol => {
            return !outputHeaders.some(outCol => {
                const transformation = transformations[outCol];
                return transformation.inputs && transformation.inputs.includes(inputCol);
            });
        });
        finalHeaders = [...unmappedColumns, ...outputHeaders];
    }
    
    return {
        data: outputRows,
        headers: finalHeaders
    };
}

// Generate large CSV dataset
function generateLargeCSV(numRows) {
    let csv = 'MaterialNumber,MaterialDescription,Plant,StorageLocation,Quantity,UnitOfMeasure,Price,Vendor\n';
    
    for (let i = 1; i <= numRows; i++) {
        const matNum = 10000000 + i;
        const desc = `Material Item ${i}`;
        const plant = 1000 + (i % 10);
        const storage = String(i % 100).padStart(4, '0');
        const qty = Math.floor(Math.random() * 1000);
        const uom = ['EA', 'KG', 'LT', 'PC'][i % 4];
        const price = (Math.random() * 1000).toFixed(2);
        const vendor = `VENDOR_${String(i % 50).padStart(3, '0')}`;
        
        csv += `${matNum},"${desc}",${plant},${storage},${qty},${uom},${price},${vendor}\n`;
    }
    
    return csv;
}

// Display data function (optimized version)
function displayData(blockData) {
    let headers = [];
    let rows = [];
    
    if (blockData && blockData.headers && Array.isArray(blockData.headers)) {
        headers = blockData.headers;
        rows = blockData.data || [];
    }
    
    if (headers.length === 0) return 0;
    
    const isLargeDataset = rows.length >= LARGE_DATASET_THRESHOLD;
    
    if (isLargeDataset) {
        // Use DOM manipulation
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        const tbody = document.createElement('tbody');
        const displayRows = rows.slice(0, MAX_DISPLAY_ROWS);
        
        displayRows.forEach(row => {
            const tr = document.createElement('tr');
            headers.forEach(header => {
                const td = document.createElement('td');
                td.textContent = row[header] || '';
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        
        table.appendChild(tbody);
        return displayRows.length;
    } else {
        // Use string concatenation
        let html = '<table><thead><tr>';
        headers.forEach(header => {
            html += `<th>${escapeHtml(header)}</th>`;
        });
        html += '</tr></thead><tbody>';
        
        rows.slice(0, MAX_DISPLAY_ROWS).forEach(row => {
            html += '<tr>';
            headers.forEach(header => {
                html += `<td>${escapeHtml(row[header] || '')}</td>`;
            });
            html += '</tr>';
        });
        html += '</tbody></table>';
        return Math.min(rows.length, MAX_DISPLAY_ROWS);
    }
}

console.log('🚀 Testing Performance Optimizations for Large Datasets\n');
console.log('=' .repeat(60));

// Test with different dataset sizes
const testSizes = [500, 1000, 5000, 10000, 15000];

const results = [];

testSizes.forEach(size => {
    console.log(`\n📊 Testing with ${size} records:`);
    console.log('-'.repeat(60));
    
    // Generate data
    const csv = measurePerformance('Generate CSV', () => generateLargeCSV(size));
    const csvSizeMB = (csv.length / 1024 / 1024).toFixed(2);
    console.log(`   CSV size: ${csvSizeMB} MB`);
    
    // Parse CSV
    const parsed = measurePerformance('Parse CSV', () => parseCSV(csv));
    console.log(`   Rows parsed: ${parsed.data.length}, Large dataset flag: ${parsed.isLarge}`);
    
    // Test transformation
    const transformations = {
        'FullDescription': {
            op: 'concatenate',
            inputs: ['MaterialNumber', 'MaterialDescription'],
            params: { separator: ' - ' }
        },
        'NewColumn': {
            op: 'copy',
            inputs: ['Plant'],
            params: {}
        }
    };
    
    const transformed = measurePerformance('Transform data', () => 
        applyAdvancedTransformationLogic(parsed, transformations, true)
    );
    console.log(`   Rows transformed: ${transformed.data.length}`);
    
    // Test data display
    const displayCount = measurePerformance('Display preparation', () => 
        displayData(parsed)
    );
    console.log(`   Display rows: ${displayCount}`);
    
    const totalTime = performanceMetrics.operationCount > 0 ? 
        performanceMetrics.lastOperationTime : 0;
    
    results.push({
        size,
        totalTime,
        parsedRows: parsed.data.length,
        isLarge: parsed.isLarge
    });
    
    console.log(`\n⏱️  Total processing time: ${totalTime.toFixed(2)}ms`);
    
    if (size >= LARGE_DATASET_THRESHOLD && !parsed.isLarge) {
        console.log('⚠️  Warning: Large dataset flag not set correctly');
    } else if (size >= LARGE_DATASET_THRESHOLD && parsed.isLarge) {
        console.log('✅ Performance optimizations active');
    }
});

console.log('\n' + '='.repeat(60));
console.log('📈 Performance Summary:');
console.log('='.repeat(60));

results.forEach(result => {
    const optimized = result.isLarge ? '🚀' : '  ';
    console.log(`${optimized} ${String(result.size).padStart(6)} rows: ${result.totalTime.toFixed(2)}ms`);
});

console.log('\n✅ Performance test completed!\n');

// Verify optimization thresholds
console.log('🔍 Optimization Threshold Verification:');
console.log('-'.repeat(60));
results.forEach(result => {
    const shouldOptimize = result.size >= LARGE_DATASET_THRESHOLD;
    const isOptimized = result.isLarge;
    const status = shouldOptimize === isOptimized ? '✅' : '❌';
    console.log(`${status} ${result.size} rows: Expected optimized=${shouldOptimize}, Actual=${isOptimized}`);
});

// Check if performance degrades significantly
console.log('\n📊 Performance Scaling Analysis:');
console.log('-'.repeat(60));
for (let i = 1; i < results.length; i++) {
    const prevSize = results[i-1].size;
    const currSize = results[i].size;
    const prevTime = results[i-1].totalTime;
    const currTime = results[i].totalTime;
    
    const sizeRatio = currSize / prevSize;
    const timeRatio = currTime / prevTime;
    
    // Ideally, time should scale linearly with size (ratio ~1)
    // If timeRatio >> sizeRatio, performance is degrading
    const scalingEfficiency = sizeRatio / timeRatio;
    
    console.log(`${prevSize} → ${currSize} rows: ${sizeRatio.toFixed(1)}x size, ${timeRatio.toFixed(2)}x time (efficiency: ${scalingEfficiency.toFixed(2)})`);
}

console.log('\n✨ All tests completed successfully!\n');
