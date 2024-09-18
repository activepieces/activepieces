import { useDraggable } from '@dnd-kit/core';
import { TooltipTrigger } from '@radix-ui/react-tooltip';
import { Handle, Position } from '@xyflow/react';
import { t } from 'i18next';
import {
  ArrowRightLeft,
  CopyPlus,
  EllipsisVertical,
  Trash,
} from 'lucide-react';
import React, { useMemo, useState, useRef } from 'react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { PieceSelector } from '@/app/builder/pieces-selector';
import { InvalidStepIcon } from '@/components/custom/alert-icon';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LoadingSpinner } from '@/components/ui/spinner';
import { Tooltip, TooltipContent } from '@/components/ui/tooltip';
import { UNSAVED_CHANGES_TOAST, useToast } from '@/components/ui/use-toast';
import { flowRunUtils } from '@/features/flow-runs/lib/flow-run-utils';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import { cn } from '@/lib/utils';
import {
  FlowOperationType,
  FlowRun,
  FlowRunStatus,
  FlowVersion,
  TriggerType,
  flowHelper,
  isNil,
} from '@activepieces/shared';

import { StepStatusIcon } from '../../../../features/flow-runs/components/step-status-icon';
import { AP_NODE_SIZE, ApNode, DRAGGED_STEP_TAG } from '../flow-canvas-utils';

function getStepStatus(
  stepName: string | undefined,
  run: FlowRun | null,
  loopIndexes: Record<string, number>,
  flowVersion: FlowVersion,
) {
  if (!run || !stepName || !run.steps) {
    return undefined;
  }
  const stepOutput = flowRunUtils.extractStepOutput(
    stepName,
    loopIndexes,
    run.steps,
    flowVersion.trigger,
  );
  return stepOutput?.status;
}

