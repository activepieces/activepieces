import {
  FlowTriggerType,
  flowStructureUtil,
  isNil,
} from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo } from 'react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const StepNavigationButtons = () => {
  const [selectedStep, flowVersion, selectStepByName] = useBuilderStateContext(
    (state) => [state.selectedStep, state.flowVersion, state.selectStepByName],
  );

  const orderedSteps = useMemo(
    () => flowStructureUtil.getAllSteps(flowVersion.trigger),
    [flowVersion.trigger],
  );

  const currentIndex = useMemo(() => {
    if (isNil(selectedStep)) return -1;
    return orderedSteps.findIndex((step) => step.name === selectedStep);
  }, [selectedStep, orderedSteps]);

  if (currentIndex === -1) {
    return null;
  }

  const prevStep = currentIndex > 0 ? orderedSteps[currentIndex - 1] : null;
  const nextStep =
    currentIndex < orderedSteps.length - 1
      ? orderedSteps[currentIndex + 1]
      : null;

  const prevDisabled = isNil(prevStep) || isEmptyStep(prevStep.type);
  const nextDisabled = isNil(nextStep) || isEmptyStep(nextStep.type);

  return (
    <TooltipProvider>
      <div className="flex items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={prevDisabled}
              onClick={() =>
                !prevDisabled && prevStep && selectStepByName(prevStep.name)
              }
              aria-label={t('Previous step')}
            >
              <ChevronLeft className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{t('Previous step')}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={nextDisabled}
              onClick={() =>
                !nextDisabled && nextStep && selectStepByName(nextStep.name)
              }
              aria-label={t('Next step')}
            >
              <ChevronRight className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{t('Next step')}</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

const isEmptyStep = (type: string) => type === FlowTriggerType.EMPTY;

StepNavigationButtons.displayName = 'StepNavigationButtons';
export { StepNavigationButtons };
