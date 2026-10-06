import { SubagentActivity, SubagentTimelineEntry } from '@activepieces/shared';
import { t } from 'i18next';
import { Check, Loader2, Maximize2, Minimize2, Search, X } from 'lucide-react';
import { motion } from 'motion/react';
import { createContext, useState, useSyncExternalStore } from 'react';

import {
  ChatContainerContent,
  ChatContainerRoot,
} from '@/components/prompt-kit/chat-container';
import { Markdown } from '@/components/prompt-kit/markdown';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  FaviconOrGlobe,
  getDomain,
  Source,
} from '@/components/prompt-kit/source';
import { cn } from '@/lib/utils';

import { PreviewIconButton } from './previews/preview-card';
import {
  Duration,
  LiveLine,
  StatusMark,
  subagentTimelineUtils,
} from './subagent-primitives';

export function TaskPanel({
  tasks,
  selectedToolCallId,
  onSelect,
  onClose,
}: {
  tasks: { toolCallId: string; activity: SubagentActivity }[];
  selectedToolCallId: string;
  onSelect: (toolCallId: string) => void;
  onClose: () => void;
}) {
  const [fullscreen, setFullscreen] = useState(false);
  const docked = useDocked();
  const selected = tasks.find(
    ({ toolCallId }) => toolCallId === selectedToolCallId,
  );
  if (!selected) return null;
  const title =
    tasks.length > 1
      ? t('{count} tasks', { count: tasks.length })
      : selected.activity.title;
  const body = (
    <>
      <div className="flex items-center gap-1 border-b px-4 py-2.5">
        <p className="flex-1 truncate text-sm font-medium text-gray-12">
          {title}
        </p>
        {docked && (
          <PreviewIconButton
            icon={fullscreen ? Minimize2 : Maximize2}
            label={fullscreen ? t('Exit full screen') : t('Full screen')}
            onClick={() => setFullscreen((value) => !value)}
          />
        )}
        <PreviewIconButton icon={X} label={t('Close')} onClick={onClose} />
      </div>

      {tasks.length > 1 && (
        <div className="flex gap-1 border-b px-3 py-2">
          {tasks.map(({ toolCallId, activity }) => (
            <button
              key={toolCallId}
              type="button"
              onClick={() => onSelect(toolCallId)}
              className={cn(
                'flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors hover:bg-gray-3',
                toolCallId === selected.toolCallId
                  ? 'bg-gray-3 text-gray-12'
                  : 'text-gray-11',
              )}
            >
              <StatusMark status={activity.status} />
              <span className="truncate">{activity.title}</span>
            </button>
          ))}
        </div>
      )}

      <TaskDetails
        key={selected.toolCallId}
        activity={selected.activity}
        wide={fullscreen}
      />
    </>
  );

  if (fullscreen || !docked) {
    return (
      <Dialog
        open
        onOpenChange={(open) => {
          if (open) return;
          if (fullscreen && docked) {
            setFullscreen(false);
          } else {
            onClose();
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          showOverlay={false}
          aria-describedby={undefined}
          className="inset-0 top-0 left-0 flex h-full w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 p-0 data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100 data-[state=closed]:slide-out-to-left-0 data-[state=closed]:slide-out-to-top-0 data-[state=open]:slide-in-from-left-0 data-[state=open]:slide-in-from-top-0"
        >
          <DialogTitle className="sr-only">{title}</DialogTitle>
          {body}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <motion.aside
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className="flex h-full w-[460px] shrink-0 flex-col border-l bg-panel xl:w-[540px]"
    >
      {body}
    </motion.aside>
  );
}

function useDocked(): boolean {
  return useSyncExternalStore(
    subscribeToDocking,
    () => window.matchMedia(DOCKED_MEDIA_QUERY).matches,
    () => true,
  );
}

function subscribeToDocking(onChange: () => void): () => void {
  const query = window.matchMedia(DOCKED_MEDIA_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function TaskDetails({
  activity,
  wide,
}: {
  activity: SubagentActivity;
  wide: boolean;
}) {
  const timeline = activity.timeline ?? [];
  const artifacts = activity.artifacts ?? [];
  const pages = subagentTimelineUtils.readPages(timeline);
  const running = activity.status === 'running';

  return (
    <ChatContainerRoot className="min-h-0 flex-1">
      <ChatContainerContent
        className={cn('mx-auto px-5 py-5', wide && 'max-w-3xl')}
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-lg font-medium text-gray-12">{activity.title}</p>
            <LiveLine activity={activity} />
          </div>
          <Duration activity={activity} />
        </div>

        {timeline.length > 0 && (
          <ol className="mt-5 flex flex-col gap-3">
            {timeline.map((entry, index) => (
              <TimelineItem
                key={`${index}-${entry.kind}`}
                entry={entry}
                active={running && index === timeline.length - 1}
              />
            ))}
          </ol>
        )}

        {!running && (activity.summary || activity.needs) && (
          <Section title={t('Findings')}>
            {activity.summary && (
              <div className="text-sm text-gray-12">
                <Markdown>{activity.summary}</Markdown>
              </div>
            )}
            {activity.status === 'blocked' && activity.needs && (
              <div className="mt-3 rounded-lg bg-accent-3 px-3 py-2 text-sm text-gray-12">
                <Markdown>{activity.needs}</Markdown>
              </div>
            )}
          </Section>
        )}

        {artifacts.length > 0 && (
          <Section title={t('Made')}>
            <div className="flex flex-wrap gap-1.5">
              {artifacts.map((artifact) => (
                <span
                  key={`${artifact.type}-${artifact.id}`}
                  className="max-w-full truncate rounded-md bg-gray-3 px-2 py-0.5 text-xs text-gray-12"
                >
                  {artifact.name}
                </span>
              ))}
            </div>
          </Section>
        )}

        {pages.length > 0 && (
          <Section
            title={t('{count, plural, =1 {1 source} other {# sources}}', {
              count: pages.length,
            })}
          >
            <div
              className={cn(
                'grid grid-cols-1 gap-2',
                wide ? 'sm:grid-cols-3' : 'sm:grid-cols-2',
              )}
            >
              {pages.map((page) => (
                <SourceCard key={page.url} url={page.url} title={page.title} />
              ))}
            </div>
          </Section>
        )}
      </ChatContainerContent>
    </ChatContainerRoot>
  );
}

function TimelineItem({
  entry,
  active,
}: {
  entry: SubagentTimelineEntry;
  active: boolean;
}) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex gap-3"
    >
      <span className="flex size-5 shrink-0 items-center justify-center">
        <TimelineIcon entry={entry} active={active} />
      </span>
      <div className="min-w-0 flex-1 text-sm text-gray-12">
        {entry.kind === 'status' && <p>{entry.text}</p>}
        {entry.kind === 'search' && <SearchEntry entry={entry} />}
        {entry.kind === 'read' && (
          <a
            href={entry.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate hover:underline"
          >
            {t('Read {page}', { page: entry.title ?? getDomain(entry.url) })}
          </a>
        )}
      </div>
    </motion.li>
  );
}

function TimelineIcon({
  entry,
  active,
}: {
  entry: SubagentTimelineEntry;
  active: boolean;
}) {
  if (active) {
    return (
      <Loader2 className="size-3.5 animate-spin text-accent-10 motion-reduce:animate-none" />
    );
  }
  if (entry.kind === 'search') {
    return <Search className="size-3.5 text-gray-11" />;
  }
  if (entry.kind === 'read') {
    return <FaviconOrGlobe url={entry.url} size="sm" />;
  }
  return <Check className="size-3.5 text-success-10" strokeWidth={2.5} />;
}

function SearchEntry({
  entry,
}: {
  entry: Extract<SubagentTimelineEntry, { kind: 'search' }>;
}) {
  const shown = entry.results.slice(0, MAX_SEARCH_RESULTS);
  const extra = entry.results.length - shown.length;
  return (
    <div>
      <p className="truncate">
        {t('Searched “{query}”', { query: entry.query })}
      </p>
      {shown.length > 0 && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {shown.map((result) => (
            <Source key={result.url} href={result.url} title={result.title} />
          ))}
          {extra > 0 && (
            <span className="text-xs text-gray-11 tabular-nums">+{extra}</span>
          )}
        </div>
      )}
    </div>
  );
}

function SourceCard({ url, title }: { url: string; title?: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col gap-1.5 rounded-lg border p-3 transition-colors hover:bg-gray-3"
    >
      <span className="flex items-center gap-1.5 text-xs text-gray-11">
        <FaviconOrGlobe url={url} size="sm" />
        <span className="truncate">{getDomain(url)}</span>
      </span>
      <span className="line-clamp-2 text-sm text-gray-12">{title ?? url}</span>
    </a>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <p className="pb-2 text-xs font-medium text-gray-11">{title}</p>
      {children}
    </section>
  );
}

export function TaskPanelLayout({ children }: { children: React.ReactNode }) {
  const [slot, setSlot] = useState<HTMLDivElement | null>(null);
  return (
    <TaskPanelSlotContext.Provider value={slot}>
      <div className="flex h-full min-w-0 flex-1">
        {children}
        <div ref={setSlot} className="contents" />
      </div>
    </TaskPanelSlotContext.Provider>
  );
}

export const TaskPanelSlotContext = createContext<HTMLElement | null>(null);

const DOCKED_MEDIA_QUERY = '(min-width: 1024px)';
const MAX_SEARCH_RESULTS = 4;
