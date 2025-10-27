import React, { useState } from 'react';
import { JoinConfig, JoinType, JoinKeyMapping } from '../../models/block';

interface JoinKeyMapperProps {
  leftColumns: string[];
  rightColumns: string[];
  mappings: JoinKeyMapping[];
  onChange: (mappings: JoinKeyMapping[]) => void;
}

/**
 * Component for mapping join keys between left and right inputs
 */
export const JoinKeyMapper: React.FC<JoinKeyMapperProps> = ({
  leftColumns,
  rightColumns,
  mappings,
  onChange
}) => {
  const addMapping = () => {
    const newMapping: JoinKeyMapping = {
      leftKey: leftColumns[0] || '',
      rightKey: rightColumns[0] || ''
    };
    onChange([...mappings, newMapping]);
  };
  
  const removeMapping = (index: number) => {
    onChange(mappings.filter((_, i) => i !== index));
  };
  
  const updateMapping = (index: number, field: 'leftKey' | 'rightKey', value: string) => {
    const updated = [...mappings];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };
  
  return (
    <div className="join-key-mapper">
      <div className="mapper-header">
        <h4>Join Keys</h4>
        <button onClick={addMapping} className="btn-add-key">
          + Add Key
        </button>
      </div>
      
      {mappings.length === 0 ? (
        <div className="empty-state">
          <p>No join keys defined. Click "Add Key" to add a join condition.</p>
        </div>
      ) : (
        <div className="mappings-list">
          {mappings.map((mapping, index) => (
            <div key={index} className="key-mapping-row">
              <div className="mapping-field">
                <label>Left Column:</label>
                <select
                  value={mapping.leftKey}
                  onChange={(e) => updateMapping(index, 'leftKey', e.target.value)}
                  className="column-select"
                >
                  <option value="">-- Select Column --</option>
                  {leftColumns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
              
              <div className="mapping-arrow">↔</div>
              
              <div className="mapping-field">
                <label>Right Column:</label>
                <select
                  value={mapping.rightKey}
                  onChange={(e) => updateMapping(index, 'rightKey', e.target.value)}
                  className="column-select"
                >
                  <option value="">-- Select Column --</option>
                  {rightColumns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={() => removeMapping(index)}
                className="btn-remove"
                title="Remove this key mapping"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      
      <style>{`
        .join-key-mapper {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 16px;
          margin: 12px 0;
        }
        
        .mapper-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .mapper-header h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }
        
        .btn-add-key {
          background: #4CAF50;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          transition: background 0.2s;
        }
        
        .btn-add-key:hover {
          background: #45a049;
        }
        
        .empty-state {
          text-align: center;
          padding: 24px;
          color: #666;
          font-size: 13px;
        }
        
        .mappings-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .key-mapping-row {
          display: flex;
          align-items: center;
          gap: 12px;
          background: white;
          padding: 12px;
          border-radius: 6px;
          border: 1px solid #e0e0e0;
        }
        
        .mapping-field {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .mapping-field label {
          font-size: 12px;
          font-weight: 500;
          color: #555;
        }
        
        .column-select {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 13px;
          background: white;
          cursor: pointer;
        }
        
        .column-select:focus {
          outline: none;
          border-color: #2196F3;
        }
        
        .mapping-arrow {
          font-size: 20px;
          color: #2196F3;
          font-weight: bold;
          margin-top: 20px;
        }
        
        .btn-remove {
          background: #f44336;
          color: white;
          border: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
          margin-top: 20px;
        }
        
        .btn-remove:hover {
          background: #da190b;
        }
      `}</style>
    </div>
  );
};
