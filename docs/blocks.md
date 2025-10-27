# ETL Block System Documentation

## Overview

This document describes how to use the new explicit block type system in the minimal-etl-modeler, focusing on the Join block implementation.

## Block Types

The new block model supports the following block types:

- **Source**: Load data from external sources (CSV, JSON, database, API)
- **Sink**: Write data to destinations
- **Filter**: Filter rows based on conditions
- **Map**: Map and transform columns
- **Derive**: Add computed columns
- **Aggregate**: Group and aggregate data
- **Join**: Combine two data streams ⭐
- **Union**: Combine multiple streams vertically
- **Split**: Split one stream into multiple based on conditions
- **Lookup**: Enrich data with lookup tables
- **SQL**: Execute custom SQL queries
- **UDF**: Execute user-defined functions

## Using the Join Block

### Overview

The Join block combines two data streams based on matching keys. It supports all standard SQL join types:

- **Inner Join**: Only rows that match on both sides
- **Left Join**: All left rows + matching right rows (nulls for non-matches)
- **Right Join**: All right rows + matching left rows (nulls for non-matches)
- **Full Outer Join**: All rows from both sides
- **Cross Join**: Cartesian product (all combinations)

### Configuration

A Join block requires the following configuration:

```typescript
{
  joinType: 'inner' | 'left' | 'right' | 'full' | 'cross',
  keys: [
    {
      leftKey: 'column_name_from_left',
      rightKey: 'column_name_from_right'
    }
    // ... more key pairs for multi-key joins
  ],
  outputColumns: [
    {
      sourceColumn: 'left.column_name',  // or 'right.column_name'
      outputName: 'output_column_name'
    }
    // ... one entry per output column
  ],
  options: {
    broadcast: 'left' | 'right' | 'none',  // Optimization hint
    nullEquality: false,  // Whether NULL == NULL
    dedupe: false  // Remove duplicate rows
  }
}
```

### UI Usage

1. **Drag and Drop**: Drag the Join block from the toolbox onto the canvas
2. **Connect Inputs**: Connect two data sources to the left and right input ports
3. **Configure**: Double-click the Join block to open the configuration modal
4. **Set Join Type**: Select the desired join type (inner, left, right, full, cross)
5. **Map Keys**: Use the key mapper to specify which columns to join on
   - Click "Add Key" to add a join key pair
   - Select the left and right columns to match
   - Remove keys with the ✕ button
6. **Configure Output**: (Optional) Specify which columns to include in the output
   - By default, all columns from both sides are included with `left_` and `right_` prefixes
   - Click "Add Column" to customize output columns
   - Select source column (e.g., `left.customer_id`) and specify output name
7. **Set Options**: Configure advanced options
   - **Broadcast**: Hint for optimization (useful for small lookup tables)
   - **NULL = NULL**: Whether to treat NULL values as equal (default: false)
   - **Deduplicate**: Remove duplicate rows from output
8. **Preview**: Click "Generate Preview" to see sample join results
9. **Save**: Click "Save" to apply the configuration

### Code Example

```typescript
import { JoinNode } from './src/ui/nodes/JoinNode';
import { JoinType } from './src/models/block';

// Example join configuration
const joinConfig = {
  joinType: JoinType.LEFT,
  keys: [
    { leftKey: 'customer_id', rightKey: 'customer_id' }
  ],
  outputColumns: [
    { sourceColumn: 'left.customer_id', outputName: 'customer_id' },
    { sourceColumn: 'left.customer_name', outputName: 'name' },
    { sourceColumn: 'right.order_id', outputName: 'order_id' },
    { sourceColumn: 'right.amount', outputName: 'amount' }
  ],
  options: {
    broadcast: 'right',
    nullEquality: false,
    dedupe: false
  }
};

// Use in React component
<JoinNode
  id="join-1"
  config={joinConfig}
  leftSchema={customersSchema}
  rightSchema={ordersSchema}
  onChange={(newConfig) => handleConfigChange(newConfig)}
  position={{ x: 400, y: 300 }}
/>
```

