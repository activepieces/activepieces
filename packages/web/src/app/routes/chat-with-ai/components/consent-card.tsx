import {
  ActionPreviewEvent,
  ConsentEffectPreview,
  ConsentPreview,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  Banknote,
  CircleHelp,
  Eye,
  LucideIcon,
  PenLine,
  Repeat,
  Send,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import { KeyboardEvent } from 'react';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import {
  ConsentTone,
  ConsentWarning,
  consentPresentation,
} from '../lib/consent-presentation';

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
  const tone = consentPresentation.tone({ consent });
  const warnings = consentPresentation.warnings({ consent });
  const effects = consentPresentation.orderedEffects({
    effects: consent.effects,
  });
  const statedWarnings = warnings.filter(
    (warning) => warning !== 'unpredictable' || tone !== 'unknown',
  );
  const titleId = `consent-${preview.toolCallId}-title`;
  const summaryId = `consent-${preview.toolCallId}-summary`;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onCancel();
    }
  };

  return (
    <InteractiveCardShell
      onDismiss={onDismiss}
      showDismiss={false}
      tone="decision"
      frameClassName={FRAME_CLASS[tone]}
      title={
        <div className="flex items-start gap-2.5">
          <ToneIcon tone={tone} />
          <div className="min-w-0">
            <h3
              id={titleId}
              dir="auto"
              className="text-base font-semibold leading-snug text-foreground"
            >
              {consentTitle(consent)}
            </h3>
            <p
              id={summaryId}
              dir="auto"
              className="mt-1 text-sm text-muted-foreground"
            >
              {consentSummary(consent)}
            </p>
          </div>
        </div>
      }
    >
      <div
        role="group"
        aria-labelledby={titleId}
        aria-describedby={summaryId}
        onKeyDown={handleKeyDown}
      >
        <p className="sr-only" role="status">
          {consentTitle(consent)}
        </p>
        {effects.length > 0 && (
          <ul className="flex flex-col divide-y">
            {effects.map((effect, index) => (
              <EffectRow
                key={`${effect.displayName}-${index}`}
                effect={effect}
              />
            ))}
          </ul>
        )}
        {statedWarnings.length > 0 && (
          <div
            role="alert"
            className={cn(
              'mt-3 flex items-start gap-2 text-sm font-medium',
              tone === 'destructive'
                ? 'text-destructive-700 dark:text-destructive-200'
                : 'text-warning-700 dark:text-warning-300',
            )}
          >
            <TriangleAlert
              className="mt-0.5 size-4 shrink-0"
              aria-hidden={true}
            />
            <span dir="auto" className="flex flex-col gap-0.5">
              {statedWarnings.map((warning) => (
                <span key={warning}>{warningPhrase(warning)}</span>
              ))}
            </span>
          </div>
        )}
        {consent.reusable && (
          <p
            dir="auto"
            className="mt-3 max-w-prose text-xs text-muted-foreground"
          >
            {t(
              'Also covers repeats of this exact action, to the same recipients, in this chat.',
            )}
          </p>
        )}
        <div className="mt-4 flex flex-col-reverse gap-2 border-t pt-3 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            onClick={onCancel}
            type="button"
            className="h-11 w-full sm:h-9 sm:w-auto"
          >
            {t("Don't run it")}
          </Button>
          <Button
            variant={tone === 'destructive' ? 'destructive' : 'default'}
            onClick={onRun}
            type="button"
            className={cn('h-11 w-full sm:h-9 sm:w-auto', CONFIRM_CLASS[tone])}
          >
            {confirmLabel(consent)}
          </Button>
        </div>
      </div>
    </InteractiveCardShell>
  );
}

function ToneIcon({ tone }: { tone: ConsentTone }) {
  if (tone === 'external') {
    return null;
  }
  const Icon = TONE_ICON[tone] ?? CircleHelp;
  return (
    <Icon
      className={cn('mt-0.5 size-[18px] shrink-0', TONE_ICON_CLASS[tone])}
      aria-hidden={true}
    />
  );
}

function EffectRow({ effect }: { effect: ConsentEffectPreview }) {
  const Icon = KIND_ICON[effect.kind] ?? CircleHelp;
  return (
    <li className="flex items-start gap-2.5 py-2.5">
      <Icon
        className={cn('mt-0.5 size-4 shrink-0', kindIconClass(effect.kind))}
        aria-hidden={true}
      />
      <div className="min-w-0 flex-1">
        <p
          dir="auto"
          className={cn('text-sm font-medium', kindPhraseClass(effect.kind))}
        >
          {effectPhrase(effect.kind)}
        </p>
        <TextWithTooltip
          tooltipMessage={`${effect.displayName} · ${effect.detail}`}
        >
          <p dir="auto" className="truncate text-xs text-muted-foreground">
            {effect.displayName}
            <span className="px-1">·</span>
            {effect.detail}
          </p>
        </TextWithTooltip>
        {recipientLine(effect)}
      </div>
    </li>
  );
}

function recipientLine(effect: ConsentEffectPreview) {
  if (effect.recipientResolved && effect.recipient) {
    return (
      <p dir="auto" className="mt-0.5 text-xs text-foreground">
        <span className="text-muted-foreground">{t('To')}</span>
        <span className="px-1 text-muted-foreground">·</span>
        <span dir="ltr" className="font-mono break-all">
          {effect.recipient}
        </span>
      </p>
    );
  }
  if (effect.kind === 'outward_send') {
    return (
      <p dir="auto" className="mt-0.5 text-xs text-muted-foreground">
        {t('To whoever the incoming data names — not known until it runs')}
      </p>
    );
  }
  return null;
}

