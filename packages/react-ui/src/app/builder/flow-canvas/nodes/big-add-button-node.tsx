import { DragMoveEvent, useDndMonitor, useDroppable } from '@dnd-kit/core';
import { Handle, Position } from '@xyflow/react';
import { Plus } from 'lucide-react';
import React, { useId, useState } from 'react';

import { PieceSelector } from '@/app/builder/pieces-selector';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { isNil } from '@activepieces/shared';

import { useBuilderStateContext } from '../../builder-hooks';
import { flowUtilConsts } from '../utils/consts';
import { flowCanvasUtils } from '../utils/flow-canvas-utils';
import { ApBigAddButtonNode } from '../utils/types';

const ApBigAddButtonCanvasNode = React.memo(
  ({ data, id }: Omit<ApBigAddButtonNode, 'position'>) => {
    const [isIsStepInsideDropzone, setIsStepInsideDropzone] = useState(false);
    const [readonly, activeDraggingStep, isPieceSelectorOpened] =
      useBuilderStateContext((state) => [
        state.readonly,
        state.activeDraggingStep,
        state.openedPieceSelectorStepNameOrAddButtonId === id,
      ]);
    const draggableId = useId();
    const { setNodeRef } = useDroppable({
      id: draggableId,
      data: {
        accepts: flowUtilConsts.DRAGGED_STEP_TAG,
        ...data,
      },
    });
    const isShowingDropIndicator = !isNil(activeDraggingStep);
    useDndMonitor({
      onDragMove(event: DragMoveEvent) {
        setIsStepInsideDropzone(event.over?.id === draggableId);
      },
      onDragEnd() {
        setIsStepInsideDropzone(false);
      },
    });

    return (
      <>
        {
          <div
            style={{
              height: `${flowUtilConsts.AP_NODE_SIZE.STEP.height}px`,
              width: `${flowUtilConsts.AP_NODE_SIZE.STEP.width}px`,
            }}
            className="flex justify-center items-center"
          >
            {!readonly && (
              <div
                style={{
                  height: `${flowUtilConsts.AP_NODE_SIZE.BIG_ADD_BUTTON.height}px`,
                  width: `${flowUtilConsts.AP_NODE_SIZE.BIG_ADD_BUTTON.width}px`,
                }}
                className={cn(
                  ' cursor-auto border-none flex rounded-full items-center justify-center relative transition-all duration-150 ease-in-out',
                  {
                    'shadow-add-button':
                      isIsStepInsideDropzone || isPieceSelectorOpened,
                  },
                )}
              >
                <div
                  style={{
                    height: `${flowUtilConsts.AP_NODE_SIZE.BIG_ADD_BUTTON.height}px`,
                    width: `${flowUtilConsts.AP_NODE_SIZE.BIG_ADD_BUTTON.width}px`,
                  }}
                  id={id}
                  className={cn(
                    'rounded-full bg-slate-200 dark:shadow-slate-200 shadow-slate-500  hover:shadow-bordered dark:shadow-slate-200 shadow-slate-500   dark:hover:bg-slate-200 group hover:bg-slate-500 dark:bg-slate-400 relative transition-all duration-150 ease-in-out',
                    {
                      'bg-primary/80 dark:bg-primary/80  !shadow-bordered  shadow-primary/80 hover:bg-primary/80':
                        isShowingDropIndicator || isPieceSelectorOpened,
                    },
                  )}
                >
                  {!isShowingDropIndicator && (
                    <PieceSelector
                      operation={flowCanvasUtils.createAddOperationFromAddButtonData(
                        data,
                      )}
                      id={id}
                    >
                      <span>
                        <Button
                          variant="transparent"
                          className="w-full h-full flex items-center rounded-full"
                        >
                          <Plus
                            className={cn(
                              'size-6.5 group-hover:size-7 text-slate-500  dark:text-slate-200 group-hover:dark:text-slate-400 group-hover:text-slate-200',
                              {
                                'opacity-0':
                                  isShowingDropIndicator ||
                                  isPieceSelectorOpened,
                              },
                            )}
                          />
                        </Button>
                      </span>
                    </PieceSelector>
                  )}
                </div>
                {isShowingDropIndicator && (
                  <div
                    style={{
                      height: `${flowUtilConsts.AP_NODE_SIZE.STEP.height}px`,
                      width: `${flowUtilConsts.AP_NODE_SIZE.STEP.width}px`,
                      top: `-${
                        flowUtilConsts.AP_NODE_SIZE.STEP.height / 2 -
                        flowUtilConsts.AP_NODE_SIZE.BIG_ADD_BUTTON.width / 2
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
                  height: `${flowUtilConsts.AP_NODE_SIZE.STEP.height}px`,
                  width: `${flowUtilConsts.AP_NODE_SIZE.STEP.width}px`,
                }}
                className="border cursor-auto border-solid border-none flex items-center justify-center relative "
              >
                <svg
                  height={flowUtilConsts.AP_NODE_SIZE.STEP.height}
                  width={flowUtilConsts.AP_NODE_SIZE.STEP.width}
                  className="overflow-visible  "
                  style={{
                    stroke:
                      'var(--xy-edge-stroke, var(--xy-edge-stroke-default))',
                  }}
                  shapeRendering="auto"
                >
                  <g>
                    <path
                      d={`M ${flowUtilConsts.AP_NODE_SIZE.STEP.width / 2} -${
                        flowUtilConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE + 5
                      } v ${
                        flowUtilConsts.AP_NODE_SIZE.STEP.height +
                        2 *
                          (flowUtilConsts.VERTICAL_SPACE_BETWEEN_STEP_AND_LINE +
                            5)
                      }`}
                      fill="transparent"
                      strokeWidth="1.5"
                    />
                  </g>
                </svg>
              </div>
            )}
          </div>
        }

        <Handle
          type="source"
          position={Position.Bottom}
          style={flowUtilConsts.HANDLE_STYLING}
        />
        <Handle
          type="target"
          position={Position.Top}
          style={flowUtilConsts.HANDLE_STYLING}
        />
      </>
    );
  },
);

ApBigAddButtonCanvasNode.displayName = 'ApBigAddButtonCanvasNode';
export { ApBigAddButtonCanvasNode };