### Programmatic Execution

```typescript
import { executeJoin } from './src/executor/joinExecutor';
import { JoinType } from './src/models/block';

// Sample data
const customers = [
  { customer_id: 1, name: 'Alice' },
  { customer_id: 2, name: 'Bob' }
];

const orders = [
  { order_id: 101, customer_id: 1, amount: 100 },
  { order_id: 102, customer_id: 2, amount: 200 }
];

// Execute join
const result = executeJoin(
  customers,
  orders,
  customersSchema,
  ordersSchema,
  {
    joinType: JoinType.INNER,
    keys: [{ leftKey: 'customer_id', rightKey: 'customer_id' }],
    outputColumns: []  // Use defaults
  }
);

console.log(result.sampleData);
// [
//   { left_customer_id: 1, left_name: 'Alice', right_order_id: 101, ... },
//   { left_customer_id: 2, left_name: 'Bob', right_order_id: 102, ... }
// ]
```

## Schema Propagation

The Join block automatically computes its output schema based on:

1. **Input schemas**: Column names and types from both inputs
2. **Join type**: Affects nullability of columns
3. **Output column configuration**: Determines which columns appear in output

### Nullability Rules

- **Inner Join**: Original nullability preserved
- **Left Join**: Right-side columns become nullable
- **Right Join**: Left-side columns become nullable
- **Full Join**: All columns become nullable
- **Cross Join**: Original nullability preserved

## Testing

### Unit Tests

Run join executor unit tests:

```bash
npm test -- tests/executor/joinExecutor.test.ts
```

This tests:
- All join types (inner, left, right, full, cross)
- Null equality behavior
- Deduplication
- Schema validation
- Output schema computation

### Integration Tests

Run integration tests:

```bash
npm test -- tests/integration/joinNode.integration.test.ts
```

This tests:
- Complete pipeline execution with join blocks
- Multi-input data flow
- Error handling

## Example Pipeline

See `examples/join-pipeline.json` for a complete example pipeline that:

1. Loads customers from CSV
2. Loads orders from CSV
3. Joins them on customer_id (left join)
4. Filters for completed orders
5. Exports to CSV

## Performance Considerations

The current implementation is optimized for:

- **Small to medium datasets**: Up to ~100,000 rows
- **In-memory joins**: All data loaded into memory
- **Sample data preview**: First N rows for UI preview

For large datasets, consider:

- Using the `broadcast` option to hint which side is smaller
- Filtering data before joining
- Using database-backed joins for very large datasets

## Troubleshooting

### Join returns no rows

- Check that join keys exist in both schemas
- Verify join keys have matching values
- For NULL keys, enable `nullEquality` option

### Wrong number of output rows

- Verify join type is correct
- Check for duplicate keys (consider `dedupe` option)
- For cross joins, result is |left| × |right| rows

### Schema validation errors

- Ensure join keys exist in respective schemas
- Check column names match exactly (case-sensitive)
- Verify output column source references are correct

## API Reference

### JoinExecutor

```typescript
class JoinExecutor {
  execute(
    leftData: Record<string, any>[],
    rightData: Record<string, any>[],
    leftSchema: DataSchema,
    rightSchema: DataSchema,
    config: JoinConfig
  ): ExecutionResult
}
```

### Helper Functions

```typescript
// Validate join keys exist in schemas
validateJoinKeys(
  leftSchema: DataSchema,
  rightSchema: DataSchema,
  config: JoinConfig
): { valid: boolean; errors: string[] }

// Compute output schema
computeJoinOutputSchema(
  leftSchema: DataSchema,
  rightSchema: DataSchema,
  config: JoinConfig
): DataSchema
```

## Future Enhancements

Planned improvements:

- [ ] Expression-based join predicates (not just equality)
- [ ] Multi-column key UI shortcuts
- [ ] Automatic key suggestion based on column names
- [ ] Join performance metrics
- [ ] Streaming joins for large datasets
- [ ] Visual join result preview with highlighting
