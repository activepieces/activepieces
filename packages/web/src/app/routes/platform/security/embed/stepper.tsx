import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export const StepShell = ({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) => {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-medium">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      {children}
    </div>
  );
};

export const Stepper = ({
  steps,
  completion,
  activeStepIndex,
  displayedIndex,
  onStepClick,
}: {
  steps: StepDef[];
  completion: boolean[];
  activeStepIndex: number;
  displayedIndex: number;
  onStepClick: (index: number) => void;
}) => {
  return (
    <ol className="flex flex-col">
      {steps.map((step, index) => {
        const isComplete = completion[index];
        const isActive = index === displayedIndex;
        const isLocked = index > activeStepIndex;
        const isLast = index === steps.length - 1;
        const Icon = step.icon;
        return (
          <li key={step.kind} className="flex gap-3">
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => onStepClick(index)}
                disabled={isLocked}
                aria-current={isActive ? 'step' : undefined}
                className={cn(
                  'flex size-8 items-center justify-center transition-colors',
                  isComplete && 'text-success-600',
                  !isComplete && isActive && 'text-primary',
                  !isComplete &&
                    !isActive &&
                    !isLocked &&
                    'text-muted-foreground hover:text-primary',
                  isLocked &&
                    'text-muted-foreground cursor-not-allowed opacity-60',
                )}
              >
                <Icon className="size-5" />
              </button>
              {!isLast && (
                <div
                  className={cn(
                    'w-px flex-1 my-2',
                    isComplete ? 'bg-success-600' : 'bg-border',
                  )}
                />
              )}
            </div>
            <button
              type="button"
              onClick={() => onStepClick(index)}
              disabled={isLocked}
              className={cn(
                'flex-1 text-left pt-1.5 pb-12 text-sm transition-colors',
                isActive && 'font-medium text-foreground',
                !isActive &&
                  !isLocked &&
                  'text-muted-foreground hover:text-foreground',
                isLocked &&
                  'text-muted-foreground cursor-not-allowed opacity-60',
              )}
            >
              <span className="mr-1">{index + 1}.</span>
              {step.title}
            </button>
          </li>
        );
      })}
    </ol>
  );
};

export type StepKind = 'hostname' | 'dns' | 'allowed-domains' | 'signing-keys';

export type StepDef = {
  kind: StepKind;
  title: string;
  icon: LucideIcon;
};
