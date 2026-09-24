import { t } from 'i18next';
import { Loader2, RotateCcw, Sparkles, UserRound } from 'lucide-react';
import { motion } from 'motion/react';

export function PersonalizationChip({
  state,
  role,
  company,
  onClick,
  onClear,
}: {
  state: PersonalizationChipState;
  role: string | null;
  company: string | null;
  onClick: () => void;
  onClear?: () => void;
}) {
  const clearable = Boolean(onClear) && state === 'ready';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.2 }}
      className="group inline-flex max-w-full items-center rounded-full border bg-background text-xs font-medium text-foreground/80 shadow-sm transition-colors hover:border-primary/40"
    >
      <button
        type="button"
        onClick={onClick}
        className="inline-flex min-w-0 items-center gap-1.5 py-1 pl-2.5 pr-3 transition-colors hover:text-foreground"
      >
        <ChipIcon state={state} />
        <span className="truncate">{chipLabel({ state, role, company })}</span>
      </button>
      {clearable && (
        <button
          type="button"
          onClick={onClear}
          className="max-w-0 shrink-0 overflow-hidden opacity-0 transition-all duration-300 ease-out focus-visible:outline-none group-hover:max-w-16 group-hover:opacity-100 group-focus-within:max-w-16 group-focus-within:opacity-100"
        >
          <span className="flex items-center whitespace-nowrap border-l py-1 pl-2.5 pr-3 text-muted-foreground transition-colors hover:text-destructive">
            {t('Clear')}
          </span>
        </button>
      )}
    </motion.div>
  );
}

function ChipIcon({ state }: { state: PersonalizationChipState }) {
  if (state === 'researching') {
    return <Loader2 className="size-3.5 shrink-0 animate-spin text-primary" />;
  }
  if (state === 'failed') {
    return <RotateCcw className="size-3.5 shrink-0 text-muted-foreground" />;
  }
  if (state === 'ready') {
    return <UserRound className="size-3.5 shrink-0 text-muted-foreground" />;
  }
  return <Sparkles className="size-3.5 shrink-0 text-primary" />;
}

function chipLabel({
  state,
  role,
  company,
}: {
  state: PersonalizationChipState;
  role: string | null;
  company: string | null;
}): string {
  if (state === 'researching') {
    return company
      ? t('Tailoring to {company}…', { company })
      : t('Tailoring these to your work…');
  }
  if (state === 'failed') {
    return t('Could not tailor these, try again');
  }
  if (state === 'ready' && role) {
    return company ? t('{role} at {company}', { role, company }) : role;
  }
  return t('Tailor these to my work');
}

export type PersonalizationChipState =
  | 'unanswered'
  | 'researching'
  | 'ready'
  | 'failed';
