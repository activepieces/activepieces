import { SubagentActivity, SubagentTimelineEntry } from '@activepieces/shared';
import { t } from 'i18next';
import { useEffect, useState } from 'react';

import { FaviconOrGlobe } from '@/components/prompt-kit/source';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';
import { cn } from '@/lib/utils';

export function LiveLine({ activity }: { activity: SubagentActivity }) {
  if (activity.status === 'done') {
    return <p className="text-xs leading-4 text-gray-11">{t('Done')}</p>;
  }
  if (activity.status === 'blocked') {
    return (
      <p className="text-xs leading-4 text-accent-11">
        {t('Paused, reply in the chat')}
      </p>
    );
  }
  if (activity.status === 'failed') {
    return (
      <p className="text-xs leading-4 text-gray-11">{t('Stopped early')}</p>
    );
  }
  return (
    <p className="truncate text-xs leading-4 text-gray-11">
      {activity.statusLine ?? t('Getting started')}
    </p>
  );
}

export function AppLogos({ pieces }: { pieces: string[] }) {
  const apps = pieces.filter(
    (pieceName) => !PLUMBING_PIECES.includes(pieceName),
  );
  return (
    <LogoStack
      items={apps.map((pieceName) => (
        <AppLogo key={pieceName} pieceName={pieceName} />
      ))}
    />
  );
}

export function ReadFavicons({
  timeline,
}: {
  timeline: SubagentTimelineEntry[];
}) {
  return (
    <LogoStack
      items={readPages(timeline).map((page) => (
        <span
          key={page.url}
          className="flex size-5 items-center justify-center rounded-full bg-panel"
        >
          <FaviconOrGlobe url={page.url} size="sm" />
        </span>
      ))}
    />
  );
}

function LogoStack({ items }: { items: React.ReactNode[] }) {
  if (items.length === 0) return null;
  const extra = items.length - MAX_LOGOS;
  return (
    <div className="flex shrink-0 items-center gap-1">
      {items.slice(0, MAX_LOGOS)}
      {extra > 0 && (
        <span className="text-xs text-gray-11 tabular-nums">+{extra}</span>
      )}
    </div>
  );
}

export function Duration({
  activity,
  className,
}: {
  activity: SubagentActivity;
  className?: string;
}) {
  if (activity.status === 'running') {
    return activity.startedAt.length > 0 ? (
      <Elapsed startedAt={activity.startedAt} className={className} />
    ) : null;
  }
  if (activity.durationMs === undefined) return null;
  return (
    <span
      className={cn(
        'w-12 shrink-0 text-right text-xs text-gray-11 tabular-nums',
        className,
      )}
    >
      {formatDuration(activity.durationMs)}
    </span>
  );
}

function Elapsed({
  startedAt,
  className,
}: {
  startedAt: string;
  className?: string;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, []);
  return (
    <span
      className={cn(
        'w-12 shrink-0 text-right text-xs text-gray-11 tabular-nums',
        className,
      )}
    >
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

function readPages(
  timeline: SubagentTimelineEntry[],
): { url: string; title?: string }[] {
  const pages = timeline.flatMap((entry) =>
    entry.kind === 'read' ? [{ url: entry.url, title: entry.title }] : [],
  );
  return pages.filter(
    (page, index) =>
      pages.findIndex((other) => other.url === page.url) === index,
  );
}

export const subagentTimelineUtils = { readPages };

const MAX_LOGOS = 3;
const PLUMBING_PIECES = ['@activepieces/piece-subflows'];
