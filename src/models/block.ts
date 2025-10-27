/**
 * Block Types for ETL operations
 */
export enum BlockType {
  SOURCE = 'source',
  SINK = 'sink',
  FILTER = 'filter',
  MAP = 'map',
  DERIVE = 'derive',
  AGGREGATE = 'aggregate',
  JOIN = 'join',
  UNION = 'union',
  SPLIT = 'split',
  LOOKUP = 'lookup',
  SQL = 'sql',
  UDF = 'udf'
}

/**
 * Join types supported
 */
export enum JoinType {
  INNER = 'inner',
  LEFT = 'left',
  RIGHT = 'right',
  FULL = 'full',
  CROSS = 'cross'
}

/**
 * Column metadata
 */
export interface ColumnSchema {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'null' | 'unknown';
  nullable?: boolean;
}

/**
 * Schema for a data stream
 */
export interface DataSchema {
  columns: ColumnSchema[];
}

/**
 * Input/Output port definition
 */
export interface Port {
  id: string;
  name: string;
  schema?: DataSchema;
}

/**
 * Join key mapping
 */
export interface JoinKeyMapping {
  leftKey: string;
  rightKey: string;
}

/**
 * Output column configuration for join
 */
export interface OutputColumnConfig {
  sourceColumn: string;  // Format: "left.columnName" or "right.columnName"
  outputName: string;
  rename?: string;
}

/**
 * Join block configuration
 */
export interface JoinConfig {
  joinType: JoinType;
  keys: JoinKeyMapping[];
  predicate?: string;  // Optional SQL-like expression for additional join conditions
  outputColumns: OutputColumnConfig[];
  options?: {
    broadcast?: 'left' | 'right' | 'none';  // Hint for optimization
    nullEquality?: boolean;  // Whether NULL == NULL (default: false)
    dedupe?: boolean;  // Remove duplicate rows from output
  };
}

/**
 * Filter block configuration
 */
export interface FilterConfig {
  condition: string;  // Expression to filter rows
}

/**
 * Map block configuration
 */
export interface MapConfig {
  mappings: Array<{
    sourceColumn: string;
    targetColumn: string;
    transform?: string;  // Optional transformation expression
  }>;
}

/**
 * Derive block configuration
 */
export interface DeriveConfig {
  derivedColumns: Array<{
    name: string;
    expression: string;
  }>;
}

/**
 * Aggregate block configuration
 */
export interface AggregateConfig {
  groupBy: string[];
  aggregations: Array<{
    column: string;
    function: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'first' | 'last';
    outputName: string;
  }>;
}

/**
 * Source block configuration
 */
export interface SourceConfig {
  type: 'csv' | 'json' | 'database' | 'api';
  connection: Record<string, any>;
  schema?: DataSchema;
}

/**
 * Sink block configuration
 */
export interface SinkConfig {
  type: 'csv' | 'json' | 'database' | 'api';
  destination: Record<string, any>;
}

/**
 * Union block configuration
 */
export interface UnionConfig {
  deduplication?: boolean;
  columnMapping?: 'byName' | 'byPosition';
}

/**
 * Split block configuration
 */
export interface SplitConfig {
  conditions: Array<{
    name: string;
    expression: string;
  }>;
}

/**
 * Lookup block configuration
 */
export interface LookupConfig {
  lookupKeys: JoinKeyMapping[];
  lookupColumns: string[];
}

/**
 * SQL block configuration
 */
export interface SqlConfig {
  query: string;
  dialect?: 'standard' | 'postgres' | 'mysql' | 'sqlite';
}

/**
 * UDF (User-Defined Function) block configuration
 */
export interface UdfConfig {
  functionName: string;
  code: string;
  language: 'javascript' | 'python';
}

/**
 * Union type for all block configurations
 */
export type BlockConfig = 
  | JoinConfig 
  | FilterConfig 
  | MapConfig 
  | DeriveConfig 
  | AggregateConfig 
  | SourceConfig 
  | SinkConfig
  | UnionConfig
  | SplitConfig
  | LookupConfig
  | SqlConfig
  | UdfConfig;

/**
 * Block definition in the ETL pipeline
 */
export interface Block {
  id: string;
  type: BlockType;
  name: string;
  inputs: Port[];
  outputs: Port[];
  config: BlockConfig;
  position?: { x: number; y: number };
}

/**
 * Connection between blocks
 */
export interface Connection {
  id: string;
  sourceBlockId: string;
  sourcePortId: string;
  targetBlockId: string;
  targetPortId: string;
}

/**
 * Complete ETL pipeline
 */
export interface Pipeline {
  id: string;
  name: string;
  blocks: Block[];
  connections: Connection[];
  metadata?: {
    created?: string;
    modified?: string;
    author?: string;
    description?: string;
  };
}

/**
 * Execution result for a block
 */
export interface ExecutionResult {
  blockId: string;
  schema: DataSchema;
  sampleData: Record<string, any>[];
  rowCount?: number;
  error?: string;
}
