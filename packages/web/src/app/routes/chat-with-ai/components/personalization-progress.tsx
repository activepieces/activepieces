import { t } from 'i18next';
import { Check } from 'lucide-react';
import { motion } from 'motion/react';

export function PersonalizationProgress({
  answered,
  onClick,
  onClear,
}: {
  answered: boolean;
  onClick: () => void;
  onClear?: () => void;
}) {
  const clearable = Boolean(onClear) && answered;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.2 }}
      className="group inline-flex items-center rounded-full border bg-background text-xs font-medium text-foreground/80 shadow-sm transition-colors hover:border-primary/40"
    >
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-2 py-1 pl-1.5 pr-3 transition-colors hover:text-foreground"
      >
        <ProgressDonut answered={answered} />
        <span>
          {answered ? t('Edit role & company') : t('Improve suggestions')}
        </span>
      </button>
      {clearable && (
        <button
          type="button"
          onClick={onClear}
          className="max-w-0 overflow-hidden opacity-0 transition-all duration-300 ease-out focus-visible:outline-none group-hover:max-w-16 group-hover:opacity-100 group-focus-within:max-w-16 group-focus-within:opacity-100"
        >
          <span className="flex items-center whitespace-nowrap border-l py-1 pl-2.5 pr-3 text-muted-foreground transition-colors hover:text-destructive">
            {t('Clear')}
          </span>
        </button>
      )}
    </motion.div>
  );
}

function ProgressDonut({ answered }: { answered: boolean }) {
  const size = 18;
  const stroke = 2.5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  if (answered) {
    return (
      <span className="flex size-[18px] items-center justify-center rounded-full bg-emerald-500 text-white">
        <Check className="size-3" strokeWidth={3} />
      </span>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0 -rotate-90"
      aria-hidden
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-emerald-500/15"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - UNANSWERED_HINT_FRACTION)}
        className="text-emerald-500 transition-[stroke-dashoffset] duration-500"
      />
    </svg>
  );
}

const UNANSWERED_HINT_FRACTION = 0.14;
