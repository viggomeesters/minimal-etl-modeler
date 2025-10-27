import { JoinConfig, JoinType, DataSchema, ExecutionResult } from '../models/block';
import { computeJoinOutputSchema, validateJoinKeys } from '../models/schemaHelpers';

/**
 * Join executor - implements various join types for ETL operations
 */
export class JoinExecutor {
  /**
   * Execute a join operation
   */
  execute(
    leftData: Record<string, any>[],
    rightData: Record<string, any>[],
    leftSchema: DataSchema,
    rightSchema: DataSchema,
    config: JoinConfig
  ): ExecutionResult {
    // Validate join keys
    const validation = validateJoinKeys(leftSchema, rightSchema, config);
    if (!validation.valid) {
      return {
        blockId: '',
        schema: { columns: [] },
        sampleData: [],
        error: validation.errors.join('; ')
      };
    }
    
    // Compute output schema
    const outputSchema = computeJoinOutputSchema(leftSchema, rightSchema, config);
    
    // Perform the join
    let joinedData: Record<string, any>[];
    
    switch (config.joinType) {
      case JoinType.INNER:
        joinedData = this.innerJoin(leftData, rightData, config);
        break;
      case JoinType.LEFT:
        joinedData = this.leftJoin(leftData, rightData, config);
        break;
      case JoinType.RIGHT:
        joinedData = this.rightJoin(leftData, rightData, config);
        break;
      case JoinType.FULL:
        joinedData = this.fullJoin(leftData, rightData, config);
        break;
      case JoinType.CROSS:
        joinedData = this.crossJoin(leftData, rightData, config);
        break;
      default:
        return {
          blockId: '',
          schema: { columns: [] },
          sampleData: [],
          error: `Unknown join type: ${config.joinType}`
        };
    }
    
    // Apply deduplication if requested
    if (config.options?.dedupe) {
      joinedData = this.deduplicateRows(joinedData);
    }
    
    return {
      blockId: '',
      schema: outputSchema,
      sampleData: joinedData,
      rowCount: joinedData.length
    };
  }
  
  /**
   * Inner join - only matching rows from both sides
   */
  private innerJoin(
    leftData: Record<string, any>[],
    rightData: Record<string, any>[],
    config: JoinConfig
  ): Record<string, any>[] {
    const result: Record<string, any>[] = [];
    const nullEquality = config.options?.nullEquality ?? false;
    
    for (const leftRow of leftData) {
      for (const rightRow of rightData) {
        if (this.rowsMatch(leftRow, rightRow, config.keys, nullEquality)) {
          result.push(this.mergeRows(leftRow, rightRow, config));
        }
      }
    }
    
    return result;
  }
  
  /**
   * Left join - all rows from left, matching rows from right (nulls if no match)
   */
  private leftJoin(
    leftData: Record<string, any>[],
    rightData: Record<string, any>[],
    config: JoinConfig
  ): Record<string, any>[] {
    const result: Record<string, any>[] = [];
    const nullEquality = config.options?.nullEquality ?? false;
    
    for (const leftRow of leftData) {
      let foundMatch = false;
      
      for (const rightRow of rightData) {
        if (this.rowsMatch(leftRow, rightRow, config.keys, nullEquality)) {
          result.push(this.mergeRows(leftRow, rightRow, config));
          foundMatch = true;
        }
      }
      
      if (!foundMatch) {
        // Add left row with null values for right side
        result.push(this.mergeRows(leftRow, null, config));
      }
    }
    
    return result;
  }
  
  /**
   * Right join - all rows from right, matching rows from left (nulls if no match)
   */
  private rightJoin(
    leftData: Record<string, any>[],
    rightData: Record<string, any>[],
    config: JoinConfig
  ): Record<string, any>[] {
    const result: Record<string, any>[] = [];
    const nullEquality = config.options?.nullEquality ?? false;
    
    for (const rightRow of rightData) {
      let foundMatch = false;
      
      for (const leftRow of leftData) {
        if (this.rowsMatch(leftRow, rightRow, config.keys, nullEquality)) {
          result.push(this.mergeRows(leftRow, rightRow, config));
          foundMatch = true;
        }
      }
      
      if (!foundMatch) {
        // Add right row with null values for left side
        result.push(this.mergeRows(null, rightRow, config));
      }
    }
    
    return result;
  }
  
