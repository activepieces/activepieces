import { t } from 'i18next';
import { ArrowRight, CircleCheck, Lightbulb, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useBuilderStateContext } from '@/app/builder/builder-hooks';

type Phase =
  | 'needs_trigger'
  | 'needs_action'
  | 'ready_to_test'
  | 'success'
  | 'dismissed';

const STORAGE_PREFIX = 'synkra:onboarding:nudge';

const PHASE_MESSAGES: Record<
  Exclude<Phase, 'dismissed'>,
  { title: string; body: string }
> = {
  needs_trigger: {
    title: 'Add your first trigger',
    body: 'Click the + button on the canvas to pick what starts this workflow.',
  },
  needs_action: {
    title: 'Add your first action',
    body: 'Click the + button under the trigger to pick what happens next.',
  },
  ready_to_test: {
    title: 'Test your workflow',
    body: 'Click Test to run it once and see the result.',
  },
  success: {
    title: 'Nice work — that ran successfully',
    body: 'Your first workflow has run. Head back to the dashboard when you are ready.',
  },
};

export function BuilderNudge() {
  const { flowId } = useParams<{ flowId: string }>();
  const [flowVersion, run] = useBuilderStateContext((state) => [
    state.flowVersion,
    state.run,
  ]);

  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!flowId) return;
    setDismissed(localStorage.getItem(`${STORAGE_PREFIX}:${flowId}`) === '1');
  }, [flowId]);

  const phase: Phase = useMemo(() => {
    if (dismissed) return 'dismissed';
    if (!flowVersion) return 'needs_trigger';

    const hasTrigger = !!flowVersion.trigger && !!(flowVersion.trigger as { name?: string }).name;
    const actions = (flowVersion.actions ?? []) as unknown[];
    const hasAction = actions.length > 0;

    if (!hasTrigger) return 'needs_trigger';
    if (!hasAction) return 'needs_action';

    if (run?.status === 'SUCCEEDED') return 'success';
    return 'ready_to_test';
  }, [flowVersion, run, dismissed]);

  if (phase === 'dismissed') return null;

  const message = PHASE_MESSAGES[phase];
  const isSuccess = phase === 'success';

  const dismiss = () => {
    if (flowId) {
      localStorage.setItem(`${STORAGE_PREFIX}:${flowId}`, '1');
    }
    setDismissed(true);
  };

  return (
    <div
      className={cn(
        'mx-3 mt-3 rounded-lg border p-3 flex items-start gap-3 shadow-sm',
        isSuccess ? 'border-green-6 bg-green-2' : 'border-primary bg-primary/5',
      )}
    >
      <div
        className={cn(
          'mt-0.5 shrink-0',
          isSuccess ? 'text-green-10' : 'text-primary',
        )}
      >
        {isSuccess ? (
          <CircleCheck className="h-5 w-5" />
        ) : (
          <Lightbulb className="h-5 w-5" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{t(message.title)}</div>
        <div className="text-sm text-gray-11 mt-0.5">{t(message.body)}</div>
        {isSuccess && (
          <div className="mt-2">
            <Link
              to="/automations"
              className="inline-flex items-center text-sm font-medium text-primary hover:underline"
            >
              {t('Back to dashboard')}
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </div>
        )}
      </div>

      <Button
        size="icon"
        variant="ghost"
        className="size-7 shrink-0"
        onClick={dismiss}
        aria-label={t('Dismiss')}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