const StepActionWrapper = React.memo(
  ({ children }: { children: React.ReactNode }) => {
    return (
      <div className="flex items-center gap-2 cursor-pointer">{children}</div>
    );
  },
);
StepActionWrapper.displayName = 'StepActionWrapper';
const ApStepNode = React.memo(({ data }: { data: ApNode['data'] }) => {
  const { toast } = useToast();
  const [
    selectStepByName,
    setAllowCanvasPanning,
    isSelected,
    isDragging,
    selectedStep,
    run,
    readonly,
    exitStepSettings,
    applyOperation,
    removeStepSelection,
    flowVersion,
    loopIndexes,
  ] = useBuilderStateContext((state) => [
    state.selectStepByName,
    state.setAllowCanvasPanning,
    state.selectedStep === data.step?.name,
    state.activeDraggingStep === data.step?.name,
    state.selectedStep,
    state.run,
    state.readonly,
    state.exitStepSettings,
    state.applyOperation,
    state.removeStepSelection,
    state.flowVersion,
    state.loopsIndexes,
  ]);
  const pieceSelectorOperation = useRef<
    FlowOperationType.UPDATE_ACTION | FlowOperationType.UPDATE_TRIGGER
  >(FlowOperationType.UPDATE_ACTION);
  const deleteStep = () => {
    applyOperation(
      {
        type: FlowOperationType.DELETE_ACTION,
        request: {
          name: data.step!.name,
        },
      },
      () => toast(UNSAVED_CHANGES_TOAST),
    );
    removeStepSelection();
  };

  const duplicateStep = () =>
    applyOperation(
      {
        type: FlowOperationType.DUPLICATE_ACTION,
        request: {
          stepName: data.step!.name,
        },
      },
      () => toast(UNSAVED_CHANGES_TOAST),
    );

  const { stepMetadata } = piecesHooks.useStepMetadata({
    step: data.step!,
  });
  const stepIndex = useMemo(() => {
    const steps = flowHelper.getAllSteps(flowVersion.trigger);
    return steps.findIndex((step) => step.name === data.step!.name) + 1;
  }, [data, flowVersion]);

  const [openStepActionsMenu, setOpenStepActionsMenu] = useState(false);
  const [openPieceSelector, setOpenPieceSelector] = useState(false);

  const isTrigger = flowHelper.isTrigger(data.step!.type);
  const isAction = flowHelper.isAction(data.step!.type);
  const isEmptyTriggerSelected =
    selectedStep === 'trigger' && data.step?.type === TriggerType.EMPTY;

  const { attributes, listeners, setNodeRef } = useDraggable({
    id: data.step!.name,
    disabled: isTrigger || readonly,
    data: {
      type: DRAGGED_STEP_TAG,
    },
  });

  const stepOutputStatus = useMemo(() => {
    return getStepStatus(data.step?.name, run, loopIndexes, flowVersion);
  }, [data.step?.name, run, loopIndexes, flowVersion]);
  const showRunningIcon =
    isNil(stepOutputStatus) && run?.status === FlowRunStatus.RUNNING;

  const handleStepClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const { name } = data.step!;
    selectStepByName(name);
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      id={data.step!.name}
      style={{
        height: `${AP_NODE_SIZE.stepNode.height}px`,
        width: `${AP_NODE_SIZE.stepNode.width}px`,
      }}
      className={cn(
        'transition-all border-box rounded-sm  border  border-solid  border-border relative hover:border-primary group',
        {
          'shadow-step-container': !isDragging,
          'border-primary': isSelected,
          'bg-background': !isDragging,
          'border-none': isDragging,
          'shadow-none': isDragging,
        },
      )}
      onClick={(e) => handleStepClick(e)}
      onMouseEnter={() => {
        setAllowCanvasPanning(false);
      }}
      onMouseLeave={() => {
        setAllowCanvasPanning(true);
      }}
      key={data.step?.name}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
    >
      <div
        className="absolute text-accent-foreground text-sm opacity-0 transition-all duration-300 group-hover:opacity-100 "
        style={{
          top: `${AP_NODE_SIZE.stepNode.height / 2 - 12}px`,
          right: `-${AP_NODE_SIZE.stepNode.width / 5}px`,
        }}
      >
        {data.step?.name}
      </div>
      <div
        className={cn(
          'absolute left-0 top-0 pointer-events-none  rounded-sm w-full h-full',
          {
            'border-t-[3px] border-primary border-solid':
              isSelected && !isDragging,
          },
        )}
      ></div>
      <div className="px-3 h-full w-full  overflow-hidden">
        {!isDragging && (
          <PieceSelector
            operation={{
              type: isEmptyTriggerSelected
                ? FlowOperationType.UPDATE_TRIGGER
                : pieceSelectorOperation.current,
              stepName: data.step!.name!,
            }}
            open={openPieceSelector || isEmptyTriggerSelected}
            onOpenChange={(open) => {
              setOpenPieceSelector(open);
              if (open) {
                setOpenStepActionsMenu(false);
              } else if (data.step?.type === TriggerType.EMPTY) {
                exitStepSettings();
              }
            }}
            asChild={true}
          >
            <div
              className="flex h-full w-full"
              onClick={(e) => {
                if (!openPieceSelector) {
                  handleStepClick(e);
                }
              }}
            >
              <div className="flex h-full items-center justify-between gap-3 w-full">
                <div className="flex items-center justify-center min-w-[46px] h-full">
                  <PieceIcon
                    logoUrl={stepMetadata?.logoUrl}
                    displayName={stepMetadata?.displayName}
                    showTooltip={false}
                    size={'lg'}
                  ></PieceIcon>
                </div>
                <div className="grow flex flex-col items-start justify-center min-w-0 w-full">
                  <div className=" flex items-center justify-between min-w-0 w-full">
                    <div className="text-sm truncate grow shrink ">
                      {stepIndex}. {data.step?.displayName}
                    </div>

                    {!readonly && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                      >
                        <DropdownMenu
                          open={openStepActionsMenu}
                          onOpenChange={(open) => {
                            setOpenStepActionsMenu(open);
                          }}
                          modal={true}
                        >
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 size-7 "
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                              }}
                            >
                              <EllipsisVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            className="w-44 absolute"
                            onCloseAutoFocus={(e) => e.preventDefault()}
                          >
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                pieceSelectorOperation.current = isAction
                                  ? FlowOperationType.UPDATE_ACTION
                                  : FlowOperationType.UPDATE_TRIGGER;
                                setOpenStepActionsMenu(false);
                                setOpenPieceSelector(true);
                                selectStepByName(data.step!.name!);
                              }}
                            >
                              <StepActionWrapper>
                                <ArrowRightLeft className=" h-4 w-4 " />
                                <span>Replace</span>
                              </StepActionWrapper>
                            </DropdownMenuItem>

                            {isAction && (
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault();
                                  duplicateStep();
                                  setOpenStepActionsMenu(false);
                                }}
                              >
                                <StepActionWrapper>
                                  <CopyPlus className="h-4 w-4" />
                                  {t('Duplicate')}
                                </StepActionWrapper>
                              </DropdownMenuItem>
                            )}

                            {isAction && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    deleteStep();
                                    setOpenStepActionsMenu(false);
                                    setAllowCanvasPanning(true);
                                  }}
                                >
                                  <StepActionWrapper>
                                    <Trash className="mr-2 h-4 w-4 text-destructive" />
                                    <span className="text-destructive">
                                      Delete
                                    </span>
                                  </StepActionWrapper>
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between w-full items-center">
                    <div className="text-xs truncate text-muted-foreground text-ellipsis overflow-hidden whitespace-nowrap w-full">
                      {stepMetadata?.displayName}
                    </div>
                    <div className="w-4 flex mt-0.5 items-center justify-center">
                      {stepOutputStatus && (
                        <StepStatusIcon
                          status={stepOutputStatus}
                          size="4"
                        ></StepStatusIcon>
                      )}
                      {showRunningIcon && (
                        <LoadingSpinner className="w-4 h-4 text-primary"></LoadingSpinner>
                      )}
                      {!data.step?.valid && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="mr-3">
                              <InvalidStepIcon
                                size={16}
                                viewBox="0 0 16 16"
                                className="stroke-0 animate-fade"
                              ></InvalidStepIcon>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            {t('Incomplete settings')}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </PieceSelector>
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
