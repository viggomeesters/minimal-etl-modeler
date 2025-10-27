import { JoinExecutor, executeJoin } from '../../src/executor/joinExecutor';
import { JoinType, JoinConfig, DataSchema } from '../../src/models/block';

describe('JoinExecutor', () => {
  const leftData = [
    { id: 1, name: 'Alice', dept_id: 10 },
    { id: 2, name: 'Bob', dept_id: 20 },
    { id: 3, name: 'Charlie', dept_id: 10 },
    { id: 4, name: 'David', dept_id: null }
  ];
  
  const rightData = [
    { dept_id: 10, dept_name: 'Engineering' },
    { dept_id: 20, dept_name: 'Sales' },
    { dept_id: 30, dept_name: 'Marketing' }
  ];
  
  const leftSchema: DataSchema = {
    columns: [
      { name: 'id', type: 'number' },
      { name: 'name', type: 'string' },
      { name: 'dept_id', type: 'number', nullable: true }
    ]
  };
  
  const rightSchema: DataSchema = {
    columns: [
      { name: 'dept_id', type: 'number' },
      { name: 'dept_name', type: 'string' }
    ]
  };
  
  describe('Inner Join', () => {
    it('should return only matching rows', () => {
      const config: JoinConfig = {
        joinType: JoinType.INNER,
        keys: [{ leftKey: 'dept_id', rightKey: 'dept_id' }],
        outputColumns: [
          { sourceColumn: 'left.id', outputName: 'id' },
          { sourceColumn: 'left.name', outputName: 'name' },
          { sourceColumn: 'left.dept_id', outputName: 'dept_id' },
          { sourceColumn: 'right.dept_name', outputName: 'dept_name' }
        ]
      };
      
      const result = executeJoin(leftData, rightData, leftSchema, rightSchema, config);
      
      expect(result.error).toBeUndefined();
      expect(result.sampleData).toHaveLength(3);
      expect(result.sampleData).toEqual([
        { id: 1, name: 'Alice', dept_id: 10, dept_name: 'Engineering' },
        { id: 2, name: 'Bob', dept_id: 20, dept_name: 'Sales' },
        { id: 3, name: 'Charlie', dept_id: 10, dept_name: 'Engineering' }
      ]);
    });
    
    it('should use default column prefixes when outputColumns not specified', () => {
      const config: JoinConfig = {
        joinType: JoinType.INNER,
        keys: [{ leftKey: 'dept_id', rightKey: 'dept_id' }],
        outputColumns: []
      };
      
      const result = executeJoin(leftData, rightData, leftSchema, rightSchema, config);
      
      expect(result.error).toBeUndefined();
      expect(result.sampleData[0]).toHaveProperty('left_id');
      expect(result.sampleData[0]).toHaveProperty('left_name');
      expect(result.sampleData[0]).toHaveProperty('right_dept_name');
    });
  });
  
  describe('Left Join', () => {
    it('should return all left rows with matching right rows', () => {
      const config: JoinConfig = {
        joinType: JoinType.LEFT,
        keys: [{ leftKey: 'dept_id', rightKey: 'dept_id' }],
        outputColumns: [
          { sourceColumn: 'left.id', outputName: 'id' },
          { sourceColumn: 'left.name', outputName: 'name' },
          { sourceColumn: 'right.dept_name', outputName: 'dept_name' }
        ]
      };
      
      const result = executeJoin(leftData, rightData, leftSchema, rightSchema, config);
      
      expect(result.error).toBeUndefined();
      expect(result.sampleData).toHaveLength(4);
      
      // Check that David (with null dept_id) appears with null dept_name
      const davidRow = result.sampleData.find(r => r.name === 'David');
      expect(davidRow).toBeDefined();
      expect(davidRow?.dept_name).toBeNull();
    });
  });
  
  describe('Right Join', () => {
    it('should return all right rows with matching left rows', () => {
      const config: JoinConfig = {
        joinType: JoinType.RIGHT,
        keys: [{ leftKey: 'dept_id', rightKey: 'dept_id' }],
        outputColumns: [
          { sourceColumn: 'left.name', outputName: 'name' },
          { sourceColumn: 'right.dept_id', outputName: 'dept_id' },
          { sourceColumn: 'right.dept_name', outputName: 'dept_name' }
        ]
      };
      
      const result = executeJoin(leftData, rightData, leftSchema, rightSchema, config);
      
      expect(result.error).toBeUndefined();
      expect(result.sampleData).toHaveLength(4); // 3 depts, but Engineering has 2 employees
      
      // Marketing should appear with null name
      const marketingRows = result.sampleData.filter(r => r.dept_name === 'Marketing');
      expect(marketingRows).toHaveLength(1);
      expect(marketingRows[0].name).toBeNull();
    });
  });
  
  describe('Full Outer Join', () => {
    it('should return all rows from both sides', () => {
      const config: JoinConfig = {
        joinType: JoinType.FULL,
        keys: [{ leftKey: 'dept_id', rightKey: 'dept_id' }],
        outputColumns: [
          { sourceColumn: 'left.id', outputName: 'id' },
          { sourceColumn: 'left.name', outputName: 'name' },
          { sourceColumn: 'right.dept_name', outputName: 'dept_name' }
        ]
      };
      
      const result = executeJoin(leftData, rightData, leftSchema, rightSchema, config);
      
      expect(result.error).toBeUndefined();
      expect(result.sampleData).toHaveLength(5); // 3 matches + 1 unmatched left + 1 unmatched right
      
      // Check for Marketing (unmatched right)
      const marketingRow = result.sampleData.find(r => r.dept_name === 'Marketing');
      expect(marketingRow).toBeDefined();
      expect(marketingRow?.name).toBeNull();
      
      // Check for David (unmatched left)
      const davidRow = result.sampleData.find(r => r.name === 'David');
      expect(davidRow).toBeDefined();
      expect(davidRow?.dept_name).toBeNull();
    });
  });
  
  describe('Cross Join', () => {
    it('should return Cartesian product', () => {
      const config: JoinConfig = {
        joinType: JoinType.CROSS,
        keys: [],
        outputColumns: [
          { sourceColumn: 'left.name', outputName: 'name' },
          { sourceColumn: 'right.dept_name', outputName: 'dept_name' }
        ]
      };
      
      const result = executeJoin(leftData, rightData, leftSchema, rightSchema, config);
      
      expect(result.error).toBeUndefined();
      expect(result.sampleData).toHaveLength(12); // 4 * 3 = 12
    });
  });
  
  describe('Null Equality', () => {
    it('should not match null values by default', () => {
      const config: JoinConfig = {
        joinType: JoinType.INNER,
        keys: [{ leftKey: 'dept_id', rightKey: 'dept_id' }],
        outputColumns: [
          { sourceColumn: 'left.name', outputName: 'name' }
        ],
        options: {
          nullEquality: false
        }
      };
      
      const result = executeJoin(leftData, rightData, leftSchema, rightSchema, config);
      
      expect(result.error).toBeUndefined();
      // David has null dept_id, so should not match
      expect(result.sampleData.find(r => r.name === 'David')).toBeUndefined();
    });
    
    it('should match null values when nullEquality is true', () => {
      const leftWithNulls = [
        { id: 1, category: null },
        { id: 2, category: 'A' }
      ];
      
      const rightWithNulls = [
        { category: null, description: 'Unknown' },
        { category: 'A', description: 'Category A' }
      ];
      
      const config: JoinConfig = {
        joinType: JoinType.INNER,
        keys: [{ leftKey: 'category', rightKey: 'category' }],
        outputColumns: [
          { sourceColumn: 'left.id', outputName: 'id' },
          { sourceColumn: 'right.description', outputName: 'description' }
        ],
        options: {
          nullEquality: true
        }
      };
      
      const nullSchema: DataSchema = {
        columns: [
          { name: 'id', type: 'number' },
          { name: 'category', type: 'string', nullable: true }
        ]
      };
      
      const nullSchema2: DataSchema = {
        columns: [
          { name: 'category', type: 'string', nullable: true },
          { name: 'description', type: 'string' }
        ]
      };
      
      const result = executeJoin(leftWithNulls, rightWithNulls, nullSchema, nullSchema2, config);
      
      expect(result.error).toBeUndefined();
      expect(result.sampleData).toHaveLength(2);
      expect(result.sampleData.find(r => r.id === 1 && r.description === 'Unknown')).toBeDefined();
    });
  });
  
  describe('Deduplication', () => {
    it('should remove duplicate rows when dedupe is true', () => {
      const leftDupes = [
        { id: 1, value: 'A' },
        { id: 1, value: 'A' }
      ];
      
      const rightDupes = [
        { id: 1, extra: 'X' }
      ];
      
      const config: JoinConfig = {
        joinType: JoinType.INNER,
        keys: [{ leftKey: 'id', rightKey: 'id' }],
        outputColumns: [
          { sourceColumn: 'left.id', outputName: 'id' },
          { sourceColumn: 'left.value', outputName: 'value' },
          { sourceColumn: 'right.extra', outputName: 'extra' }
        ],
        options: {
          dedupe: true
        }
      };
      
      const dupeSchema: DataSchema = {
        columns: [
          { name: 'id', type: 'number' },
          { name: 'value', type: 'string' }
        ]
      };
      
      const dupeSchema2: DataSchema = {
        columns: [
          { name: 'id', type: 'number' },
          { name: 'extra', type: 'string' }
        ]
      };
      
      const result = executeJoin(leftDupes, rightDupes, dupeSchema, dupeSchema2, config);
      
      expect(result.error).toBeUndefined();
      expect(result.sampleData).toHaveLength(1);
    });
  });
  
  describe('Schema Validation', () => {
    it('should return error when join keys do not exist', () => {
      const config: JoinConfig = {
        joinType: JoinType.INNER,
        keys: [{ leftKey: 'nonexistent', rightKey: 'dept_id' }],
        outputColumns: []
      };
      
      const result = executeJoin(leftData, rightData, leftSchema, rightSchema, config);
      
      expect(result.error).toBeDefined();
      expect(result.error).toContain('nonexistent');
    });
  });
  
  describe('Output Schema', () => {
    it('should compute correct output schema', () => {
      const config: JoinConfig = {
        joinType: JoinType.LEFT,
        keys: [{ leftKey: 'dept_id', rightKey: 'dept_id' }],
        outputColumns: [
          { sourceColumn: 'left.id', outputName: 'employee_id' },
          { sourceColumn: 'right.dept_name', outputName: 'department' }
        ]
      };
      
      const result = executeJoin(leftData, rightData, leftSchema, rightSchema, config);
      
      expect(result.schema.columns).toHaveLength(2);
      expect(result.schema.columns[0].name).toBe('employee_id');
      expect(result.schema.columns[0].type).toBe('number');
      expect(result.schema.columns[1].name).toBe('department');
      expect(result.schema.columns[1].nullable).toBe(true); // Right side is nullable in left join
    });
  });
});
