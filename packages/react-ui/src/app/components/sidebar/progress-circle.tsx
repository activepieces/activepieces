import { onboardingHooks } from '@/hooks/onboarding-hooks';
import { cn } from '@/lib/utils';
import { OnboardingStep } from '@activepieces/ee-shared';

type OnboardingProgressCircleProps = {
  hideIfCompleted?: boolean;
};

export function OnboardingProgressCircle({
  hideIfCompleted = false,
}: OnboardingProgressCircleProps) {
  const { data: onboardingStatus, isLoading } = onboardingHooks.useOnboarding();

  if (isLoading || !onboardingStatus) {
    return null;
  }

  const completedCount = Object.values(onboardingStatus).filter(Boolean).length;
  const totalSteps = Object.keys(OnboardingStep).length;
  const isCompleted = completedCount === totalSteps;

  if (hideIfCompleted && isCompleted) {
    return null;
  }

  const colorClass = isCompleted ? 'stroke-green-500' : 'stroke-[#6e41e2]';
  const bgColorClass = isCompleted ? 'bg-green-100' : 'bg-[#EFECFF]';
  const textColorClass = isCompleted ? 'text-green-700' : 'text-[#6e41e2]';
  const circleBgClass = isCompleted
    ? 'stroke-green-500/20'
    : 'stroke-[#6e41e2]/20';

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-1.5 py-0.5 rounded-md whitespace-nowrap',
        bgColorClass,
        textColorClass,
      )}
    >
      <svg className="w-3 h-3 transform -rotate-90" viewBox="0 0 12 12">
        <circle
          cx="6"
          cy="6"
          r="5"
          className={cn(circleBgClass)}
          strokeWidth="2"
          fill="none"
        />
        <circle
          cx="6"
          cy="6"
          r="5"
          className={cn(colorClass, 'transition-all duration-500 ease-in-out')}
          strokeWidth="2"
          fill="none"
          strokeDasharray={31.4}
          strokeDashoffset={31.4 - (31.4 * completedCount) / totalSteps}
          strokeLinecap="round"
        />
      </svg>
      <span className="text-xs font-bold leading-none">
        {completedCount}/{totalSteps}
      </span>
    </div>
  );
}
