import { BaseEdge } from '@xyflow/react';
import React from 'react';

import { AP_NODE_SIZE, ApNodeType } from '../flow-canvas-utils';

interface ReturnLoopedgeButtonProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  data: Record<string, unknown>;
}

const ReturnLoopedgeButton = React.memo((props: ReturnLoopedgeButtonProps) => {
  const offset = AP_NODE_SIZE[ApNodeType.LOOP_PLACEHOLDER].height + 6;

  const ARC_UP_RIGHT = 'a15,15 0 0,1 15,-15';
  const ARC_UP_LENGTH = 15;
  const ARROW = 'm-5 -6 l6 6  m-6 0 m6 0 l-6 6 m3 -6';
  const edgePath = `M ${props.targetX} ${props.targetY + offset} 
  v${-60 - offset + ARC_UP_LENGTH} ${ARC_UP_RIGHT} 
  h${props.sourceX - props.targetX - 30}
  ${ARROW}`;
  return (
    <BaseEdge
      path={edgePath}
      interactionWidth={0}
      style={{ strokeWidth: 1.5 }}
      className="cursor-default"
    />
  );
});

ReturnLoopedgeButton.displayName = 'ReturnLoopedgeButton';
export { ReturnLoopedgeButton };
