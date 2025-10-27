import { DataSchema, ColumnSchema, JoinConfig, JoinType, OutputColumnConfig } from './block';

/**
 * Infer column type from sample values
 */
export function inferColumnType(values: any[]): ColumnSchema['type'] {
  if (values.length === 0) return 'unknown';
  
  const nonNullValues = values.filter(v => v !== null && v !== undefined);
  if (nonNullValues.length === 0) return 'null';
  
  const sample = nonNullValues[0];
  
  if (typeof sample === 'number') return 'number';
  if (typeof sample === 'boolean') return 'boolean';
  if (sample instanceof Date) return 'date';
  if (typeof sample === 'string') {
    // Check if it's a date string
    const dateVal = new Date(sample);
    if (!isNaN(dateVal.getTime()) && sample.match(/^\d{4}-\d{2}-\d{2}/)) {
      return 'date';
    }
    return 'string';
  }
  
  return 'unknown';
}

/**
 * Infer schema from sample data
 */
export function inferSchema(data: Record<string, any>[]): DataSchema {
  if (data.length === 0) {
    return { columns: [] };
  }
  
  const firstRow = data[0];
  const columns: ColumnSchema[] = [];
  
  for (const [key, value] of Object.entries(firstRow)) {
    const allValues = data.map(row => row[key]);
    const type = inferColumnType(allValues);
    const hasNull = allValues.some(v => v === null || v === undefined);
    
    columns.push({
      name: key,
      type,
      nullable: hasNull
    });
  }
  
  return { columns };
}

/**
 * Validate that join keys exist in schemas
 */
export function validateJoinKeys(
  leftSchema: DataSchema,
  rightSchema: DataSchema,
  config: JoinConfig
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  const leftColumns = new Set(leftSchema.columns.map(c => c.name));
  const rightColumns = new Set(rightSchema.columns.map(c => c.name));
  
  for (const keyMapping of config.keys) {
    if (!leftColumns.has(keyMapping.leftKey)) {
      errors.push(`Left key '${keyMapping.leftKey}' not found in left schema`);
    }
    if (!rightColumns.has(keyMapping.rightKey)) {
      errors.push(`Right key '${keyMapping.rightKey}' not found in right schema`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Compute output schema for a join operation
 */
export function computeJoinOutputSchema(
  leftSchema: DataSchema,
  rightSchema: DataSchema,
  config: JoinConfig
): DataSchema {
  const outputColumns: ColumnSchema[] = [];
  
  // If output columns are explicitly configured, use those
  if (config.outputColumns && config.outputColumns.length > 0) {
    for (const outCol of config.outputColumns) {
      const [side, colName] = parseSourceColumn(outCol.sourceColumn);
      const sourceSchema = side === 'left' ? leftSchema : rightSchema;
      const sourceCol = sourceSchema.columns.find(c => c.name === colName);
      
      if (sourceCol) {
        outputColumns.push({
          name: outCol.outputName,
          type: sourceCol.type,
          nullable: shouldBeNullable(config.joinType, side, sourceCol.nullable)
        });
      }
    }
  } else {
    // Default: include all columns from both sides with prefixes
    for (const col of leftSchema.columns) {
      outputColumns.push({
        name: `left_${col.name}`,
        type: col.type,
        nullable: shouldBeNullable(config.joinType, 'left', col.nullable)
      });
    }
    
    for (const col of rightSchema.columns) {
      outputColumns.push({
        name: `right_${col.name}`,
        type: col.type,
        nullable: shouldBeNullable(config.joinType, 'right', col.nullable)
      });
    }
  }
  
  return { columns: outputColumns };
}

/**
 * Parse source column reference (e.g., "left.columnName" -> ["left", "columnName"])
 */
function parseSourceColumn(sourceColumn: string): ['left' | 'right', string] {
  const parts = sourceColumn.split('.');
  if (parts.length === 2 && (parts[0] === 'left' || parts[0] === 'right')) {
    return [parts[0] as 'left' | 'right', parts[1]];
  }
  // Default to left if no prefix
  return ['left', sourceColumn];
}

/**
 * Determine if a column should be nullable based on join type
 */
function shouldBeNullable(
  joinType: JoinType,
  side: 'left' | 'right',
  originallyNullable?: boolean
): boolean {
  const wasNullable = originallyNullable ?? false;
  
  switch (joinType) {
    case JoinType.INNER:
      return wasNullable;
    case JoinType.LEFT:
      return side === 'right' ? true : wasNullable;
    case JoinType.RIGHT:
      return side === 'left' ? true : wasNullable;
    case JoinType.FULL:
      return true;
    case JoinType.CROSS:
      return wasNullable;
    default:
      return wasNullable;
  }
}

/**
 * Merge two schemas (for union operations)
 */
export function mergeSchemas(schema1: DataSchema, schema2: DataSchema): DataSchema {
  const columnMap = new Map<string, ColumnSchema>();
  
  // Add all columns from first schema
  for (const col of schema1.columns) {
    columnMap.set(col.name, { ...col });
  }
  
  // Merge with second schema
  for (const col of schema2.columns) {
    if (columnMap.has(col.name)) {
      const existing = columnMap.get(col.name)!;
      // If types differ, use 'unknown'
      if (existing.type !== col.type) {
        existing.type = 'unknown';
      }
      // If either is nullable, result is nullable
      existing.nullable = existing.nullable || col.nullable;
    } else {
      columnMap.set(col.name, { ...col, nullable: true });
    }
  }
  
  return { columns: Array.from(columnMap.values()) };
}

/**
 * Get column from schema by name
 */
export function getColumn(schema: DataSchema, columnName: string): ColumnSchema | undefined {
  return schema.columns.find(c => c.name === columnName);
}

/**
 * Check if schemas are compatible (same column names and types)
 */
export function schemasCompatible(schema1: DataSchema, schema2: DataSchema): boolean {
  if (schema1.columns.length !== schema2.columns.length) return false;
  
  const cols1 = new Map(schema1.columns.map(c => [c.name, c.type]));
  
  for (const col of schema2.columns) {
    if (!cols1.has(col.name) || cols1.get(col.name) !== col.type) {
      return false;
    }
  }
  
  return true;
}
