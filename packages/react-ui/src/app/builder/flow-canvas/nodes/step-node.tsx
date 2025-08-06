import { Handle, NodeProps, Position } from '@xyflow/react';
import React, { useMemo } from 'react';

import {
  useBuilderStateContext,
  useStepNodeAttributes,
} from '@/app/builder/builder-hooks';
import { PieceSelector } from '@/app/builder/pieces-selector';
import ImageWithFallback from '@/components/ui/image-with-fallback';
import { stepsHooks } from '@/features/pieces/lib/steps-hooks';
import { StepMetadataWithActionOrTriggerOrAgentDisplayName } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  FlowOperationType,
  Step,
  TRIGGER_NODE_TEST_ID,
  TriggerType,
  flowStructureUtil,
} from '@activepieces/shared';

import { flowUtilConsts } from '../utils/consts';
import { flowCanvasUtils } from '../utils/flow-canvas-utils';
import { ApStepNode } from '../utils/types';

import { StepEllipsesButton } from './step-ellipses-button';
import { ApStepNodeStatus } from './step-node-status';

const getPieceSelectorOperationType = (step: Step) => {
  if (flowStructureUtil.isTrigger(step.type)) {
    return FlowOperationType.UPDATE_TRIGGER;
  }
  return FlowOperationType.UPDATE_ACTION;
};

const ApStepCanvasNode = React.memo(
  ({ data: { step } }: NodeProps & Omit<ApStepNode, 'position'>) => {
    const [
      selectStepByName,
      isSelected,
      isDragging,
      flowVersion,
      setSelectedBranchIndex,
      isPieceSelectorOpened,
      setOpenedPieceSelectorStepNameOrAddButtonId,
    ] = useBuilderStateContext((state) => [
      state.selectStepByName,
      state.selectedStep === step.name,
      state.activeDraggingStep === step.name,
      state.flowVersion,
      state.setSelectedBranchIndex,
      state.openedPieceSelectorStepNameOrAddButtonId === step.name,
      state.setOpenedPieceSelectorStepNameOrAddButtonId,
    ]);
    const { stepMetadata } = stepsHooks.useStepMetadata({
      step,
    });
    const stepIndex = useMemo(() => {
      const steps = flowStructureUtil.getAllSteps(flowVersion.trigger);
      return steps.findIndex((s) => s.name === step.name) + 1;
    }, [step, flowVersion]);
    const isTrigger = flowStructureUtil.isTrigger(step.type);
    const isSkipped = flowCanvasUtils.isSkipped(step.name, flowVersion.trigger);
    const isRoundedStep = flowCanvasUtils.isRoundedNode(step.type);

    const stepNodeAttributes = useStepNodeAttributes(step);
    const handleStepClick = (
      e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    ) => {
      selectStepByName(step.name);
      setSelectedBranchIndex(null);
      if (step.type === TriggerType.EMPTY) {
        setOpenedPieceSelectorStepNameOrAddButtonId(step.name);
      }
      e.preventDefault();
      e.stopPropagation();
    };
    return (
      <div
        key={step.name}
        {...stepNodeAttributes}
        className=" group transition-all duration-150 ease-in"
      >
        <div className="relative h-full w-full cursor-default">
          {!isDragging && (
            <PieceSelector
              operation={{
                type: getPieceSelectorOperationType(step),
                stepName: step.name,
              }}
              id={step.name}
              openSelectorOnClick={false}
              stepToReplacePieceDisplayName={stepMetadata?.displayName}
            >
              <div>
                <StepNodeBackgroundBlur isSelected={isSelected} />
                <DisplayedText
                  stepIndex={stepIndex}
                  step={step}
                  stepMetadata={stepMetadata}
                  handleStepClick={handleStepClick}
                />

                <div
                  data-testid={
                    step.name === 'trigger' ? TRIGGER_NODE_TEST_ID : ''
                  }
                  className={cn(
                    'items-center relative transition-all group-hover:-top-[2px] cursor-pointer left-0  top-0 justify-center h-full w-full gap-3',
                    {},
                  )}
                  onClick={(e) => {
                    if (!isPieceSelectorOpened) {
                      handleStepClick(e);
                    }
                  }}
                >
                  <div
                    className={cn(
                      'bg-white flex items-center justify-center rounded-lg shadow-step-node group-hover:shadow-hovered-step-node dark:group-hover:shadow-dark-hovered-step-node  transition-all ease-in',
                      {
                        'shadow-trigger-node border-slate-400':
                          isTrigger && !isSelected,
                        'rounded-full': isRoundedStep,
                        'bg-accent': isSkipped,
                        'shadow-selected-step-node dark:border dark:border-primary dark:shadow-selected-step-node-dark group-hover:shadow-selected-step-node dark:group-hover:shadow-selected-step-node-dark':
                          isSelected,
                      },
                    )}
                    style={{
                      height: `${flowUtilConsts.AP_NODE_SIZE.STEP.height}px`,
                      width: `${flowUtilConsts.AP_NODE_SIZE.STEP.width}px`,
                      maxWidth: `${flowUtilConsts.AP_NODE_SIZE.STEP.width}px`,
                    }}
                  >
                    <div className="relative">
                      <StepEllipsesButton
                        stepName={step.name}
                        type={step.type}
                      />
                      <StepNodeImage
                        isRoundedStep={isRoundedStep}
                        isSkipped={isSkipped}
                        stepMetadata={stepMetadata}
                        step={step}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </PieceSelector>
          )}

          <Handle
            type="source"
            style={flowUtilConsts.HANDLE_STYLING}
            position={Position.Bottom}
          />
          <Handle
            type="target"
            style={flowUtilConsts.HANDLE_STYLING}
            position={Position.Top}
          />
        </div>
      </div>
    );
  },
);

