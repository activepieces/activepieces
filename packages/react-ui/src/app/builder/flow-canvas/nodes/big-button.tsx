import { DragMoveEvent, useDndMonitor, useDroppable } from '@dnd-kit/core';
import { Handle, Position } from '@xyflow/react';
import { Plus } from 'lucide-react';
import React, { useId, useState } from 'react';

import { PieceSelector } from '@/app/builder/pieces-selector';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FlowOperationType, isNil } from '@activepieces/shared';

import { useBuilderStateContext } from '../../builder-hooks';
import { AP_NODE_SIZE, ApNode, DRAGGED_STEP_TAG } from '../flow-canvas-utils';

const ApBigButton = React.memo(({ data }: { data: ApNode['data'] }) => {
  const [isIsStepInsideDropzone, setIsStepInsideDropzone] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [readonly, activeDraggingStep] = useBuilderStateContext((state) => [
    state.readonly,
    state.activeDraggingStep,
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

  useDndMonitor({
    onDragMove(event: DragMoveEvent) {
      setIsStepInsideDropzone(event.over?.id === id);
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
            className={cn('w-[50px] h-[50px]  rounded bg-accent', {
              'bg-primary/80': showDropIndicator || actionMenuOpen,
              'shadow-add-button': isIsStepInsideDropzone || actionMenuOpen,
              'transition-all':
                isIsStepInsideDropzone || actionMenuOpen || showDropIndicator,
            })}
          >
            {!showDropIndicator && (
              <PieceSelector
                operation={{
                  type: FlowOperationType.ADD_ACTION,
                  actionLocation: {
                    parentStep: data.parentStep!,
                    stepLocationRelativeToParent:
                      data.stepLocationRelativeToParent!,
                  },
                }}
                open={actionMenuOpen}
                onOpenChange={setActionMenuOpen}
              >
                <Button
                  variant="transparent"
                  className="w-full h-full hover:bg-accent-foreground rounded"
                >
                  <Plus
                    className={cn('w-6 h-6 text-accent-foreground ', {
                      'opacity-0': showDropIndicator || actionMenuOpen,
                    })}
                  />
                </Button>
              </PieceSelector>
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
