/**
 * Test Suite for Sample Block
 * 
 * Tests the Sample block functionality including:
 * - First N records sampling
 * - Random N records sampling
 * - Range-based sampling
 */

console.log('🧪 Running Sample Block Tests\n');

// Mock functions needed for the tests
function applySampleLogic(inputData, mode, options) {
    const totalRows = inputData.data.length;
    let sampledData = [];
    
    if (mode === 'first') {
        const count = options.count;
        if (isNaN(count) || count < 1 || count > totalRows) {
            return { error: 'Invalid count' };
        }
        sampledData = inputData.data.slice(0, count);
        
    } else if (mode === 'random') {
        const count = options.count;
        if (isNaN(count) || count < 1 || count > totalRows) {
            return { error: 'Invalid count' };
        }
        
        // Create array of indices and shuffle using Fisher-Yates algorithm
        const indices = Array.from({length: totalRows}, (_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        
        // Take first N indices and sort them to maintain some order
        const selectedIndices = indices.slice(0, count).sort((a, b) => a - b);
        sampledData = selectedIndices.map(i => inputData.data[i]);
        
    } else if (mode === 'range') {
        const { rangeStart, rangeEnd } = options;
        
        if (isNaN(rangeStart) || isNaN(rangeEnd)) {
            return { error: 'Invalid range' };
        }
        if (rangeStart < 1 || rangeEnd < 1) {
            return { error: 'Range must be >= 1' };
        }
        if (rangeStart > totalRows || rangeEnd > totalRows) {
            return { error: 'Range exceeds total rows' };
        }
        if (rangeStart > rangeEnd) {
            return { error: 'Start must be <= end' };
        }
        
        // Convert to 0-indexed for array slicing
        sampledData = inputData.data.slice(rangeStart - 1, rangeEnd);
    }
    
    return {
        headers: inputData.headers,
        data: sampledData
    };
}

// Test utilities
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, testName) {
    if (condition) {
        console.log(`✅ PASS: ${testName}`);
        testsPassed++;
    } else {
        console.log(`❌ FAIL: ${testName}`);
        testsFailed++;
    }
}

function assertDeepEqual(actual, expected, testName) {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    assert(actualStr === expectedStr, testName);
}

// Test data
const testData = {
    headers: ['id', 'name', 'value'],
    data: [
        { id: '1', name: 'Alice', value: '100' },
        { id: '2', name: 'Bob', value: '200' },
        { id: '3', name: 'Charlie', value: '300' },
        { id: '4', name: 'David', value: '400' },
        { id: '5', name: 'Eve', value: '500' },
        { id: '6', name: 'Frank', value: '600' },
        { id: '7', name: 'Grace', value: '700' },
        { id: '8', name: 'Henry', value: '800' },
        { id: '9', name: 'Iris', value: '900' },
        { id: '10', name: 'Jack', value: '1000' }
    ]
};

// Test 1: First N records
const firstN = applySampleLogic(testData, 'first', { count: 3 });
assert(!firstN.error, 'First N: No error returned');
assert(firstN.data.length === 3, 'First N: Returns correct count');
assertDeepEqual(firstN.data[0], testData.data[0], 'First N: First record matches');
assertDeepEqual(firstN.data[2], testData.data[2], 'First N: Third record matches');
assertDeepEqual(firstN.headers, testData.headers, 'First N: Headers preserved');

// Test 2: First N with count = total rows
const firstAll = applySampleLogic(testData, 'first', { count: 10 });
assert(!firstAll.error, 'First all: No error returned');
assert(firstAll.data.length === 10, 'First all: Returns all records');

// Test 3: First N with invalid count (too large)
const firstInvalid = applySampleLogic(testData, 'first', { count: 15 });
assert(firstInvalid.error, 'First invalid: Returns error for count > total rows');

// Test 4: First N with invalid count (zero)
const firstZero = applySampleLogic(testData, 'first', { count: 0 });
assert(firstZero.error, 'First zero: Returns error for count = 0');

// Test 5: Random N records
const randomN = applySampleLogic(testData, 'random', { count: 5 });
assert(!randomN.error, 'Random N: No error returned');
assert(randomN.data.length === 5, 'Random N: Returns correct count');
assertDeepEqual(randomN.headers, testData.headers, 'Random N: Headers preserved');

// Test 6: Random N - verify all records are from original dataset
const randomN2 = applySampleLogic(testData, 'random', { count: 4 });
let allFromOriginal = randomN2.data.every(row => {
    return testData.data.some(origRow => 
        origRow.id === row.id && origRow.name === row.name && origRow.value === row.value
    );
});
assert(allFromOriginal, 'Random N: All records are from original dataset');

// Test 7: Random N with invalid count
const randomInvalid = applySampleLogic(testData, 'random', { count: 15 });
assert(randomInvalid.error, 'Random invalid: Returns error for count > total rows');

// Test 8: Range sampling (basic)
const range1 = applySampleLogic(testData, 'range', { rangeStart: 3, rangeEnd: 6 });
assert(!range1.error, 'Range basic: No error returned');
assert(range1.data.length === 4, 'Range basic: Returns correct count (3 to 6 inclusive = 4 records)');
assertDeepEqual(range1.data[0], testData.data[2], 'Range basic: First record matches (position 3)');
assertDeepEqual(range1.data[3], testData.data[5], 'Range basic: Last record matches (position 6)');

// Test 9: Range sampling (single record)
const rangeSingle = applySampleLogic(testData, 'range', { rangeStart: 5, rangeEnd: 5 });
assert(!rangeSingle.error, 'Range single: No error returned');
assert(rangeSingle.data.length === 1, 'Range single: Returns single record');
assertDeepEqual(rangeSingle.data[0], testData.data[4], 'Range single: Correct record returned');

// Test 10: Range sampling (full dataset)
const rangeFull = applySampleLogic(testData, 'range', { rangeStart: 1, rangeEnd: 10 });
assert(!rangeFull.error, 'Range full: No error returned');
assert(rangeFull.data.length === 10, 'Range full: Returns all records');

// Test 11: Range with start > end
const rangeInvalid1 = applySampleLogic(testData, 'range', { rangeStart: 7, rangeEnd: 3 });
assert(rangeInvalid1.error, 'Range invalid: Returns error when start > end');

// Test 12: Range with position 0
const rangeInvalid2 = applySampleLogic(testData, 'range', { rangeStart: 0, rangeEnd: 5 });
assert(rangeInvalid2.error, 'Range invalid: Returns error when position < 1');

// Test 13: Range exceeding total rows
const rangeInvalid3 = applySampleLogic(testData, 'range', { rangeStart: 5, rangeEnd: 15 });
assert(rangeInvalid3.error, 'Range invalid: Returns error when end > total rows');

// Test 14: Empty dataset
const emptyData = { headers: ['col1'], data: [] };
const firstEmpty = applySampleLogic(emptyData, 'first', { count: 1 });
assert(firstEmpty.error, 'Empty dataset: Returns error for first N');

const randomEmpty = applySampleLogic(emptyData, 'random', { count: 1 });
assert(randomEmpty.error, 'Empty dataset: Returns error for random N');

const rangeEmpty = applySampleLogic(emptyData, 'range', { rangeStart: 1, rangeEnd: 1 });
assert(rangeEmpty.error, 'Empty dataset: Returns error for range');

// Test 15: Single record dataset
const singleData = {
    headers: ['id', 'name'],
    data: [{ id: '1', name: 'Solo' }]
};

const firstSingle = applySampleLogic(singleData, 'first', { count: 1 });
assert(!firstSingle.error, 'Single record: First 1 works');
assert(firstSingle.data.length === 1, 'Single record: Returns 1 record');

const randomSingle = applySampleLogic(singleData, 'random', { count: 1 });
assert(!randomSingle.error, 'Single record: Random 1 works');
assert(randomSingle.data.length === 1, 'Single record: Returns 1 record');

const rangeSingle2 = applySampleLogic(singleData, 'range', { rangeStart: 1, rangeEnd: 1 });
assert(!rangeSingle2.error, 'Single record: Range 1-1 works');
assert(rangeSingle2.data.length === 1, 'Single record: Returns 1 record');

// Print summary
console.log('\n' + '='.repeat(50));
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);
console.log('='.repeat(50));

process.exit(testsFailed > 0 ? 1 : 0);
