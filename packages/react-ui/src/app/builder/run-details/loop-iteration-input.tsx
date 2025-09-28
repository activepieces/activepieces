import { t } from 'i18next';
import { useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { FlowActionType, isNil } from '@activepieces/shared';

import { flowRunUtils } from '../../../features/flow-runs/lib/flow-run-utils';
import { useBuilderStateContext } from '../builder-hooks';

const LoopIterationInput = ({ stepName }: { stepName: string }) => {
  const [setLoopIndex, currentIndex, run, flowVersion, loopsIndexes] =
    useBuilderStateContext((state) => [
      state.setLoopIndex,
      state.loopsIndexes[stepName] ?? 0,
      state.run,
      state.flowVersion,
      state.loopsIndexes,
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
  const [isFocused, setIsFocused] = useState(false);
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

  function removeFocus() {
    setIsFocused(false);
    if (inputRef.current) {
      inputRef.current.blur();
    }
    if (!isNil(inputRef.current) && inputRef.current.value.length === 0) {
      setLoopIndex(stepName, 0);
    }
  }

  return (
    <>
      {!isFocused && (
        <div className="text-sm duration-300 animate-fade">
          {t('Iteration')}
        </div>
      )}
      <div
        dir="rtl"
        className=" transition-all duration-300 ease-expand-out relative"
        onClick={(e) => {
          e.stopPropagation();
        }}
        style={{
          width: isFocused
            ? '100%'
            : (inputRef.current?.value.length || 1) * 2.6 + 1 + 'ch',
          minWidth: isFocused ? '100px' : undefined,
        }}
      >
        <div
          className={cn(
            'absolute right-3 opacity-0 hidden pointer-events-none  gap-2 justify-center items-center h-full text-sm text-muted-foreground transition-all duration-300',
            {
              flex: isFocused,
              'opacity-100': isFocused,
            },
          )}
          dir="ltr"
        >
          <div className="pointer-events-none">/{totalIterations}</div>
          <Button
            variant="transparent"
            className="p-1 text-xs rounded-xs h-auto pointer-events-auto "
            onClick={(e) => {
              inputRef.current?.blur();
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            {t('Done')}
          </Button>
        </div>
        <Input
          dir="ltr"
          ref={inputRef}
          className="h-7 flex-grow-0  transition-all duration-300 ease-expand-out text-center focus:text-start rounded-sm  focus:w-full p-1"
          style={{
            width: isFocused
              ? '100%'
              : (inputRef.current?.value.length || 1) * 2.6 + 1 + 'ch',
          }}
          value={currentIndex + 1}
          type="number"
          min={1}
          max={totalIterations}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onChange(e as unknown as React.ChangeEvent<HTMLInputElement>);
              removeFocus();
            }
            if (e.key === 'Escape') {
              removeFocus();
            }
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        />
      </div>
    </>
  );
};

LoopIterationInput.displayName = 'LoopIterationInput';
export { LoopIterationInput };
