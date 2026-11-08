import { t } from 'i18next';
import { RefreshCw } from 'lucide-react';
import { create } from 'zustand';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { Button } from '@/components/ui/button';

export const useStepReloadHold = create<{
  held: HeldStep | null;
  dirtyStep: string | null;
}>(() => ({
  held: null,
  dirtyStep: null,
}));

export function StepReloadNotice({ stepName }: { stepName: string }) {
  const [hasParkedEdit, saveParkedEdit, dropParkedEdit] =
    useBuilderStateContext((state) => [
      state.hasParkedEdit(stepName),
      state.saveParkedEdit,
      state.dropParkedEdit,
    ]);
  return (
    <div
      role="status"
      className="flex shrink-0 items-center gap-3 border-b bg-accent-3 px-4 py-2 text-xs text-gray-12"
    >
      <span className="min-w-0 flex-1">
        {hasParkedEdit
          ? t('Chat updated this step while you were editing it.')
          : t('Chat updated this step.')}
      </span>
      {hasParkedEdit && (
        <Button
          variant="link"
          size="xs"
          onClick={() => {
            saveParkedEdit(stepName)
              .then(release)
              .catch(() => undefined);
          }}
          className="h-auto font-medium text-gray-11 underline-offset-2 hover:text-gray-12"
        >
          {t('Keep my changes')}
        </Button>
      )}
      <Button
        variant="link"
        size="xs"
        onClick={() => {
          dropParkedEdit(stepName);
          release();
        }}
        className="h-auto font-medium underline-offset-2"
      >
        <RefreshCw className="size-3" aria-hidden />
        {t('Reload step')}
      </Button>
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

function markDirty({
  stepName,
  dirty,
}: {
  stepName: string;
  dirty: boolean;
}): void {
  const current = useStepReloadHold.getState().dirtyStep;
  if (dirty && current !== stepName) {
    useStepReloadHold.setState({ dirtyStep: stepName });
  }
  if (!dirty && current === stepName) {
    useStepReloadHold.setState({ dirtyStep: null });
  }
}

function isDirty(stepName: string): boolean {
  return useStepReloadHold.getState().dirtyStep === stepName;
}

export const stepReloadHold = {
  hold,
  release,
  releaseIfUnchanged,
  markDirty,
  isDirty,
};

type HeldStep = { stepName: string; draftRefreshCount: number };
