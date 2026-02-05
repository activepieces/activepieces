import { DragMoveEvent, useDndMonitor, useDroppable } from '@dnd-kit/core';
import { Handle, Position } from '@xyflow/react';
import { Plus } from 'lucide-react';
import React, { useId, useState } from 'react';

import { PieceSelector } from '@/app/builder/pieces-selector';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { isNil } from '@activepieces/shared';

import { useBuilderStateContext } from '../../builder-hooks';
import { flowCanvasConsts } from '../utils/consts';
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
        accepts: flowCanvasConsts.DRAGGED_STEP_TAG,
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
              height: `${flowCanvasConsts.AP_NODE_SIZE.STEP.height}px`,
              width: `${flowCanvasConsts.AP_NODE_SIZE.STEP.width}px`,
            }}
            className="flex justify-center items-center "
          >
            {!readonly && (
              //we use transparent colors when opening the piece selector, so to not show the pattern of the background inside the button, we wrap the big add button in a div with the background color
              <div className="bg-builder-background">
                <div
                  style={{
                    height: `${flowCanvasConsts.AP_NODE_SIZE.BIG_ADD_BUTTON.height}px`,
                    width: `${flowCanvasConsts.AP_NODE_SIZE.BIG_ADD_BUTTON.width}px`,
                  }}
                  className=" cursor-auto border-none flex items-center justify-center relative "
                >
                  <div
                    style={{
                      height: `${flowCanvasConsts.AP_NODE_SIZE.BIG_ADD_BUTTON.height}px`,
                      width: `${flowCanvasConsts.AP_NODE_SIZE.BIG_ADD_BUTTON.width}px`,
                    }}
                    id={id}
                    className={cn('rounded-lg bg-background relative', {
                      'bg-primary/80':
                        isShowingDropIndicator || isPieceSelectorOpened,
                      'shadow-add-button':
                        isIsStepInsideDropzone || isPieceSelectorOpened,
                      'transition-all':
                        isIsStepInsideDropzone ||
                        isPieceSelectorOpened ||
                        isShowingDropIndicator,
                    })}
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
                            className="w-full h-full flex items-center hover:bg-accent-foreground rounded-lg border-border border-solid border"
                          >
                            <Plus
                              className={cn('w-6 h-6 text-foreground ', {
                                'opacity-0':
                                  isShowingDropIndicator ||
                                  isPieceSelectorOpened,
                              })}
                            />
                          </Button>
                        </span>
                      </PieceSelector>
                    )}
                  </div>
                  {isShowingDropIndicator && (
                    //this is an invisible div that is used to show the drop indicator when the step is being dragged over the big add button, it is a rectangle so there is more leanancy to drop the step on the big add button
                    <div
                      style={{
                        height: `${flowCanvasConsts.AP_NODE_SIZE.STEP.height}px`,
                        width: `${flowCanvasConsts.AP_NODE_SIZE.STEP.width}px`,
                        top: `-${
                          flowCanvasConsts.AP_NODE_SIZE.STEP.height / 2 -
                          flowCanvasConsts.AP_NODE_SIZE.BIG_ADD_BUTTON.width / 2
                        }px`,
                      }}
                      className=" absolute "
                      ref={setNodeRef}
                    >
                      {' '}
                    </div>
                  )}
                </div>
              </div>
            )}
            {readonly && (
              <div
                style={{
                  height: `${flowCanvasConsts.AP_NODE_SIZE.STEP.height}px`,
                  width: `${flowCanvasConsts.AP_NODE_SIZE.STEP.width}px`,
                }}
                className=" cursor-auto  flex items-center justify-center relative "
              >
                <svg
                  height={flowCanvasConsts.AP_NODE_SIZE.STEP.height}
                  width={flowCanvasConsts.AP_NODE_SIZE.STEP.width}
                  className="overflow-visible border-transparent "
                  style={{
                    stroke: 'var(--xy-edge-stroke, var(--xy-edge-stroke))',
                  }}
                  shapeRendering="auto"
                >
                  <g>
                    <path
                      d={`M ${
                        flowCanvasConsts.AP_NODE_SIZE.STEP.width / 2
                      } -10 v ${
                        flowCanvasConsts.AP_NODE_SIZE.STEP.height + 14
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
          style={flowCanvasConsts.HANDLE_STYLING}
        />
        <Handle
          type="target"
          position={Position.Top}
          style={flowCanvasConsts.HANDLE_STYLING}
        />
      </>
    );
  },
);

ApBigAddButtonCanvasNode.displayName = 'ApBigAddButtonCanvasNode';
export { ApBigAddButtonCanvasNode };
