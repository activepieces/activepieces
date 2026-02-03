import { t } from 'i18next'; // Import t directly from i18next
import { ChevronLeftIcon, ChevronRightIcon, Pencil } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import EditableText from '@/components/ui/editable-text';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import {
  PieceStepMetadata,
  StepMetadataWithActionOrTriggerOrAgentDisplayName,
} from '@/lib/types';
import {
  FlowActionType,
  FlowTriggerType,
  flowStructureUtil,
  isNil,
} from '@activepieces/shared';

import { useBuilderStateContext } from '../builder-hooks';

interface EditableStepNameProps {
  selectedBranchIndex: number | null;
  displayName: string;
  branchName: string | undefined;
  setDisplayName: (value: string) => void;
  setBranchName: (value: string) => void;
  readonly: boolean;
  isEditingStepOrBranchName: boolean;
  setIsEditingStepOrBranchName: (isEditing: boolean) => void;
  setSelectedBranchIndex: (index: number | null) => void;
  stepMetadata: StepMetadataWithActionOrTriggerOrAgentDisplayName | undefined;
}

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

const EditableStepName: React.FC<EditableStepNameProps> = ({
  selectedBranchIndex,
  displayName,
  branchName,
  setDisplayName,
  setBranchName,
  readonly,
  isEditingStepOrBranchName,
  setIsEditingStepOrBranchName,
  setSelectedBranchIndex,
  stepMetadata,
}) => {
  const isPieceStep =
    stepMetadata?.type === FlowActionType.PIECE ||
    stepMetadata?.type === FlowTriggerType.PIECE;
  const pieceVersion = isPieceStep
    ? (stepMetadata as PieceStepMetadata)?.pieceVersion
    : undefined;

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center gap-1.5 w-full">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="shrink-0">
              <PieceIcon
                logoUrl={stepMetadata?.logoUrl}
                displayName={stepMetadata?.displayName}
                showTooltip={false}
                size="sm"
              />
            </div>
          </TooltipTrigger>
          {stepMetadata && (
            <TooltipContent side="bottom" className="max-w-xs">
              <div className="flex flex-col gap-1">
                <div className="font-medium">
                  {stepMetadata.displayName}
                  {stepMetadata.actionOrTriggerOrAgentDisplayName && (
                    <span className="font-normal">
                      {' > '}
                      {stepMetadata.actionOrTriggerOrAgentDisplayName}
                    </span>
                  )}
                </div>
                {stepMetadata.actionOrTriggerOrAgentDescription && (
                  <div className="text-xs">
                    {stepMetadata.actionOrTriggerOrAgentDescription}
                  </div>
                )}
                {pieceVersion && <div className="text-xs">v{pieceVersion}</div>}
              </div>
            </TooltipContent>
          )}
        </Tooltip>
        <div className="flex items-center gap-1 min-w-0 flex-1 text-sm">
          {isNil(selectedBranchIndex) ? (
            <EditableText
              onValueChange={(value) => {
                if (value) {
                  setDisplayName(value);
                }
              }}
              readonly={readonly}
              value={displayName}
              tooltipContent={readonly ? '' : t('Edit Step Name')}
              isEditing={isEditingStepOrBranchName}
              setIsEditing={setIsEditingStepOrBranchName}
            />
          ) : (
            <>
              <div
                className="truncate cursor-pointer hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedBranchIndex(null);
                }}
              >
                {displayName}
              </div>
              /
              <EditableText
                key={branchName}
                onValueChange={(value) => {
                  if (value) {
                    setBranchName(value);
                  }
                }}
                readonly={readonly}
                value={branchName}
                tooltipContent={readonly ? '' : t('Edit Branch Name')}
                isEditing={isEditingStepOrBranchName}
                setIsEditing={setIsEditingStepOrBranchName}
              />
            </>
          )}
          {!isEditingStepOrBranchName && !readonly && (
            <Pencil
              className="h-3 w-3 shrink-0"
              onClick={() => {
                setIsEditingStepOrBranchName(true);
              }}
            />
          )}
        </div>
        <div className="flex items-center shrink-0">
          <PreviousOrNextButton isNext={false} />
          <PreviousOrNextButton isNext={true} />
        </div>
      </div>
    </div>
  );
};

export default EditableStepName;
