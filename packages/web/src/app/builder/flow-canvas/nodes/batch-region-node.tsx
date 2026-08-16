import { NodeProps } from '@xyflow/react';
import { t } from 'i18next';
import React from 'react';

import { cn } from '@/lib/utils';

import { useBuilderStateContext } from '../../builder-hooks';
import { batchRegionUtils } from '../utils/batch-region';
import { ApBatchRegionNode } from '../utils/types';

const ApBatchRegionCanvasNode = React.memo(
  ({ data, id }: NodeProps & Pick<ApBatchRegionNode, 'data' | 'id'>) => {
    const [selectedNodes, hoveredCanvasTarget] = useBuilderStateContext(
      (state) => [state.selectedNodes, state.hoveredCanvasTarget],
    );
    const isHighlighted = batchRegionUtils.isRegionHighlighted({
      stepName: data.stepName,
      childNames: data.childNames,
      selectedNodes,
      hoveredTarget: hoveredCanvasTarget,
    });
    const maskId = `${id}-notch`;
    return (
      <svg
        width={data.size.width}
        height={data.size.height}
        viewBox={`0 0 ${data.size.width} ${data.size.height}`}
        className="pointer-events-none overflow-visible"
      >
        <mask id={maskId} maskUnits="userSpaceOnUse">
          <rect
            x={0}
            y={0}
            width={data.size.width}
            height={data.size.height}
            fill="white"
          />
          <text
            x={data.notch.x}
            y={data.notch.y}
            dominantBaseline="middle"
            className="text-[11px] font-semibold"
            stroke="black"
            strokeWidth={10}
            strokeLinejoin="round"
            fill="black"
          >
            {t('Batched')}
          </text>
        </mask>
        <path
          d={data.path}
          mask={`url(#${maskId})`}
          fill="none"
          strokeWidth={1.2}
          className={cn('transition-all duration-150', {
            'stroke-primary/40': !isHighlighted,
            'stroke-primary': isHighlighted,
          })}
        />
        <text
          x={data.notch.x}
          y={data.notch.y}
          dominantBaseline="middle"
          className="fill-primary text-[11px] font-semibold"
        >
          {t('Batched')}
        </text>
      </svg>
    );
  },
);

ApBatchRegionCanvasNode.displayName = 'ApBatchRegionCanvasNode';
export { ApBatchRegionCanvasNode };
