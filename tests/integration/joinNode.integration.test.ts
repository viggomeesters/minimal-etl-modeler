import { ETLEngine } from '../../src/executor/engine';
import { Pipeline, BlockType, JoinType, Block, Connection } from '../../src/models/block';
import { inferSchema } from '../../src/models/schemaHelpers';

describe('Join Node Integration Tests', () => {
  let engine: ETLEngine;
  
  beforeEach(() => {
    engine = new ETLEngine();
  });
  
  describe('Two-Source Join Pipeline', () => {
    it('should execute a complete join pipeline', async () => {
      // Sample data
      const customersData = [
        { customer_id: 1, name: 'Alice', country: 'USA' },
        { customer_id: 2, name: 'Bob', country: 'UK' },
        { customer_id: 3, name: 'Charlie', country: 'Canada' }
      ];
      
      const ordersData = [
        { order_id: 101, customer_id: 1, amount: 100 },
        { order_id: 102, customer_id: 1, amount: 200 },
        { order_id: 103, customer_id: 2, amount: 150 }
      ];
      
      const customersSchema = inferSchema(customersData);
      const ordersSchema = inferSchema(ordersData);
      
      // Create pipeline
      const pipeline: Pipeline = {
        id: 'test-pipeline-1',
        name: 'Customer Orders Join',
        blocks: [
          {
            id: 'source-customers',
            type: BlockType.SOURCE,
            name: 'Customers',
            inputs: [],
            outputs: [{ id: 'out-1', name: 'output', schema: customersSchema }],
            config: {
              type: 'csv',
              connection: {},
              schema: customersSchema
            }
          },
          {
            id: 'source-orders',
            type: BlockType.SOURCE,
            name: 'Orders',
            inputs: [],
            outputs: [{ id: 'out-2', name: 'output', schema: ordersSchema }],
            config: {
              type: 'csv',
              connection: {},
              schema: ordersSchema
            }
          },
          {
            id: 'join-1',
            type: BlockType.JOIN,
            name: 'Join Customers and Orders',
            inputs: [
              { id: 'in-left', name: 'left', schema: customersSchema },
              { id: 'in-right', name: 'right', schema: ordersSchema }
            ],
            outputs: [{ id: 'out-3', name: 'output' }],
            config: {
              joinType: JoinType.INNER,
              keys: [{ leftKey: 'customer_id', rightKey: 'customer_id' }],
              outputColumns: [
                { sourceColumn: 'left.customer_id', outputName: 'customer_id' },
                { sourceColumn: 'left.name', outputName: 'customer_name' },
                { sourceColumn: 'left.country', outputName: 'country' },
                { sourceColumn: 'right.order_id', outputName: 'order_id' },
                { sourceColumn: 'right.amount', outputName: 'amount' }
              ]
            }
          }
        ],
        connections: [
          {
            id: 'conn-1',
            sourceBlockId: 'source-customers',
            sourcePortId: 'out-1',
            targetBlockId: 'join-1',
            targetPortId: 'in-left'
          },
          {
            id: 'conn-2',
            sourceBlockId: 'source-orders',
            sourcePortId: 'out-2',
            targetBlockId: 'join-1',
            targetPortId: 'in-right'
          }
        ]
      };
      
      // Mock source block execution by pre-populating results
      // In real implementation, sources would load data
      engine['executionResults'].set('source-customers', {
        blockId: 'source-customers',
        schema: customersSchema,
        sampleData: customersData,
        rowCount: customersData.length
      });
      
      engine['executionResults'].set('source-orders', {
        blockId: 'source-orders',
        schema: ordersSchema,
        sampleData: ordersData,
        rowCount: ordersData.length
      });
      
      // Execute pipeline
      const results = await engine.executePipeline(pipeline, true);
      
      // Verify join result
      const joinResult = results.get('join-1');
      expect(joinResult).toBeDefined();
      expect(joinResult?.error).toBeUndefined();
      expect(joinResult?.sampleData).toHaveLength(3); // 3 orders
      
      // Verify output schema
      expect(joinResult?.schema.columns).toHaveLength(5);
      expect(joinResult?.schema.columns.map(c => c.name)).toEqual([
        'customer_id',
        'customer_name',
        'country',
        'order_id',
        'amount'
      ]);
      
      // Verify data correctness
      const firstRow = joinResult?.sampleData[0];
      expect(firstRow).toMatchObject({
        customer_id: 1,
        customer_name: 'Alice',
        country: 'USA',
        order_id: 101,
        amount: 100
      });
    });
    
    it('should handle left join with unmatched rows', async () => {
      const employeesData = [
        { emp_id: 1, name: 'Alice', dept_id: 10 },
        { emp_id: 2, name: 'Bob', dept_id: 20 },
        { emp_id: 3, name: 'Charlie', dept_id: 99 } // No matching department
      ];
      
      const departmentsData = [
        { dept_id: 10, dept_name: 'Engineering' },
        { dept_id: 20, dept_name: 'Sales' }
      ];
      
      const employeesSchema = inferSchema(employeesData);
      const departmentsSchema = inferSchema(departmentsData);
      
      const pipeline: Pipeline = {
        id: 'test-pipeline-2',
        name: 'Employee Department Left Join',
        blocks: [
          {
            id: 'source-emp',
            type: BlockType.SOURCE,
            name: 'Employees',
            inputs: [],
            outputs: [{ id: 'out-1', name: 'output', schema: employeesSchema }],
            config: { type: 'csv', connection: {}, schema: employeesSchema }
          },
          {
            id: 'source-dept',
            type: BlockType.SOURCE,
            name: 'Departments',
            inputs: [],
            outputs: [{ id: 'out-2', name: 'output', schema: departmentsSchema }],
            config: { type: 'csv', connection: {}, schema: departmentsSchema }
          },
          {
            id: 'join-left',
            type: BlockType.JOIN,
            name: 'Left Join',
            inputs: [
              { id: 'in-left', name: 'left', schema: employeesSchema },
              { id: 'in-right', name: 'right', schema: departmentsSchema }
            ],
            outputs: [{ id: 'out-3', name: 'output' }],
            config: {
              joinType: JoinType.LEFT,
              keys: [{ leftKey: 'dept_id', rightKey: 'dept_id' }],
              outputColumns: [
                { sourceColumn: 'left.emp_id', outputName: 'emp_id' },
                { sourceColumn: 'left.name', outputName: 'emp_name' },
                { sourceColumn: 'right.dept_name', outputName: 'dept_name' }
              ]
            }
          }
        ],
        connections: [
          {
            id: 'conn-1',
            sourceBlockId: 'source-emp',
            sourcePortId: 'out-1',
            targetBlockId: 'join-left',
            targetPortId: 'in-left'
          },
          {
            id: 'conn-2',
            sourceBlockId: 'source-dept',
            sourcePortId: 'out-2',
            targetBlockId: 'join-left',
            targetPortId: 'in-right'
          }
        ]
      };
      
      // Pre-populate source results
      engine['executionResults'].set('source-emp', {
        blockId: 'source-emp',
        schema: employeesSchema,
        sampleData: employeesData,
        rowCount: employeesData.length
      });
      
      engine['executionResults'].set('source-dept', {
        blockId: 'source-dept',
        schema: departmentsSchema,
        sampleData: departmentsData,
        rowCount: departmentsData.length
      });
      
      const results = await engine.executePipeline(pipeline, true);
      
      const joinResult = results.get('join-left');
      expect(joinResult?.error).toBeUndefined();
      expect(joinResult?.sampleData).toHaveLength(3); // All 3 employees
      
      // Charlie should have null dept_name
      const charlieRow = joinResult?.sampleData.find(r => r.emp_name === 'Charlie');
      expect(charlieRow).toBeDefined();
      expect(charlieRow?.dept_name).toBeNull();
    });
    
    it('should handle cross join', async () => {
      const colorsData = [
        { color: 'Red' },
        { color: 'Blue' }
      ];
      
      const sizesData = [
        { size: 'S' },
        { size: 'M' },
        { size: 'L' }
      ];
      
      const colorsSchema = inferSchema(colorsData);
      const sizesSchema = inferSchema(sizesData);
      
      const pipeline: Pipeline = {
        id: 'test-pipeline-3',
        name: 'Color Size Cross Join',
        blocks: [
          {
            id: 'source-colors',
            type: BlockType.SOURCE,
            name: 'Colors',
            inputs: [],
            outputs: [{ id: 'out-1', name: 'output', schema: colorsSchema }],
            config: { type: 'csv', connection: {}, schema: colorsSchema }
          },
          {
            id: 'source-sizes',
            type: BlockType.SOURCE,
            name: 'Sizes',
            inputs: [],
            outputs: [{ id: 'out-2', name: 'output', schema: sizesSchema }],
            config: { type: 'csv', connection: {}, schema: sizesSchema }
          },
          {
            id: 'join-cross',
            type: BlockType.JOIN,
            name: 'Cross Join',
            inputs: [
              { id: 'in-left', name: 'left', schema: colorsSchema },
              { id: 'in-right', name: 'right', schema: sizesSchema }
            ],
            outputs: [{ id: 'out-3', name: 'output' }],
            config: {
              joinType: JoinType.CROSS,
              keys: [],
              outputColumns: [
                { sourceColumn: 'left.color', outputName: 'color' },
                { sourceColumn: 'right.size', outputName: 'size' }
              ]
            }
          }
        ],
        connections: [
          {
            id: 'conn-1',
            sourceBlockId: 'source-colors',
            sourcePortId: 'out-1',
            targetBlockId: 'join-cross',
            targetPortId: 'in-left'
          },
          {
            id: 'conn-2',
            sourceBlockId: 'source-sizes',
            sourcePortId: 'out-2',
            targetBlockId: 'join-cross',
            targetPortId: 'in-right'
          }
        ]
      };
      
      engine['executionResults'].set('source-colors', {
        blockId: 'source-colors',
        schema: colorsSchema,
        sampleData: colorsData,
        rowCount: colorsData.length
      });
      
      engine['executionResults'].set('source-sizes', {
        blockId: 'source-sizes',
        schema: sizesSchema,
        sampleData: sizesData,
        rowCount: sizesData.length
      });
      
      const results = await engine.executePipeline(pipeline, true);
      
      const joinResult = results.get('join-cross');
      expect(joinResult?.error).toBeUndefined();
      expect(joinResult?.sampleData).toHaveLength(6); // 2 * 3 = 6
      
      // Verify all combinations exist
      expect(joinResult?.sampleData).toContainEqual({ color: 'Red', size: 'S' });
      expect(joinResult?.sampleData).toContainEqual({ color: 'Red', size: 'M' });
      expect(joinResult?.sampleData).toContainEqual({ color: 'Red', size: 'L' });
      expect(joinResult?.sampleData).toContainEqual({ color: 'Blue', size: 'S' });
      expect(joinResult?.sampleData).toContainEqual({ color: 'Blue', size: 'M' });
      expect(joinResult?.sampleData).toContainEqual({ color: 'Blue', size: 'L' });
    });
  });
  
  describe('Error Handling', () => {
    it('should return error when join has wrong number of inputs', async () => {
      const pipeline: Pipeline = {
        id: 'test-pipeline-error',
        name: 'Error Pipeline',
        blocks: [
          {
            id: 'source-1',
            type: BlockType.SOURCE,
            name: 'Source',
            inputs: [],
            outputs: [{ id: 'out-1', name: 'output' }],
            config: { type: 'csv', connection: {} }
          },
          {
            id: 'join-1',
            type: BlockType.JOIN,
            name: 'Join',
            inputs: [{ id: 'in-1', name: 'input' }],
            outputs: [{ id: 'out-2', name: 'output' }],
            config: {
              joinType: JoinType.INNER,
              keys: [],
              outputColumns: []
            }
          }
        ],
        connections: [
          {
            id: 'conn-1',
            sourceBlockId: 'source-1',
            sourcePortId: 'out-1',
            targetBlockId: 'join-1',
            targetPortId: 'in-1'
          }
        ]
      };
      
      engine['executionResults'].set('source-1', {
        blockId: 'source-1',
        schema: { columns: [] },
        sampleData: [],
        rowCount: 0
      });
      
      const results = await engine.executePipeline(pipeline);
      
      const joinResult = results.get('join-1');
      expect(joinResult?.error).toBeDefined();
      expect(joinResult?.error).toContain('exactly 2 inputs');
    });
  });
});
