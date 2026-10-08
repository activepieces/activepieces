import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

import { SettingsPanel } from '@/app/components/admin';
import { cn } from '@/lib/utils';

export const StepShell = ({
  title,
  description,
  actions,
  flush,
  children,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
  flush?: boolean;
  children: ReactNode;
}) => {
  return (
    <SettingsPanel
      title={title}
      description={description}
      action={actions}
      flush={flush}
    >
      {children}
    </SettingsPanel>
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
                  isComplete && 'text-success-11',
                  !isComplete && isActive && 'text-accent-11',
                  !isComplete &&
                    !isActive &&
                    !isLocked &&
                    'text-gray-11 hover:text-accent-11',
                  isLocked && 'text-gray-11 cursor-not-allowed opacity-60',
                )}
              >
                <Icon className="size-5" />
              </button>
              {!isLast && (
                <div
                  className={cn(
                    'w-px flex-1 my-2',
                    isComplete ? 'bg-success-10' : 'bg-gray-6',
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
                isActive && 'font-medium text-gray-12',
                !isActive && !isLocked && 'text-gray-11 hover:text-gray-12',
                isLocked && 'text-gray-11 cursor-not-allowed opacity-60',
              )}
            >
              {`${index + 1}. ${step.title}`}
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
