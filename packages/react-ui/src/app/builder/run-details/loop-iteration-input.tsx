import { useMemo, useRef } from 'react';

import { Input } from '@/components/ui/input';
import { FlowActionType, flowStructureUtil } from '@activepieces/shared';

import { flowRunUtils } from '../../../features/flow-runs/lib/flow-run-utils';
import { useBuilderStateContext } from '../builder-hooks';

const LoopIterationInput = ({ stepName }: { stepName: string }) => {
  const [setLoopIndex, currentIndex, run, flowVersion, loopsIndexes, selectedStep,currentStep] =
    useBuilderStateContext((state) => [
      state.setLoopIndex,
      state.loopsIndexes[stepName] ?? 0,
      state.run,
      state.flowVersion,
      state.loopsIndexes,
      state.selectedStep,
      flowStructureUtil.getStepOrThrow(stepName, state.flowVersion.trigger),
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

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value ?? '1';
    const parsedValue = Math.max(
      1,
      Math.min(parseInt(value) ?? 1, totalIterations),
    );
    setLoopIndex(stepName, parsedValue - 1);
  }
  const isChildSelected = selectedStep && currentStep ? flowStructureUtil.isChildOf(currentStep, selectedStep) : false;

  if(totalIterations === 0 || !isChildSelected) {
    return <></>
  }

  return (
    <Input
    ref={inputRef}
    className="py-2 duration-300 min-w-[40px] w-[40px] max-w-[70px] h-[40px] animate-in fade-in absolute  top-2 -left-[50px]  bg-background border-border border border-solid rounded-md text-center text-sm "
    value={currentIndex + 1}

    type="number"
    min={1}
    max={totalIterations}
    onClick={(e) => {
      if(e.button === 0) {
        e.preventDefault();
        e.stopPropagation();
      }
    }}
    onChange={onChange}
  />
  );
};

LoopIterationInput.displayName = 'LoopIterationInput';
export { LoopIterationInput };
