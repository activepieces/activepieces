import { SubagentActivity } from '@activepieces/shared';
import { t } from 'i18next';
import { Check, Hand, Loader2, Minus } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';

import { TextShimmer } from '@/components/ui/text-shimmer';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';

export function LiveLine({ activity }: { activity: SubagentActivity }) {
  if (activity.status === 'done') {
    return <p className="text-xs leading-4 text-gray-11">{t('Done')}</p>;
  }
  if (activity.status === 'blocked') {
    return (
      <p className="text-xs leading-4 text-accent-11">
        {t('Needs your input')}
      </p>
    );
  }
  if (activity.status === 'failed') {
    return (
      <p className="text-xs leading-4 text-gray-11">{t('Stopped early')}</p>
    );
  }
  const label = activity.statusLine ?? t('Getting started');
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={label}
        initial={{ opacity: 0, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -3 }}
        transition={{ duration: 0.18 }}
      >
        <TextShimmer as="p" className="truncate text-xs font-normal leading-4">
          {label}
        </TextShimmer>
      </motion.div>
    </AnimatePresence>
  );
}

export function StatusMark({ status }: { status: SubagentActivity['status'] }) {
  if (status === 'done') {
    return (
      <motion.span
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex size-5 shrink-0 items-center justify-center rounded-full bg-success-9"
      >
        <Check className="size-3 text-on-success" strokeWidth={3} />
      </motion.span>
    );
  }
  if (status === 'blocked') {
    return (
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-3">
        <Hand className="size-3 text-accent-11" />
      </span>
    );
  }
  if (status === 'failed') {
    return (
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-gray-3">
        <Minus className="size-3 text-gray-11" />
      </span>
    );
  }
  return (
    <span className="flex size-5 shrink-0 items-center justify-center">
      <Loader2 className="size-4 animate-spin text-accent-10 motion-reduce:animate-none" />
    </span>
  );
}

export function AppLogos({ pieces }: { pieces: string[] }) {
  const apps = pieces.filter(
    (pieceName) => !PLUMBING_PIECES.includes(pieceName),
  );
  if (apps.length === 0) return null;
  const shown = apps.slice(0, MAX_LOGOS);
  const extra = apps.length - shown.length;
  return (
    <div className="flex shrink-0 items-center gap-1">
      {shown.map((pieceName) => (
        <AppLogo key={pieceName} pieceName={pieceName} />
      ))}
      {extra > 0 && (
        <span className="text-xss text-gray-11 tabular-nums">+{extra}</span>
      )}
    </div>
  );
}

export function Duration({ activity }: { activity: SubagentActivity }) {
  if (activity.status === 'running') {
    return activity.startedAt.length > 0 ? (
      <Elapsed startedAt={activity.startedAt} />
    ) : null;
  }
  if (activity.durationMs === undefined) return null;
  return (
    <span className="w-12 shrink-0 text-right text-xs text-gray-11 tabular-nums">
      {formatDuration(activity.durationMs)}
    </span>
  );
}

function Elapsed({ startedAt }: { startedAt: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, []);
  return (
    <span className="w-12 shrink-0 text-right text-xs text-gray-11 tabular-nums">
      {formatDuration(now - Date.parse(startedAt))}
    </span>
  );
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes === 0
    ? `${seconds}s`
    : `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
}

function AppLogo({ pieceName }: { pieceName: string }) {
  const { summary } = piecesHooks.usePieceSummary({ name: pieceName });
  if (!summary?.logoUrl) return null;
  return (
    <PieceIcon
      size="xs"
      border={false}
      displayName={summary.displayName}
      logoUrl={summary.logoUrl}
      showTooltip={true}
    />
  );
}

const MAX_LOGOS = 3;
const PLUMBING_PIECES = ['@activepieces/piece-subflows'];
