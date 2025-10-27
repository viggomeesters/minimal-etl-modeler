import React, { useState, useEffect } from 'react';
import { JoinConfig, JoinType, OutputColumnConfig, DataSchema } from '../../models/block';
import { JoinKeyMapper } from '../components/JoinKeyMapper';
import './JoinNode.css';

interface JoinNodeProps {
  id: string;
  config: JoinConfig;
  leftSchema?: DataSchema;
  rightSchema?: DataSchema;
  leftSampleData?: Record<string, any>[];
  rightSampleData?: Record<string, any>[];
  onChange: (config: JoinConfig) => void;
  position: { x: number; y: number };
}

/**
 * Join Node component for the visual ETL editor
 */
export const JoinNode: React.FC<JoinNodeProps> = ({
  id,
  config,
  leftSchema,
  rightSchema,
  leftSampleData = [],
  rightSampleData = [],
  onChange,
  position
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localConfig, setLocalConfig] = useState<JoinConfig>(config);
  const [previewData, setPreviewData] = useState<Record<string, any>[]>([]);
  
  const leftColumns = leftSchema?.columns.map(c => c.name) || [];
  const rightColumns = rightSchema?.columns.map(c => c.name) || [];
  
  useEffect(() => {
    setLocalConfig(config);
  }, [config]);
  
  const handleConfigChange = (updates: Partial<JoinConfig>) => {
    setLocalConfig(prev => ({ ...prev, ...updates }));
  };
  
  const handleSave = () => {
    onChange(localConfig);
    setIsModalOpen(false);
  };
  
  const handleCancel = () => {
    setLocalConfig(config);
    setIsModalOpen(false);
  };
  
  const handleGeneratePreview = () => {
    // Generate a small preview of the join result
    // This is a simplified version - in reality, would call executor
    const preview: Record<string, any>[] = [];
    const maxRows = 5;
    
    if (localConfig.joinType === JoinType.INNER && leftSampleData.length > 0 && rightSampleData.length > 0) {
      let count = 0;
      for (const leftRow of leftSampleData) {
        for (const rightRow of rightSampleData) {
          if (count >= maxRows) break;
          
          // Simple key matching
          let matches = true;
          for (const key of localConfig.keys) {
            if (leftRow[key.leftKey] !== rightRow[key.rightKey]) {
              matches = false;
              break;
            }
          }
          
          if (matches) {
            const merged: Record<string, any> = {};
            if (localConfig.outputColumns.length > 0) {
              for (const outCol of localConfig.outputColumns) {
                const [side, colName] = outCol.sourceColumn.split('.');
                const sourceRow = side === 'left' ? leftRow : rightRow;
                merged[outCol.outputName] = sourceRow?.[colName] ?? null;
              }
            } else {
              // Default prefixes
              Object.entries(leftRow).forEach(([k, v]) => merged[`left_${k}`] = v);
              Object.entries(rightRow).forEach(([k, v]) => merged[`right_${k}`] = v);
            }
            preview.push(merged);
            count++;
          }
        }
        if (count >= maxRows) break;
      }
    }
    
    setPreviewData(preview);
  };
  
  const addOutputColumn = () => {
    const newCol: OutputColumnConfig = {
      sourceColumn: leftColumns.length > 0 ? `left.${leftColumns[0]}` : '',
      outputName: ''
    };
    handleConfigChange({
      outputColumns: [...localConfig.outputColumns, newCol]
    });
  };
  
  const removeOutputColumn = (index: number) => {
    handleConfigChange({
      outputColumns: localConfig.outputColumns.filter((_, i) => i !== index)
    });
  };
  
  const updateOutputColumn = (index: number, updates: Partial<OutputColumnConfig>) => {
    const updated = [...localConfig.outputColumns];
    updated[index] = { ...updated[index], ...updates };
    handleConfigChange({ outputColumns: updated });
  };
  
  return (
    <>
      <div 
        className="join-node"
        style={{ left: position.x, top: position.y }}
        onClick={() => setIsModalOpen(true)}
      >
        <div className="node-header">
          <span className="node-icon">⚡</span>
          <span className="node-title">Join</span>
        </div>
        
        <div className="node-ports">
          <div className="input-port left-port" title="Left Input">
            <span className="port-label">L</span>
            <div className="port-connector"></div>
          </div>
          <div className="input-port right-port" title="Right Input">
            <span className="port-label">R</span>
            <div className="port-connector"></div>
          </div>
        </div>
        
        <div className="node-info">
          <div className="join-type-badge">{localConfig.joinType.toUpperCase()}</div>
          {localConfig.keys.length > 0 && (
            <div className="keys-info">{localConfig.keys.length} key(s)</div>
          )}
        </div>
        
        <div className="output-port">
          <div className="port-connector"></div>
        </div>
      </div>
      
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Configure Join Block</h2>
              <button className="btn-close" onClick={handleCancel}>✕</button>
            </div>
            
            <div className="modal-body">
              {/* Join Type Selector */}
              <div className="config-section">
                <label>Join Type:</label>
                <select
                  value={localConfig.joinType}
                  onChange={(e) => handleConfigChange({ joinType: e.target.value as JoinType })}
                  className="join-type-select"
                >
                  <option value={JoinType.INNER}>Inner Join</option>
                  <option value={JoinType.LEFT}>Left Join</option>
                  <option value={JoinType.RIGHT}>Right Join</option>
                  <option value={JoinType.FULL}>Full Outer Join</option>
                  <option value={JoinType.CROSS}>Cross Join</option>
                </select>
              </div>
              
              {/* Join Keys Mapper */}
              <JoinKeyMapper
                leftColumns={leftColumns}
                rightColumns={rightColumns}
                mappings={localConfig.keys}
                onChange={(keys) => handleConfigChange({ keys })}
              />
              
              {/* Predicate Editor */}
              <div className="config-section">
                <label>Additional Predicate (optional):</label>
                <input
                  type="text"
                  value={localConfig.predicate || ''}
                  onChange={(e) => handleConfigChange({ predicate: e.target.value || undefined })}
                  placeholder="e.g., left.amount > right.threshold"
                  className="predicate-input"
                />
              </div>
              
              {/* Output Columns */}
              <div className="config-section">
                <div className="section-header">
                  <label>Output Columns:</label>
                  <button onClick={addOutputColumn} className="btn-add-small">+ Add Column</button>
                </div>
                
                {localConfig.outputColumns.length === 0 ? (
                  <div className="info-box">
                    Default: All columns with left_/right_ prefixes
                  </div>
                ) : (
                  <div className="output-columns-list">
                    {localConfig.outputColumns.map((col, index) => (
                      <div key={index} className="output-column-row">
                        <select
                          value={col.sourceColumn}
                          onChange={(e) => updateOutputColumn(index, { sourceColumn: e.target.value })}
                          className="source-select"
                        >
                          <option value="">-- Select Source --</option>
                          <optgroup label="Left Input">
                            {leftColumns.map(c => (
                              <option key={`left.${c}`} value={`left.${c}`}>left.{c}</option>
                            ))}
                          </optgroup>
                          <optgroup label="Right Input">
                            {rightColumns.map(c => (
                              <option key={`right.${c}`} value={`right.${c}`}>right.{c}</option>
                            ))}
                          </optgroup>
                        </select>
                        
                        <span className="arrow">→</span>
                        
                        <input
                          type="text"
                          value={col.outputName}
                          onChange={(e) => updateOutputColumn(index, { outputName: e.target.value })}
                          placeholder="Output name"
                          className="output-name-input"
                        />
                        
                        <button
                          onClick={() => removeOutputColumn(index)}
                          className="btn-remove-small"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Options */}
              <div className="config-section">
                <label>Options:</label>
                <div className="options-grid">
                  <div className="option-item">
                    <label>Broadcast:</label>
                    <select
                      value={localConfig.options?.broadcast || 'none'}
                      onChange={(e) => handleConfigChange({
                        options: { ...localConfig.options, broadcast: e.target.value as any }
                      })}
                    >
                      <option value="none">None</option>
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                  
                  <div className="option-item checkbox">
                    <label>
                      <input
                        type="checkbox"
                        checked={localConfig.options?.nullEquality || false}
                        onChange={(e) => handleConfigChange({
                          options: { ...localConfig.options, nullEquality: e.target.checked }
                        })}
                      />
                      NULL = NULL
                    </label>
                  </div>
                  
                  <div className="option-item checkbox">
                    <label>
                      <input
                        type="checkbox"
                        checked={localConfig.options?.dedupe || false}
                        onChange={(e) => handleConfigChange({
                          options: { ...localConfig.options, dedupe: e.target.checked }
                        })}
                      />
                      Deduplicate
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Preview */}
              <div className="config-section">
                <div className="section-header">
                  <label>Preview:</label>
                  <button onClick={handleGeneratePreview} className="btn-preview">
                    Generate Preview
                  </button>
                </div>
                
                {previewData.length > 0 ? (
                  <div className="preview-table-container">
                    <table className="preview-table">
                      <thead>
                        <tr>
                          {Object.keys(previewData[0]).map(key => (
                            <th key={key}>{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((row, i) => (
                          <tr key={i}>
                            {Object.values(row).map((val, j) => (
                              <td key={j}>{val === null ? <em>null</em> : String(val)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="info-box">
                    Click "Generate Preview" to see sample join results
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button onClick={handleCancel} className="btn-cancel">Cancel</button>
              <button onClick={handleSave} className="btn-save">Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
