import { useDraggable } from '@dnd-kit/core';
import { TooltipTrigger } from '@radix-ui/react-tooltip';
import { Handle, Position } from '@xyflow/react';
import { CopyPlus, Replace, Trash } from 'lucide-react';
import React, { useState } from 'react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent } from '@/components/ui/tooltip';
import { UNSAVED_CHANGES_TOAST, useToast } from '@/components/ui/use-toast';
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import { cn } from '@/lib/utils';
import {
  FlowOperationType,
  StepLocationRelativeToParent,
  flowHelper,
} from '@activepieces/shared';

import { ApNode } from '../flow-canvas-utils';

const ApStepNode = React.memo(({ data }: { data: ApNode['data'] }) => {
  const { toast } = useToast();
  const [
    selectStepByName,
    setAllowCanvasPanning,
    isSelected,
    isDragging,
    clickOnNewNodeButton,
  ] = useBuilderStateContext((state) => [
    state.selectStepByName,
    state.setAllowCanvasPanning,
    state.selectedStep?.stepName === data.step?.name,
    state.activeDraggingStep === data.step?.name,
    state.clickOnNewNodeButton,
  ]);
  const deleteStep = useBuilderStateContext((state) => () => {
    state.applyOperation(
      {
        type: FlowOperationType.DELETE_ACTION,
        request: {
          name: data.step!.name,
        },
      },
      () => toast(UNSAVED_CHANGES_TOAST),
    );
    state.removeStepSelection();
  });

  const duplicateStep = useBuilderStateContext((state) => () => {
    state.applyOperation(
      {
        type: FlowOperationType.DUPLICATE_ACTION,
        request: {
          stepName: data.step!.name,
        },
      },
      () => toast(UNSAVED_CHANGES_TOAST),
    );
  });

  const { stepMetadata } = piecesHooks.useStepMetadata({
    step: data.step!,
  });

  const [toolbarOpen, setToolbarOpen] = useState(false);

  const isTrigger = flowHelper.isTrigger(data.step!.type);
  const isAction = flowHelper.isAction(data.step!.type);

  const stepName = data?.step?.name;

  const { attributes, listeners, setNodeRef } = useDraggable({
    id: data.step!.name,
    // TODO fix the drag and enable
    disabled: true,
  });

  return (
    <div
      className={cn('h-[70px] w-[260px] transition-all', {
        'border-primary': toolbarOpen || isSelected,
        'bg-background border border-solid box-border': !isDragging,
      })}
      onClick={() => selectStepByName(data.step!.name)}
      onMouseEnter={() => {
        setToolbarOpen(true);
        setAllowCanvasPanning(false);
      }}
      onMouseLeave={() => {
        setToolbarOpen(false);
        setAllowCanvasPanning(true);
      }}
      key={data.step!.name}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
    >
      <div className="px-2 h-full w-full box-border">
        {!isDragging && (
          <>
            <div
              className={cn(
                'absolute left-0 right-0 top-0 mx-auto h-[3px] transition-all bg-primary opacity-0 rounded-tl-md rounded-tr-md',
                {
                  'opacity-100': toolbarOpen || isSelected,
                  'opacity-0': !toolbarOpen && !isSelected,
                },
              )}
              style={{ width: 'calc(100% - 2px)' }}
            ></div>
            <div
              className="px-2 h-full w-full box-border"
              onClick={() => selectStepByName(data.step!.name)}
            >
              <div className="flex h-full items-center justify-between gap-4 w-full">
                <div className="flex items-center justify-center min-w-[46px] h-full">
                  <img src={stepMetadata?.logoUrl} width="46" height="46" />
                </div>
                <div className="grow flex flex-col items-start justify-center min-w-0 w-full">
                  <div className="text-sm text-ellipsis overflow-hidden whitespace-nowrap w-full">
                    {data.step!.displayName}
                  </div>
                  <div className="text-xs text-muted-foreground text-ellipsis overflow-hidden whitespace-nowrap w-full">
                    {stepMetadata?.displayName}
                  </div>
                </div>
              </div>

              <div
                className={cn(
                  'w-[40px] h-[70px] absolute left-[-40px] top-[0px] transition-opacity duration-300',
                  {
                    'opacity-0': !toolbarOpen,
                    'opacity-100': toolbarOpen,
                  },
                )}
              >
                <div className="flex flex-col gap-2 items-center justify-center mr-4 h-full">
                  {isTrigger && stepName && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-full"
                          onClick={(e) => {
                            clickOnNewNodeButton(
                              'trigger',
                              stepName,
                              StepLocationRelativeToParent.AFTER,
                            );
                            e.stopPropagation();
                          }}
                        >
                          <Replace className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        Replace Trigger
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {isAction && (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full"
                            onClick={(e) => {
                              deleteStep();
                              e.stopPropagation();
                            }}
                          >
                            <Trash className="w-4 h-4 text-destructive" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">Delete step</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full"
                            onClick={(e) => {
                              duplicateStep();
                              e.stopPropagation();
                            }}
                          >
                            <CopyPlus className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          Duplicate step
                        </TooltipContent>
                      </Tooltip>
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        <Handle
          type="source"
          style={{ opacity: 0 }}
          position={Position.Bottom}
        />
        <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      </div>
    </div>
  );
});

ApStepNode.displayName = 'ApStepNode';
export { ApStepNode };
