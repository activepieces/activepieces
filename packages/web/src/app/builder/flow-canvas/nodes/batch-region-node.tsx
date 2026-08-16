import { NodeProps } from '@xyflow/react';
import React from 'react';

import { cn } from '@/lib/utils';

import { useBuilderStateContext } from '../../builder-hooks';
import { ApBatchRegionNode } from '../utils/types';

const CORNER_RADIUS = 16;

const ApBatchRegionCanvasNode = React.memo(
  ({ data }: NodeProps & Pick<ApBatchRegionNode, 'data' | 'id'>) => {
    const isHighlighted = useBuilderStateContext(
      (state) =>
        state.selectedNodes.includes(data.stepName) ||
        state.hoveredBatchRegion === data.stepName,
    );
    return (
      <svg
        width={data.size.width}
        height={data.size.height}
        viewBox={`0 0 ${data.size.width} ${data.size.height}`}
        className="pointer-events-none overflow-visible"
      >
        <rect
          x={0.6}
          y={0.6}
          width={data.size.width - 1.2}
          height={data.size.height - 1.2}
          rx={CORNER_RADIUS}
          fill="none"
          strokeWidth={1.5}
          stroke="var(--xy-edge-stroke)"
          className={cn('transition-all duration-150', {
            'opacity-100': isHighlighted,
            'opacity-60': !isHighlighted,
          })}
        />
      </svg>
    );
  },
);

ApBatchRegionCanvasNode.displayName = 'ApBatchRegionCanvasNode';
export { ApBatchRegionCanvasNode };
