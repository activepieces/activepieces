import { t } from 'i18next';
import {
  ChevronLeftIcon,
  ChevronRight,
  ChevronRightIcon,
  Info,
} from 'lucide-react';
import React from 'react';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { stepsHooks } from '@/features/pieces/lib/steps-hooks';
import { PieceStepMetadata } from '@/lib/types';
import {
  FlowAction,
  FlowActionType,
  isNil,
  FlowTrigger,
  FlowTriggerType,
  flowStructureUtil,
} from '@activepieces/shared';

import { useBuilderStateContext } from '../builder-hooks';

type StepInfoProps = {
  step: FlowAction | FlowTrigger;
};

const StepInfo: React.FC<StepInfoProps> = ({ step }) => {
  const { stepMetadata } = stepsHooks.useStepMetadata({
    step,
  });

  const isPiece =
    stepMetadata?.type === FlowActionType.PIECE ||
    stepMetadata?.type === FlowTriggerType.PIECE;
  const pieceVersion = isPiece
    ? (stepMetadata as PieceStepMetadata)?.pieceVersion
    : undefined;
  const actionOrTriggerDisplayName =
    stepMetadata?.actionOrTriggerOrAgentDisplayName;

  return (
    <div className="flex items-center justify-between gap-1">
      <PreviousOrNextButton isNext={false} />
      <div className="flex grow items-center justify-between gap-3 min-h-[36px]">
        <div className="flex items-center gap-2 min-w-0">
          <PieceIcon
            logoUrl={stepMetadata?.logoUrl}
            displayName={stepMetadata?.displayName}
            showTooltip={false}
            size="md"
          />
          <div className="flex items-center gap-0.5 min-w-0 text-sm">
            {!isNil(stepMetadata?.displayName) ? (
              <>
                <span
                  className={
                    !actionOrTriggerDisplayName
                      ? 'text-foreground font-medium'
                      : 'text-muted-foreground'
                  }
                >
                  {stepMetadata.displayName}
                </span>
                {actionOrTriggerDisplayName && (
                  <>
                    <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                    <TextWithTooltip
                      tooltipMessage={actionOrTriggerDisplayName}
                    >
                      <span className="font-medium text-foreground">
                        {actionOrTriggerDisplayName}
                      </span>
                    </TextWithTooltip>
                  </>
                )}
              </>
            ) : (
              <Skeleton className="h-4 w-32 rounded" />
            )}
          </div>
          {!isNil(stepMetadata?.actionOrTriggerOrAgentDescription) &&
            stepMetadata.actionOrTriggerOrAgentDescription.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="size-4 text-muted-foreground shrink-0 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  {stepMetadata.actionOrTriggerOrAgentDescription}
                </TooltipContent>
              </Tooltip>
            )}
        </div>
        {pieceVersion && (
          <div className="text-xs text-muted-foreground shrink-0">
            v{pieceVersion}
          </div>
        )}
      </div>
      <PreviousOrNextButton isNext={true} />
    </div>
  );
};

export { StepInfo };
const PreviousOrNextButton = ({ isNext }: { isNext: boolean }) => {
  const [selectedStep, setSelectedStep, flowVersion] = useBuilderStateContext(
    (state) => [state.selectedStep, state.selectStepByName, state.flowVersion],
  );
  const allSteps = flowStructureUtil.getAllSteps(flowVersion.trigger);
  const currentStepIndex = allSteps.findIndex(
    (step) => step.name === selectedStep,
  );
  const nextStep = allSteps.at(currentStepIndex + 1);
  const previousStep =
    currentStepIndex > 0 ? allSteps.at(currentStepIndex - 1) : undefined;
  const isDisabled = (!isNext && !previousStep) || (isNext && !nextStep);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          disabled={(!isNext && !previousStep) || (isNext && !nextStep)}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isNext && nextStep) {
              setSelectedStep(nextStep.name);
            } else if (!isNext && previousStep) {
              setSelectedStep(previousStep.name);
            }
          }}
          size="icon"
          className="size-7"
        >
          {isNext ? (
            <ChevronRightIcon className="size-4"></ChevronRightIcon>
          ) : (
            <ChevronLeftIcon className="size-4"></ChevronLeftIcon>
          )}
        </Button>
      </TooltipTrigger>
      {!isDisabled && (
        <TooltipContent side="bottom">
          {isNext ? t('Next step') : t('Previous step')}
        </TooltipContent>
      )}
    </Tooltip>
  );
};
