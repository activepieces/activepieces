import { t } from 'i18next';
import { RefreshCw } from 'lucide-react';
import { create } from 'zustand';

export const useStepReloadHold = create<{ held: HeldStep | null }>(() => ({
  held: null,
}));

export function StepReloadNotice() {
  return (
    <div
      role="status"
      className="flex shrink-0 items-center gap-2 border-b bg-accent-3 px-4 py-2 text-xs text-gray-12"
    >
      <span className="min-w-0 flex-1">{t('Chat updated this step.')}</span>
      <button
        type="button"
        onClick={release}
        className="inline-flex shrink-0 items-center gap-1 rounded-sm font-medium text-accent-11 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-8"
      >
        <RefreshCw className="size-3" aria-hidden />
        {t('Reload step')}
      </button>
    </div>
  );
}

function hold(next: HeldStep): void {
  const current = useStepReloadHold.getState().held;
  if (current && current.stepName === next.stepName) return;
  useStepReloadHold.setState({ held: next });
}

function releaseIfUnchanged(draftRefreshCount: number): void {
  const current = useStepReloadHold.getState().held;
  if (current && current.draftRefreshCount === draftRefreshCount) release();
}

function release(): void {
  useStepReloadHold.setState({ held: null });
}

export const stepReloadHold = { hold, release, releaseIfUnchanged };

type HeldStep = { stepName: string; draftRefreshCount: number };
