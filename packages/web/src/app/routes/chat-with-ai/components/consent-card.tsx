import {
  ActionPreviewEvent,
  ConsentEffectPreview,
  ConsentPreview,
} from '@activepieces/shared';
import { t } from 'i18next';
import { AlertTriangle, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { InteractiveCardShell } from './interactive-card-shell';

export function ConsentCard({
  preview,
  consent,
  onRun,
  onCancel,
  onDismiss,
}: {
  preview: ActionPreviewEvent;
  consent: ConsentPreview;
  onRun: () => void;
  onCancel: () => void;
  onDismiss: () => void;
}) {
  const destructive = consent.severity === 'destructive';
  return (
    <InteractiveCardShell
      onDismiss={onDismiss}
      title={
        <div
          role="alertdialog"
          aria-labelledby={`consent-${preview.toolCallId}-title`}
          aria-describedby={`consent-${preview.toolCallId}-effects`}
        >
          <h3
            id={`consent-${preview.toolCallId}-title`}
            className="text-base font-semibold leading-snug text-foreground flex items-start gap-2"
          >
            {destructive && (
              <AlertTriangle className="size-4 mt-0.5 shrink-0 text-destructive" />
            )}
            <span>{consentTitle(consent)}</span>
          </h3>
          <p
            className={cn('mt-1 text-sm', {
              'font-medium text-destructive': destructive,
              'text-muted-foreground': !destructive,
            })}
          >
            {consentSubtitle(consent)}
          </p>
        </div>
      }
    >
      {consent.effects.length > 0 && (
        <div
          id={`consent-${preview.toolCallId}-effects`}
          className="mb-3 rounded-lg border bg-muted/20 divide-y overflow-hidden"
        >
          {consent.effects.map((effect, index) => (
            <EffectRow key={`${effect.displayName}-${index}`} effect={effect} />
          ))}
        </div>
      )}
      {consent.reusable && (
        <p className="mb-3 text-xs text-muted-foreground">
          {t(
            'Approving also covers repeats of this exact action in this conversation, as long as it keeps doing the same things to the same recipients.',
          )}
        </p>
      )}
      <div className="flex items-center gap-2 pt-3 border-t">
        <Button
          size="sm"
          variant={destructive ? 'destructive' : 'default'}
          onClick={onRun}
          className="gap-1.5"
          type="button"
          autoFocus={!destructive}
        >
          <Check className="size-3.5" />
          {confirmLabel(consent)}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          type="button"
          autoFocus={destructive}
        >
          {t("Don't run it")}
        </Button>
      </div>
    </InteractiveCardShell>
  );
}

function EffectRow({ effect }: { effect: ConsentEffectPreview }) {
  return (
    <div className="px-3 py-2">
      <div className="flex items-baseline gap-2 min-w-0">
        <span className="text-sm font-medium text-foreground truncate">
          {effect.displayName}
        </span>
        <span className="text-xs text-muted-foreground truncate">
          {effect.detail}
        </span>
      </div>
      <p className="text-xs text-foreground/80">{effectPhrase(effect.kind)}</p>
      {effect.recipientResolved && effect.recipient ? (
        <p className="text-xs text-muted-foreground font-mono truncate">
          {t('To: {recipient}', { recipient: effect.recipient })}
        </p>
      ) : (
        effect.kind === 'outward_send' && (
          <p className="text-xs text-muted-foreground">
            {t('To: whoever the incoming data names — not known until it runs')}
          </p>
        )
      )}
    </div>
  );
}

function effectPhrase(kind: string): string {
  switch (kind) {
    case 'outward_send':
      return t('Sends a real message to someone');
    case 'external_write':
      return t('Changes data in a connected app');
    case 'destructive':
      return t('Permanently deletes data');
    case 'internal_destructive':
      return t("Deletes data in your workspace — this can't be undone");
    case 'financial':
      return t('Moves money');
    case 'input_dependent':
      return t("Does whatever it is handed — we can't tell before it runs");
    default:
      return t('Does something we could not identify');
  }
}

function consentTitle(consent: ConsentPreview): string {
  const flowName = consent.flowName ?? t('this automation');
  switch (consent.category) {
    case 'live_test':
      return t('Run a live test of "{flowName}"?', { flowName });
    case 'step_test':
      return t('Run this step for real in "{flowName}"?', { flowName });
    case 'retry_run':
      return t('Re-run a real run of "{flowName}"?', { flowName });
    case 'run_code':
      return t('Run code that can reach outside?');
    case 'publish':
      return t('Publish "{flowName}" and switch it on?', { flowName });
    case 'enable':
      return t('Switch "{flowName}" on?', { flowName });
    case 'delete_flow':
      return consent.targetName
        ? t('Delete the automation "{name}"?', { name: consent.targetName })
        : t('Delete this automation?');
    case 'delete_table':
      return consent.targetName
        ? t('Delete the table "{name}" and everything in it?', {
            name: consent.targetName,
          })
        : t('Delete this table and everything in it?');
    case 'delete_records':
      return t(
        '{count, plural, =0 {Delete records?} =1 {Delete 1 record?} other {Delete # records?}}',
        { count: consent.recordCount ?? 0 },
      );
    case 'delete_column':
      return t('Delete this table column and every value in it?');
    case 'connector_action':
      return t('Use "{name}"?', { name: consent.targetName ?? '' });
    default:
      return t('Run this tool?');
  }
}

function consentSubtitle(consent: ConsentPreview): string {
  if (consent.severity === 'destructive') {
    return t("This can't be undone.");
  }
  if (!consent.resolved) {
    return t("We couldn't work out what this will touch, so we're asking.");
  }
  switch (consent.category) {
    case 'live_test':
    case 'step_test':
    case 'retry_run':
      return t(
        '{count, plural, =1 {This runs for real — 1 step has an effect outside your workspace.} other {This runs for real — # steps have effects outside your workspace.}}',
        { count: consent.effects.length },
      );
    case 'publish':
    case 'enable':
      return t(
        'Once on, it acts on its own every time its trigger fires — no one is asked again.',
      );
    case 'run_code':
      return t(
        "This code can reach other systems, so we can't tell what it does before it runs.",
      );
    case 'connector_action':
      return t('This changes data in a connected app.');
    default:
      return t('This has effects outside your workspace.');
  }
}

function confirmLabel(consent: ConsentPreview): string {
  switch (consent.category) {
    case 'live_test':
      return t('Run the live test');
    case 'step_test':
      return t('Run the step');
    case 'retry_run':
      return t('Re-run it');
    case 'run_code':
      return t('Run the code');
    case 'publish':
    case 'enable':
      return t('Switch it on');
    case 'delete_flow':
    case 'delete_table':
    case 'delete_column':
      return t('Delete it');
    case 'delete_records':
      return t(
        '{count, plural, =0 {Delete them} =1 {Delete 1 record} other {Delete # records}}',
        { count: consent.recordCount ?? 0 },
      );
    default:
      return t('Run it');
  }
}