function kindIconClass(kind: string): string {
  switch (kind) {
    case 'destructive':
    case 'internal_destructive':
      return 'text-destructive-700 dark:text-destructive-200';
    case 'financial':
    case 'input_dependent':
    case 'unknown':
      return 'text-warning-700 dark:text-warning-300';
    default:
      return 'text-muted-foreground';
  }
}

function kindPhraseClass(kind: string): string {
  switch (kind) {
    case 'destructive':
    case 'internal_destructive':
      return 'text-destructive-700 dark:text-destructive-200';
    case 'financial':
    case 'input_dependent':
    case 'unknown':
      return 'text-warning-700 dark:text-warning-300';
    default:
      return 'text-foreground';
  }
}

function effectPhrase(kind: string): string {
  switch (kind) {
    case 'read':
      return t('Reads data — changes nothing');
    case 'internal_write':
      return t('Changes data in your workspace');
    case 'outward_send':
      return t('Sends a real message to someone');
    case 'external_write':
      return t('Changes data in a connected app');
    case 'destructive':
      return t('Permanently deletes data');
    case 'internal_destructive':
      return t('Deletes data in your workspace');
    case 'financial':
      return t('Moves money');
    case 'input_dependent':
      return t("Does whatever it is handed — we can't tell before it runs");
    default:
      return t('Does something we could not identify');
  }
}

function warningPhrase(warning: ConsentWarning): string {
  switch (warning) {
    case 'irreversible':
      return t("Deleted data can't be brought back.");
    case 'money':
      return t('This moves real money.');
    case 'unpredictable':
      return t("Part of this we can't predict until it runs.");
    default:
      return t('Once on, it keeps running on its own — no one is asked again.');
  }
}

function consentTitle(consent: ConsentPreview): string {
  const flowName = consent.flowName
    ? consentPresentation.isolate(consent.flowName)
    : t('this automation');
  const targetName = consent.targetName
    ? consentPresentation.isolate(consent.targetName)
    : undefined;
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
      return targetName
        ? t('Delete the automation "{name}"?', { name: targetName })
        : t('Delete this automation?');
    case 'delete_table':
      return targetName
        ? t('Delete the table "{name}" and everything in it?', {
            name: targetName,
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
      return t('Use "{name}"?', { name: targetName ?? '' });
    default:
      return t('Run this tool?');
  }
}

function consentSummary(consent: ConsentPreview): string {
  if (!consent.resolved) {
    return t("We couldn't work out what this will touch, so we're asking.");
  }
  switch (consent.category) {
    case 'publish':
    case 'enable':
      return t('This switches the automation on for real.');
    case 'run_code':
      return t(
        "This code can reach other systems, so we can't tell what it does before it runs.",
      );
    case 'connector_action':
      return t('This changes data in a connected app.');
    case 'delete_flow':
    case 'delete_table':
    case 'delete_records':
    case 'delete_column':
      return t('Here is what it does:');
    default:
      return summaryForTone(consentPresentation.tone({ consent }));
  }
}

function summaryForTone(tone: ConsentTone): string {
  switch (tone) {
    case 'destructive':
      return t('This runs for real, and part of it deletes data.');
    case 'financial':
      return t('This runs for real, and part of it moves money.');
    case 'unknown':
      return t("This runs for real, and part of it we can't predict.");
    default:
      return t('This runs for real, outside your workspace.');
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

const KIND_ICON: Record<string, LucideIcon> = {
  read: Eye,
  internal_write: PenLine,
  outward_send: Send,
  external_write: PenLine,
  destructive: Trash2,
  internal_destructive: Trash2,
  financial: Banknote,
  input_dependent: CircleHelp,
  unknown: CircleHelp,
};

const TONE_ICON: Record<ConsentTone, LucideIcon | null> = {
  destructive: Trash2,
  financial: Banknote,
  unattended: Repeat,
  unknown: CircleHelp,
  external: null,
};

const TONE_ICON_CLASS: Record<ConsentTone, string> = {
  destructive: 'text-destructive-700 dark:text-destructive-200',
  financial: 'text-warning-700 dark:text-warning-300',
  unattended: 'text-warning-700 dark:text-warning-300',
  unknown: 'text-warning-700 dark:text-warning-300',
  external: '',
};

const FRAME_CLASS: Record<ConsentTone, string> = {
  destructive: 'border-destructive/40 dark:border-destructive/50',
  financial: 'border-warning/60 dark:border-warning/50',
  unattended: 'border-warning/60 dark:border-warning/50',
  unknown: 'border-warning/60 dark:border-warning/50',
  external: 'border-primary/30 dark:border-primary/40',
};

const CONFIRM_CLASS: Record<ConsentTone, string> = {
  destructive:
    'bg-destructive-600 hover:bg-destructive-700 dark:bg-destructive-600 dark:hover:bg-destructive-500 focus-visible:ring-destructive/70',
  financial:
    'bg-warning-700 text-white hover:bg-warning-800 dark:bg-warning-700 dark:hover:bg-warning-600',
  unattended:
    'bg-warning-700 text-white hover:bg-warning-800 dark:bg-warning-700 dark:hover:bg-warning-600',
  unknown:
    'bg-warning-700 text-white hover:bg-warning-800 dark:bg-warning-700 dark:hover:bg-warning-600',
  external: '',
};
