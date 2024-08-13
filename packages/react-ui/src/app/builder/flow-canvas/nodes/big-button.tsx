import { isNil } from '@activepieces/shared';
import { DragMoveEvent, useDndMonitor, useDroppable } from '@dnd-kit/core';
import { Handle, Position } from '@xyflow/react';
import { Plus } from 'lucide-react';
import React, { useId, useState } from 'react';

import { useBuilderStateContext } from '../../builder-hooks';
import { AP_NODE_SIZE, ApNode, DRAGGED_STEP_TAG } from '../flow-canvas-utils';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ApBigButton = React.memo(({ data }: { data: ApNode['data'] }) => {
  const [showButtonShadow, setShowButtonShadow] = useState(false);
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
    selectedButton?.stepname === data?.parentStep;

  useDndMonitor({
    onDragMove(event: DragMoveEvent) {
      setShowButtonShadow(event.over?.id === id);
      console.log(event.over?.id === id);
    },
    onDragEnd() {
      setShowButtonShadow(false);
    },
  });
  return (
    <>
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
            boxShadow: showButtonShadow
              ? '0 0 0 6px hsl(var(--primary-100))'
              : 'none',
          }}
        >
          {!showDropIndicator && (
            <Button
              variant="ghost"
              className="w-full h-full"
              disabled={readonly}
              onClick={(e) => {
                clickOnNewNodeButton(
                  'action',
                  data.parentStep!,
                  data.stepLocationRelativeToParent!,
                );
              }}
            >
              <Plus className="w-6 h-6 text-accent-foreground" />
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

      <Handle type="source" style={{ opacity: 0 }} position={Position.Bottom} />
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
    </>
  );
});

ApBigButton.displayName = 'ApBigButton';
export { ApBigButton };
