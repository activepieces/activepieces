import { DragMoveEvent, useDndMonitor, useDroppable } from '@dnd-kit/core';
import { Handle, Position } from '@xyflow/react';
import { Plus } from 'lucide-react';
import React, { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { isNil } from '@activepieces/shared';

import { useBuilderStateContext } from '../../builder-hooks';
import { AP_NODE_SIZE, ApNode, DRAGGED_STEP_TAG } from '../flow-canvas-utils';

const ApBigButton = React.memo(({ data }: { data: ApNode['data'] }) => {
  const [isIsStepInsideDropzone, setIsStepInsideDropzone] = useState(false);
  const [clickOnNewNodeButton, readonly, activeDraggingStep, selectedButton] =
    useBuilderStateContext((state) => [
      state.clickOnNewNodeButton,
      state.readonly,
      state.activeDraggingStep,
      state.selectedButton,
    ]);
  const id = useId();
  const { setNodeRef } = useDroppable({
    id,
    data: {
      accepts: DRAGGED_STEP_TAG,
      ...data,
    },
  });
  const showDropIndicator = !isNil(activeDraggingStep);
  const isSelected =
    selectedButton &&
    selectedButton.type === 'action' &&
    selectedButton?.stepname === data?.parentStep &&
    selectedButton?.relativeLocation === data.stepLocationRelativeToParent;

  useDndMonitor({
    onDragMove(event: DragMoveEvent) {
      setIsStepInsideDropzone(event.over?.id === id);
      console.log(event.over?.id === id);
    },
    onDragEnd() {
      setIsStepInsideDropzone(false);
    },
  });
  return (
    <>
      {!readonly && (
        <div
          style={{
            height: `${AP_NODE_SIZE.stepNode.height}px`,
            width: `${AP_NODE_SIZE.stepNode.width}px`,
          }}
          className="border cursor-auto border-solid border-none flex items-center justify-center relative "
        >
          <div
            className={cn('w-[50px] h-[50px]  rounded transition-all', {
              'bg-accent': !isSelected && !showDropIndicator,
              'bg-primary': isSelected || showDropIndicator,
            })}
            style={{
              boxShadow:
                isIsStepInsideDropzone || isSelected
                  ? '0 0 0 6px hsl(var(--primary-100))'
                  : 'none',
            }}
          >
            {!showDropIndicator && (
              <Button
                variant="transparent"
                className="w-full h-full hover:bg-transparent"
                disabled={readonly}
                onClick={(e) => {
                  clickOnNewNodeButton(
                    'action',
                    data.parentStep!,
                    data.stepLocationRelativeToParent!,
                  );
                }}
              >
                <Plus
                  className={cn(
                    'w-6 h-6 text-accent-foreground transition-all',
                    {
                      'opacity-0': showDropIndicator || isSelected,
                    },
                  )}
                />
              </Button>
            )}
          </div>
          {showDropIndicator && (
            <div
              style={{
                height: `${AP_NODE_SIZE.stepNode.height}px`,
                width: `${AP_NODE_SIZE.stepNode.width}px`,
                top: `-${
                  AP_NODE_SIZE.stepNode.height / 2 -
                  AP_NODE_SIZE.bigButton.width / 2
                }px`,
              }}
              className=" absolute "
              ref={setNodeRef}
            >
              {' '}
            </div>
          )}
        </div>
      )}
      {readonly && (
        <div
          style={{
            height: `${AP_NODE_SIZE.stepNode.height}px`,
            width: `${AP_NODE_SIZE.stepNode.width}px`,
          }}
          className="border cursor-auto border-solid border-none flex items-center justify-center relative "
        >
          <svg
            className="overflow-visible  mt-7"
            style={{
              stroke: 'var(--xy-edge-stroke, var(--xy-edge-stroke-default))',
            }}
            shapeRendering="auto"
          >
            <g>
              <path d="M 150 0 V 100" fill="transparent" strokeWidth="1.5" />
            </g>
          </svg>
        </div>
      )}

      <Handle type="source" style={{ opacity: 0 }} position={Position.Bottom} />
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
    </>
  );
});

ApBigButton.displayName = 'ApBigButton';
export { ApBigButton };
