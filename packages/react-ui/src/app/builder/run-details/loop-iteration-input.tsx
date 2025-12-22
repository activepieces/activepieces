import { useMemo, useRef } from 'react';

import { Input } from '@/components/ui/input';
import { FlowActionType, flowStructureUtil, isNil } from '@activepieces/shared';

import { flowRunUtils } from '../../../features/flow-runs/lib/flow-run-utils';
import { useBuilderStateContext } from '../builder-hooks';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { t } from 'i18next';
import { Button } from '@/components/ui/button';
import { CaretDownIcon, CaretUpIcon } from '@radix-ui/react-icons';

const LoopIterationInput = ({ stepName }: { stepName: string }) => {
  const [setLoopIndex, currentIndex, run, flowVersion, loopsIndexes, selectedStep, currentStep] =
    useBuilderStateContext((state) => [
      state.setLoopIndex,
      state.loopsIndexes[stepName] ?? 0,
      state.run,
      state.flowVersion,
      state.loopsIndexes,
      state.selectedStep,
      flowStructureUtil.getStep(stepName, state.flowVersion.trigger),
    ]);
  const stepOutput = useMemo(() => {
    return run && run.steps
      ? flowRunUtils.extractStepOutput(
        stepName,
        loopsIndexes,
        run.steps,
        flowVersion.trigger,
      )
      : null;
  }, [run, stepName, loopsIndexes, flowVersion.trigger]);

  const inputRef = useRef<HTMLInputElement>(null);
  const totalIterations =
    stepOutput &&
      stepOutput.output &&
      stepOutput.type === FlowActionType.LOOP_ON_ITEMS
      ? stepOutput.output.iterations.length
      : 0;

  function onChange(value: string) {
    const parsedValue = Math.max(
      1,
      Math.min(parseInt(value) ?? 1, totalIterations),
    );
    setLoopIndex(stepName, parsedValue - 1);
  }
  const isChildSelected = selectedStep && currentStep && currentStep.name !== selectedStep ? flowStructureUtil.isChildOf(currentStep, selectedStep) : false;

  if (!isChildSelected || isNil(run)) {
    return <></>
  }

  return (
    <div className="absolute -top-4 -left-[45px]">
      <div className='flex items-center justify-center flex-col gap-0.5'>
        <LoopIterationInputButton onChange={onChange} isIncreasing={true} currentIndex={currentIndex} />
        <Tooltip >
          <TooltipTrigger >
            <Input
              ref={inputRef}
              className="py-2 duration-300 w-[35px] px-0 h-[35px] animate-in fade-in bg-background border-border border border-solid rounded-md text-center !text-xs"
              type="number"
              value={currentIndex + 1}
              min={1}
              max={totalIterations}
              onClick={(e) => {
                if (e.button === 0) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
              onChange={(e) => {
                const value = isNil(e.target.value) || e.target.value.length === 0 || e.target.value === 'e' ? '1' : e.target.value;
                onChange(value);
              }}
            />
          </TooltipTrigger>
          <TooltipContent side='left' >
            {t('View outputs of child steps for this iteration')}
          </TooltipContent>
        </Tooltip>
        <LoopIterationInputButton onChange={onChange} isIncreasing={false} currentIndex={currentIndex} />
      </div>
    </div>
  );
};

LoopIterationInput.displayName = 'LoopIterationInput';
export { LoopIterationInput };


const LoopIterationInputButton = ({ onChange, isIncreasing, currentIndex }: { onChange: (val: string) => void, isIncreasing: boolean, currentIndex: number }) => {
  return (
    <Button variant="ghost" onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onChange((currentIndex + (isIncreasing ? 2 : 0)).toString());
    }} className='hover:bg-builder-background size-6' size="icon">
      {isIncreasing ? <CaretUpIcon className='w-2 h-2'></CaretUpIcon> : <CaretDownIcon className='w-2 h-2'></CaretDownIcon>}
    </Button>
  )
}