const DisplayedText = ({
  stepIndex,
  step,
  stepMetadata,
  handleStepClick,
}: {
  stepIndex: number;
  step: Step;
  stepMetadata?: StepMetadataWithActionOrTriggerOrAgentDisplayName;
  handleStepClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}) => {
  return (
    <div
      className="absolute left-[65px] pl-[14px] flex flex-col gap-1 text-sm  !cursor-pointer z-10"
      onClick={handleStepClick}
      style={{
        maxWidth: `${flowUtilConsts.STEP_DISPLAY_META_WIDTH}px`,
        // 18px is the height of the text
        top: `calc(50% - 18px)`,
      }}
    >
      <div className="truncate grow shrink bg-flow-bg/50">
        {stepIndex}. {step.displayName}
      </div>
      <div className="text-muted-foreground break-keep text-nowrap truncate grow shrink bg-flow-bg/50">
        {stepMetadata?.displayName}
      </div>
    </div>
  );
};

const StepNodeBackgroundBlur = ({ isSelected }: { isSelected: boolean }) => {
  return (
    <div
      style={{
        height: `${flowUtilConsts.AP_NODE_SIZE.STEP.height}px`,
        width: `${flowUtilConsts.AP_NODE_SIZE.STEP.width}px`,
        maxWidth: `${flowUtilConsts.AP_NODE_SIZE.STEP.width}px`,
      }}
      className={cn(
        'opacity-0 transition-all absolute left-0 top-0 rounded-md',
        {
          'opacity-100': isSelected,
        },
      )}
    ></div>
  );
};

const StepNodeImage = ({
  isRoundedStep,
  isSkipped,
  stepMetadata,
  step,
}: {
  isRoundedStep: boolean;
  isSkipped: boolean;
  stepMetadata?: StepMetadataWithActionOrTriggerOrAgentDisplayName;
  step: Step;
}) => {
  return (
    <div
      className={cn(
        'transition-all relative flex justify-center items-center size-[60px] m-0.5 bg-white  rounded-md  ',
        {
          'rounded-full': isRoundedStep,
          'bg-accent dark:bg-gray-300': isSkipped,
        },
      )}
    >
      <ImageWithFallback
        src={stepMetadata?.logoUrl}
        alt={stepMetadata?.displayName}
        className={cn(
          'size-[52px] min-w-[52px] min-h-[52px] bg-white rounded-sm object-contain',
          {
            'rounded-full': isRoundedStep,
            'bg-accent dark:bg-gray-300': isSkipped,
          },
        )}
      />
      <div
        className={cn('absolute bottom-[2px] right-[2px]', {
          'right-[3px] bottom-[3px]': isRoundedStep,
        })}
      >
        <ApStepNodeStatus stepName={step.name} isStepRounded={isRoundedStep} />
      </div>
    </div>
  );
};
ApStepCanvasNode.displayName = 'ApStepCanvasNode';
export { ApStepCanvasNode };
