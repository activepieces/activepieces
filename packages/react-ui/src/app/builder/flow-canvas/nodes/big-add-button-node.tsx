import { DragMoveEvent, useDndMonitor, useDroppable } from '@dnd-kit/core';
import { Handle, Position } from '@xyflow/react';
import { Plus } from 'lucide-react';
import React, { useId, useState } from 'react';

import { PieceSelector } from '@/app/builder/pieces-selector';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  FlowOperationType,
  isNil,
  StepLocationRelativeToParent,
} from '@activepieces/shared';

import { useBuilderStateContext } from '../../builder-hooks';
import {
  AskAiIndicator,
  shouldShowAskAiIndicator,
} from '../edges/ask-ai-indicator';
import { flowUtilConsts } from '../utils/consts';
import { ApBigAddButtonNode } from '../utils/types';

const ApBigAddButtonCanvasNode = React.memo(
  ({ data, id }: Omit<ApBigAddButtonNode, 'position'>) => {
    const [isIsStepInsideDropzone, setIsStepInsideDropzone] = useState(false);
    const [pieceSelectorOpen, setPieceSelectorOpen] = useState(false);
    const [readonly, activeDraggingStep, showAiIndicator] =
      useBuilderStateContext((state) => [
        state.readonly,
        state.activeDraggingStep,
        shouldShowAskAiIndicator(state, data),
      ]);
    const draggableId = useId();
    const { setNodeRef } = useDroppable({
      id: draggableId,
      data: {
        accepts: flowUtilConsts.DRAGGED_STEP_TAG,
        ...data,
      },
    });
    const showDropIndicator = !isNil(activeDraggingStep);

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
                className=" cursor-auto border-none flex items-center justify-center relative "
              >
                <div
                  style={{
                    height: `${flowUtilConsts.AP_NODE_SIZE.BIG_ADD_BUTTON.height}px`,
                    width: `${flowUtilConsts.AP_NODE_SIZE.BIG_ADD_BUTTON.width}px`,
                  }}
                  id={id}
                  className={cn('rounded bg-accent relative', {
                    'bg-primary/80': showDropIndicator || pieceSelectorOpen,
                    'shadow-add-button':
                      isIsStepInsideDropzone || pieceSelectorOpen,
                    'transition-all':
                      isIsStepInsideDropzone ||
                      pieceSelectorOpen ||
                      showDropIndicator,
                  })}
                >
                  {!showDropIndicator && (
                    <PieceSelector
                      operation={
                        data.stepLocationRelativeToParent ===
                        StepLocationRelativeToParent.INSIDE_BRANCH
                          ? {
                              type: FlowOperationType.ADD_ACTION,
                              actionLocation: {
                                parentStep: data.parentStepName,
                                stepLocationRelativeToParent:
                                  data.stepLocationRelativeToParent,
                                branchIndex: data.branchIndex,
                              },
                            }
                          : {
                              type: FlowOperationType.ADD_ACTION,
                              actionLocation: {
                                parentStep: data.parentStepName,
                                stepLocationRelativeToParent:
                                  data.stepLocationRelativeToParent,
                              },
                            }
                      }
                      open={pieceSelectorOpen}
                      onOpenChange={setPieceSelectorOpen}
                    >
                      <span>
                        {showAiIndicator && (
                          <AskAiIndicator
                            height={
                              flowUtilConsts.AP_NODE_SIZE.BIG_ADD_BUTTON.height
                            }
                            width={
                              flowUtilConsts.AP_NODE_SIZE.BIG_ADD_BUTTON.width
                            }
                          ></AskAiIndicator>
                        )}
                        {!showAiIndicator && (
                          <Button
                            variant="transparent"
                            className="w-full h-full flex items-center hover:bg-accent-foreground rounded"
                          >
                            <Plus
                              className={cn('w-6 h-6 text-accent-foreground ', {
                                'opacity-0':
                                  showDropIndicator || pieceSelectorOpen,
                              })}
                            />
                          </Button>
                        )}
                      </span>
                    </PieceSelector>
                  )}
                </div>
                {showDropIndicator && (
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
