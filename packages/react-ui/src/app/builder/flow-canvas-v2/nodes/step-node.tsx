import { Handle, Position, NodeProps } from '@xyflow/react';

export const FlowStepNode = ({ data }: NodeProps) => {
  return (
    <div
      style={{
        width: '300px',
        height: '100px',
        backgroundColor: 'white',
        border: '2px solid #ddd',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      }}
    >
      <Handle type="target" position={Position.Top} />
      <div style={{ padding: '10px', textAlign: 'center' }}>
        {'White Box Node'}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

FlowStepNode.displayName = 'FlowStepNode';
