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

import {
  StepPathWithName,
  builderSelectors,
  useBuilderStateContext,
} from '@/app/builder/builder-hooks';
import { PieceSelector } from '@/app/builder/pieces-selector';
import ImageWithFallback from '@/app/components/image-with-fallback';
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
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import { cn } from '@/lib/utils';
import {
  FlowOperationType,
  FlowRun,
  FlowRunStatus,
  TriggerType,
  flowHelper,
  isNil,
} from '@activepieces/shared';

import { AP_NODE_SIZE, ApNode, DRAGGED_STEP_TAG } from '../flow-canvas-utils';

function getStepStatus(
  stepName: string | undefined,
  selectedStep: StepPathWithName | null,
  run: FlowRun | null,
) {
  if (!run || !stepName) {
    return undefined;
  }
  const state = builderSelectors.getStepOutputFromExecutionPath({
    selectedPath: selectedStep,
    stepName,
    executionState: run,
  });
  return state?.status;
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
  ] = useBuilderStateContext((state) => [
    state.selectStepByName,
    state.setAllowCanvasPanning,
    state.selectedStep?.stepName === data.step?.name,
    state.activeDraggingStep === data.step?.name,
    state.selectedStep,
    state.run,
    state.readonly,
    state.exitStepSettings,
  ]);
  const pieceSelectorOperation = useRef<
    FlowOperationType.UPDATE_ACTION | FlowOperationType.UPDATE_TRIGGER
  >(FlowOperationType.UPDATE_ACTION);
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

  const [openStepActionsMenu, setOpenStepActionsMenu] = useState(false);
  const [openPieceSelector, setOpenPieceSelector] = useState(false);

  const isTrigger = flowHelper.isTrigger(data.step!.type);
  const isAction = flowHelper.isAction(data.step!.type);
  const isEmptyTriggerSelected =
    selectedStep?.stepName === 'trigger' &&
    data.step?.type === TriggerType.EMPTY;

  const { attributes, listeners, setNodeRef } = useDraggable({
    id: data.step!.name,
    disabled: isTrigger || readonly,
    data: {
      type: DRAGGED_STEP_TAG,
    },
  });

  const stepOutputStatus = useMemo(
    () => getStepStatus(data.step?.name, selectedStep, run),
    [data.step?.name, selectedStep, run],
  );

  const showRunningIcon =
    isNil(stepOutputStatus) && run?.status === FlowRunStatus.RUNNING;
  const statusInfo = isNil(stepOutputStatus)
    ? undefined
    : flowRunUtils.getStatusIconForStep(stepOutputStatus);

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
        'transition-all border-box border rounded-sm border border-solid  border-border-300 relative hover:border-primary group',
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
              type: pieceSelectorOperation.current,
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
                  <ImageWithFallback
                    width={40}
                    height={40}
                    src={stepMetadata?.logoUrl}
                    alt={stepMetadata?.displayName}
                  />
                </div>
                <div className="grow flex flex-col items-start justify-center min-w-0 w-full">
                  <div className=" flex items-center justify-between min-w-0 w-full">
                    <div className="text-sm truncate grow shrink ">
                      {data.step?.displayName}
                    </div>

                    {!readonly && (
                      <div onClick={(e) => e.stopPropagation()} className=" ">
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
                    <div className="w-7 flex items-center justify-center">
                      {statusInfo &&
                        React.createElement(statusInfo.Icon, {
                          className: cn('', {
                            'text-success-300':
                              statusInfo.variant === 'success',
                            'text-destructive-300':
                              statusInfo.variant === 'error',
                          }),
                        })}
                      {showRunningIcon && (
                        <LoadingSpinner className="w-4 h-4 text-primary"></LoadingSpinner>
                      )}
                      {!data.step?.valid && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="mx-2">
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