  /**
   * Full outer join - all rows from both sides
   */
  private fullJoin(
    leftData: Record<string, any>[],
    rightData: Record<string, any>[],
    config: JoinConfig
  ): Record<string, any>[] {
    const result: Record<string, any>[] = [];
    const nullEquality = config.options?.nullEquality ?? false;
    const matchedRightIndices = new Set<number>();
    
    // First pass: process all left rows
    for (const leftRow of leftData) {
      let foundMatch = false;
      
      for (let i = 0; i < rightData.length; i++) {
        const rightRow = rightData[i];
        if (this.rowsMatch(leftRow, rightRow, config.keys, nullEquality)) {
          result.push(this.mergeRows(leftRow, rightRow, config));
          matchedRightIndices.add(i);
          foundMatch = true;
        }
      }
      
      if (!foundMatch) {
        result.push(this.mergeRows(leftRow, null, config));
      }
    }
    
    // Second pass: add unmatched right rows
    for (let i = 0; i < rightData.length; i++) {
      if (!matchedRightIndices.has(i)) {
        result.push(this.mergeRows(null, rightData[i], config));
      }
    }
    
    return result;
  }
  
  /**
   * Cross join - Cartesian product of both sides
   */
  private crossJoin(
    leftData: Record<string, any>[],
    rightData: Record<string, any>[],
    config: JoinConfig
  ): Record<string, any>[] {
    const result: Record<string, any>[] = [];
    
    for (const leftRow of leftData) {
      for (const rightRow of rightData) {
        result.push(this.mergeRows(leftRow, rightRow, config));
      }
    }
    
    return result;
  }
  
  /**
   * Check if two rows match on join keys
   */
  private rowsMatch(
    leftRow: Record<string, any>,
    rightRow: Record<string, any>,
    keys: JoinConfig['keys'],
    nullEquality: boolean
  ): boolean {
    for (const keyPair of keys) {
      const leftValue = leftRow[keyPair.leftKey];
      const rightValue = rightRow[keyPair.rightKey];
      
      // Handle null equality option
      if (leftValue === null || rightValue === null) {
        if (!nullEquality) {
          return false;
        }
        if (leftValue !== rightValue) {
          return false;
        }
      } else if (leftValue !== rightValue) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Merge two rows according to output column configuration
   */
  private mergeRows(
    leftRow: Record<string, any> | null,
    rightRow: Record<string, any> | null,
    config: JoinConfig
  ): Record<string, any> {
    const merged: Record<string, any> = {};
    
    // If output columns are configured, use those
    if (config.outputColumns && config.outputColumns.length > 0) {
      for (const outCol of config.outputColumns) {
        const [side, colName] = this.parseSourceColumn(outCol.sourceColumn);
        const sourceRow = side === 'left' ? leftRow : rightRow;
        merged[outCol.outputName] = sourceRow ? sourceRow[colName] : null;
      }
    } else {
      // Default: prefix all columns with left_ or right_
      if (leftRow) {
        for (const [key, value] of Object.entries(leftRow)) {
          merged[`left_${key}`] = value;
        }
      }
      
      if (rightRow) {
        for (const [key, value] of Object.entries(rightRow)) {
          merged[`right_${key}`] = value;
        }
      }
    }
    
    return merged;
  }
  
  /**
   * Parse source column reference
   */
  private parseSourceColumn(sourceColumn: string): ['left' | 'right', string] {
    const parts = sourceColumn.split('.');
    if (parts.length === 2 && (parts[0] === 'left' || parts[0] === 'right')) {
      return [parts[0] as 'left' | 'right', parts[1]];
    }
    return ['left', sourceColumn];
  }
  
  /**
   * Remove duplicate rows
   */
  private deduplicateRows(data: Record<string, any>[]): Record<string, any>[] {
    const seen = new Set<string>();
    const result: Record<string, any>[] = [];
    
    for (const row of data) {
      const key = JSON.stringify(row);
      if (!seen.has(key)) {
        seen.add(key);
        result.push(row);
      }
    }
    
    return result;
  }
}

/**
 * Factory function to create and execute a join
 */
export function executeJoin(
  leftData: Record<string, any>[],
  rightData: Record<string, any>[],
  leftSchema: DataSchema,
  rightSchema: DataSchema,
  config: JoinConfig
): ExecutionResult {
  const executor = new JoinExecutor();
  return executor.execute(leftData, rightData, leftSchema, rightSchema, config);
}
