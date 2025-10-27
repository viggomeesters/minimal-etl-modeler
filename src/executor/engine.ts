import { Block, BlockType, Connection, ExecutionResult, Pipeline, DataSchema } from '../models/block';
import { executeJoin } from './joinExecutor';
import { inferSchema } from '../models/schemaHelpers';

/**
 * Execution context for a block
 */
interface BlockExecutionContext {
  blockId: string;
  inputs: Map<string, ExecutionResult>;
  executed: boolean;
}

/**
 * ETL Engine - executes pipelines with multi-input support
 */
export class ETLEngine {
  private executionResults: Map<string, ExecutionResult> = new Map();
  
  /**
   * Execute a complete pipeline
   */
  async executePipeline(pipeline: Pipeline, preserveExisting = false): Promise<Map<string, ExecutionResult>> {
    if (!preserveExisting) {
      this.executionResults.clear();
    }
    
    // Build execution graph
    const graph = this.buildExecutionGraph(pipeline);
    
    // Topological sort to determine execution order
    const executionOrder = this.topologicalSort(pipeline);
    
    // Execute blocks in order
    for (const blockId of executionOrder) {
      const block = pipeline.blocks.find(b => b.id === blockId);
      if (!block) continue;
      
      const result = await this.executeBlock(block, pipeline, graph);
      this.executionResults.set(blockId, result);
    }
    
    return this.executionResults;
  }
  
  /**
   * Execute a single block
   */
  private async executeBlock(
    block: Block,
    pipeline: Pipeline,
    graph: Map<string, BlockExecutionContext>
  ): Promise<ExecutionResult> {
    const context = graph.get(block.id);
    if (!context) {
      return this.createErrorResult(block.id, 'Block not found in execution graph');
    }
    
    // Get input data from connected blocks
    const inputConnections = pipeline.connections.filter(c => c.targetBlockId === block.id);
    
    // Sort connections by target port ID to maintain order (important for joins)
    inputConnections.sort((a, b) => {
      const portIndexA = block.inputs.findIndex(p => p.id === a.targetPortId);
      const portIndexB = block.inputs.findIndex(p => p.id === b.targetPortId);
      return portIndexA - portIndexB;
    });
    
    const inputs: ExecutionResult[] = [];
    
    for (const conn of inputConnections) {
      const inputResult = this.executionResults.get(conn.sourceBlockId);
      if (inputResult) {
        inputs.push(inputResult);
      }
    }
    
    // Execute based on block type
    switch (block.type) {
      case BlockType.JOIN:
        return this.executeJoinBlock(block, inputs);
      
      case BlockType.SOURCE:
        return this.executeSourceBlock(block);
      
      case BlockType.FILTER:
      case BlockType.MAP:
      case BlockType.DERIVE:
      case BlockType.AGGREGATE:
      case BlockType.UNION:
      case BlockType.SPLIT:
      case BlockType.LOOKUP:
      case BlockType.SQL:
      case BlockType.UDF:
      case BlockType.SINK:
        return this.createErrorResult(block.id, `Block type ${block.type} not yet implemented`);
      
      default:
        return this.createErrorResult(block.id, `Unknown block type: ${block.type}`);
    }
  }
  
  /**
   * Execute a join block
   */
  private executeJoinBlock(block: Block, inputs: ExecutionResult[]): ExecutionResult {
    if (inputs.length !== 2) {
      return this.createErrorResult(
        block.id,
        `Join requires exactly 2 inputs, got ${inputs.length}`
      );
    }
    
    const [leftInput, rightInput] = inputs;
    
    if (leftInput.error) {
      return this.createErrorResult(block.id, `Left input error: ${leftInput.error}`);
    }
    
    if (rightInput.error) {
      return this.createErrorResult(block.id, `Right input error: ${rightInput.error}`);
    }
    
    const joinConfig = block.config as any; // JoinConfig
    
    const result = executeJoin(
      leftInput.sampleData,
      rightInput.sampleData,
      leftInput.schema,
      rightInput.schema,
      joinConfig
    );
    
    result.blockId = block.id;
    return result;
  }
  
  /**
   * Execute a source block (placeholder - would load from actual source)
   */
  private executeSourceBlock(block: Block): ExecutionResult {
    // Check if result already exists (e.g., from mock data in tests)
    const existing = this.executionResults.get(block.id);
    if (existing) {
      return existing;
    }
    
    // In a real implementation, this would load data from the configured source
    // For testing, use schema from config if available
    const sourceConfig = block.config as any;
    const schema = sourceConfig.schema || { columns: [] };
    
    return {
      blockId: block.id,
      schema,
      sampleData: [],
      rowCount: 0
    };
  }
  
  /**
   * Build execution graph with input tracking
   */
  private buildExecutionGraph(pipeline: Pipeline): Map<string, BlockExecutionContext> {
    const graph = new Map<string, BlockExecutionContext>();
    
    for (const block of pipeline.blocks) {
      graph.set(block.id, {
        blockId: block.id,
        inputs: new Map(),
        executed: false
      });
    }
    
    return graph;
  }
  
  /**
   * Topological sort to determine execution order
   */
  private topologicalSort(pipeline: Pipeline): string[] {
    const inDegree = new Map<string, number>();
    const adjacencyList = new Map<string, string[]>();
    
    // Initialize
    for (const block of pipeline.blocks) {
      inDegree.set(block.id, 0);
      adjacencyList.set(block.id, []);
    }
    
    // Build graph
    for (const conn of pipeline.connections) {
      adjacencyList.get(conn.sourceBlockId)?.push(conn.targetBlockId);
      inDegree.set(conn.targetBlockId, (inDegree.get(conn.targetBlockId) || 0) + 1);
    }
    
    // Find nodes with no incoming edges
    const queue: string[] = [];
    for (const [blockId, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(blockId);
      }
    }
    
    // Process queue
    const result: string[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);
      
      const neighbors = adjacencyList.get(current) || [];
      for (const neighbor of neighbors) {
        const newDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) {
          queue.push(neighbor);
        }
      }
    }
    
    // Check for cycles
    if (result.length !== pipeline.blocks.length) {
      throw new Error('Pipeline contains cycles');
    }
    
    return result;
  }
  
  /**
   * Create an error result
   */
  private createErrorResult(blockId: string, error: string): ExecutionResult {
    return {
      blockId,
      schema: { columns: [] },
      sampleData: [],
      error
    };
  }
  
  /**
   * Get execution result for a block
   */
  getResult(blockId: string): ExecutionResult | undefined {
    return this.executionResults.get(blockId);
  }
  
  /**
   * Clear all execution results
   */
  clear(): void {
    this.executionResults.clear();
  }
}
