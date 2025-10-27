# ETL Block Model Design

## Overview

This document describes the new explicit block model for the minimal-etl-modeler. Unlike the previous single "transform" block approach, this model provides well-defined block types with specific configurations and multi-input/output support.

## Design Principles

1. **Explicit over Implicit**: Each block type has a clear, specific purpose
2. **Type Safety**: Strong TypeScript interfaces ensure correctness
3. **Composability**: Blocks can be connected in flexible pipelines
4. **Multi-input Support**: Blocks like Join can accept multiple data streams
5. **Schema Propagation**: Output schemas are computed from input schemas and block configuration

## Block Types

### 1. Source Block
**Purpose**: Load data from external sources

**Inputs**: None  
**Outputs**: 1 (data stream)

**Configuration**:
```typescript
{
  type: 'csv' | 'json' | 'database' | 'api',
  connection: {
    // Source-specific connection details
  },
  schema?: DataSchema  // Optional explicit schema
}
```

**Example**:
```json
{
  "type": "source",
  "config": {
    "type": "csv",
    "connection": {
      "path": "data/customers.csv"
    }
  }
}
```

### 2. Sink Block
**Purpose**: Write data to external destinations

**Inputs**: 1 (data stream)  
**Outputs**: None

**Configuration**:
```typescript
{
  type: 'csv' | 'json' | 'database' | 'api',
  destination: {
    // Destination-specific details
  }
}
```

### 3. Filter Block
**Purpose**: Filter rows based on conditions

**Inputs**: 1  
**Outputs**: 1

**Configuration**:
```typescript
{
  condition: string  // Expression like "age > 18 AND status = 'active'"
}
```

**Example**:
```json
{
  "type": "filter",
  "config": {
    "condition": "quantity > 0 AND price < 1000"
  }
}
```

### 4. Map Block
**Purpose**: Map columns from input to output with optional transformations

**Inputs**: 1  
**Outputs**: 1

**Configuration**:
```typescript
{
  mappings: Array<{
    sourceColumn: string,
    targetColumn: string,
    transform?: string  // Optional expression
  }>
}
```

### 5. Derive Block
**Purpose**: Add new computed columns

**Inputs**: 1  
**Outputs**: 1

**Configuration**:
```typescript
{
  derivedColumns: Array<{
    name: string,
    expression: string
  }>
}
```

**Example**:
```json
{
  "type": "derive",
  "config": {
    "derivedColumns": [
      {
        "name": "total_price",
        "expression": "quantity * price"
      },
      {
        "name": "discount_price",
        "expression": "total_price * 0.9"
      }
    ]
  }
}
```

### 6. Aggregate Block
**Purpose**: Group and aggregate data

**Inputs**: 1  
**Outputs**: 1

**Configuration**:
```typescript
{
  groupBy: string[],
  aggregations: Array<{
    column: string,
    function: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'first' | 'last',
    outputName: string
  }>
}
```

**Example**:
```json
{
  "type": "aggregate",
  "config": {
    "groupBy": ["customer_id", "product_category"],
    "aggregations": [
      {
        "column": "quantity",
        "function": "sum",
        "outputName": "total_quantity"
      },
      {
        "column": "price",
        "function": "avg",
        "outputName": "avg_price"
      }
    ]
  }
}
```

### 7. Join Block ⭐
**Purpose**: Combine two data streams based on join keys

**Inputs**: 2 (left and right)  
**Outputs**: 1

**Configuration**:
```typescript
{
  joinType: 'inner' | 'left' | 'right' | 'full' | 'cross',
  keys: Array<{
    leftKey: string,
    rightKey: string
  }>,
  predicate?: string,  // Optional additional condition
  outputColumns: Array<{
    sourceColumn: string,  // Format: "left.columnName" or "right.columnName"
    outputName: string
  }>,
  options?: {
    broadcast?: 'left' | 'right' | 'none',
    nullEquality?: boolean,
    dedupe?: boolean
  }
}
```

**Visual Representation**:
```
┌─────────────┐
│   Left      │
│   Input     │──┐
└─────────────┘  │
                 │  ┌─────────────┐
                 ├─►│    Join     │──► Output
                 │  └─────────────┘
┌─────────────┐  │
│   Right     │──┘
│   Input     │
└─────────────┘
```

**Join Types**:
- **Inner**: Only matching rows from both sides
- **Left**: All rows from left, matching rows from right (nulls if no match)
- **Right**: All rows from right, matching rows from left (nulls if no match)
- **Full**: All rows from both sides
- **Cross**: Cartesian product (all combinations)

**Example**: See `design/blocks/join-example.json`

### 8. Union Block
**Purpose**: Combine multiple data streams vertically

**Inputs**: 2+  
**Outputs**: 1

**Configuration**:
```typescript
{
  deduplication?: boolean,
  columnMapping?: 'byName' | 'byPosition'
}
```

### 9. Split Block
**Purpose**: Split one data stream into multiple based on conditions

**Inputs**: 1  
**Outputs**: 2+

**Configuration**:
```typescript
{
  conditions: Array<{
    name: string,
    expression: string
  }>
}
```

### 10. Lookup Block
**Purpose**: Enrich data with lookup table

**Inputs**: 2 (main data + lookup table)  
**Outputs**: 1

**Configuration**:
```typescript
{
  lookupKeys: Array<{
    leftKey: string,
    rightKey: string
  }>,
  lookupColumns: string[]
}
```

### 11. SQL Block
**Purpose**: Execute custom SQL query

**Inputs**: 1+  
**Outputs**: 1

**Configuration**:
```typescript
{
  query: string,
  dialect?: 'standard' | 'postgres' | 'mysql' | 'sqlite'
}
```

### 12. UDF Block
**Purpose**: Execute custom user-defined function

**Inputs**: 1  
**Outputs**: 1

**Configuration**:
```typescript
{
  functionName: string,
  code: string,
  language: 'javascript' | 'python'
}
```

## Schema Propagation

Each block computes its output schema based on:
1. Input schema(s)
2. Block configuration
3. Block-specific rules

Example for Join block:
- Input: Two schemas (left and right)
- Configuration: Join keys, output columns
- Output: Merged schema with configured columns, nullable adjusted based on join type

## Data Flow

```
Source Block
    │
    │ (schema: {id, name, age})
    ▼
Filter Block (age > 18)
    │
    │ (schema: {id, name, age})
    ▼
Map Block (rename age → years)
    │
    │ (schema: {id, name, years})
    ▼
Sink Block
```

## Multi-input Example

```
Source Block (customers)          Source Block (orders)
    │                                   │
    │ {customer_id, name}              │ {order_id, customer_id, amount}
    └────────────┬──────────────────────┘
                 │
                 ▼
            Join Block (inner join on customer_id)
                 │
                 │ {customer_id, name, order_id, amount}
                 ▼
            Aggregate Block (group by customer_id)
                 │
                 │ {customer_id, name, total_amount, order_count}
                 ▼
            Sink Block
```

## Execution Model

The ETL engine executes blocks in topological order:
1. Build dependency graph from connections
2. Perform topological sort
3. Execute blocks in order
4. Pass execution results through connections
5. Propagate schemas and sample data

## Implementation Notes

- All blocks use TypeScript interfaces for type safety
- Schema inference is automatic for source blocks
- Schema validation happens before execution
- Sample data (first N rows) flows through for preview
- Full execution would process complete datasets
