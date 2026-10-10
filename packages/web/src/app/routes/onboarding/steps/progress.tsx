import { cn } from '@/lib/utils';

const STEPS = ['welcome', 'use_case', 'start_point', 'connect_tools'] as const;

export function OnboardingProgress({ current }: { current: string }) {
  const idx = STEPS.indexOf(current as (typeof STEPS)[number]);
  const total = STEPS.length;

  return (
    <div className="flex items-center gap-2 justify-center pt-6">
      {STEPS.map((s, i) => (
        <div
          key={s}
          className={cn(
            'h-1.5 rounded-full transition-all',
            i <= idx ? 'bg-primary w-8' : 'bg-gray-4 w-4',
          )}
        />
      ))}
      <span className="ml-3 text-xs text-gray-11">
        {Math.min(idx + 1, total)} / {total}
      </span>
    </div>
  );
}
