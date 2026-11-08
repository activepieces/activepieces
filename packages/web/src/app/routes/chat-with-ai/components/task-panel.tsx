import { SubagentActivity, SubagentTimelineEntry } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronLeft, Maximize2, Minimize2, X } from 'lucide-react';
import { motion } from 'motion/react';
import { createContext, useEffect, useRef, useState } from 'react';

import {
  ChatContainerContent,
  ChatContainerRoot,
} from '@/components/prompt-kit/chat-container';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Markdown } from '@/components/prompt-kit/markdown';
import {
  FaviconOrGlobe,
  getDomain,
  Source,
} from '@/components/prompt-kit/source';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { chatStoreSelectors } from '@/features/chat/lib/chat-store';
import { useChatStoreContext } from '@/features/chat/lib/chat-store-context';
import { useElementSize } from '@/hooks/use-element-size';
import { cn } from '@/lib/utils';

import { ChatStatusIcon, ChatStatusText } from './chat-ui/chat-status';
import { chatStatusUtils } from './chat-ui/chat-status-utils';
import { PreviewIconButton } from './previews/preview-card';
import {
  Duration,
  LiveLine,
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
  const index = tasks.indexOf(selected);
  const previous = index > 0 ? tasks[index - 1] : undefined;
  const title = selected.activity.title;
  const body = (
    <>
      <div className="flex min-w-0 items-center gap-2 border-b py-2.5 pl-2 pr-3">
        {previous ? (
          <PreviewIconButton
            icon={ChevronLeft}
            label={t('Previous task')}
            onClick={() => onSelect(previous.toolCallId)}
          />
        ) : (
          <span aria-hidden className="w-2" />
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <TextWithTooltip tooltipMessage={title}>
            <p className="truncate text-sm font-medium text-gray-12">
              {title}
            </p>
          </TextWithTooltip>
          <div className="flex min-w-0 items-center gap-1 text-xs text-gray-11">
            {tasks.length > 1 && (
              <span className="truncate">
                {t('Task {position} of {total}', {
                  position: index + 1,
                  total: tasks.length,
                })}
              </span>
            )}
            <Duration
              activity={selected.activity}
              className="w-auto text-left"
            />
          </div>
        </div>
        <ChatStatusText
          status={chatStatusUtils.fromSubagent(selected.activity.status)}
        />
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
              <ChatStatusIcon
                status={chatStatusUtils.fromSubagent(activity.status)}
              />
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

export function TaskPanelLayout({ children }: { children: React.ReactNode }) {
  const [slot, setSlot] = useState<HTMLDivElement | null>(null);
  const roomRef = useRef<HTMLDivElement>(null);
  const room = useElementSize(roomRef);
  const setChatAreaWidth = useChatStoreContext(
    (state) => state.setChatAreaWidth,
  );
  useEffect(() => setChatAreaWidth(room.width), [room.width, setChatAreaWidth]);
  return (
    <TaskPanelSlotContext.Provider value={slot}>
      <div ref={roomRef} className="flex h-full min-w-0 flex-1">
        {children}
        <div ref={setSlot} className="contents" />
      </div>
    </TaskPanelSlotContext.Provider>
  );
}

function useDocked(): boolean {
  return useChatStoreContext(chatStoreSelectors.taskPanelDocks);
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
        <LiveLine activity={activity} />

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

        {!running && activity.summary && (
          <Section title={t('Findings')}>
            <div className="text-sm text-gray-12">
              <Markdown>{activity.summary}</Markdown>
            </div>
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
            <ul className="flex flex-col">
              {pages.map((page) => (
                <SourceRow key={page.url} url={page.url} title={page.title} />
              ))}
            </ul>
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
  if (entry.kind === 'status' && entry.failed) {
    return <ChatStatusIcon status="failed" />;
  }
  return <ChatStatusIcon status={active ? 'working' : 'done'} />;
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

function SourceRow({ url, title }: { url: string; title?: string }) {
  return (
    <li>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-gray-3"
      >
        <FaviconOrGlobe url={url} size="sm" />
        <span className="min-w-0 flex-1 truncate text-gray-12">
          {title ?? url}
        </span>
        <span className="shrink-0 text-xs text-gray-11">{getDomain(url)}</span>
      </a>
    </li>
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
      <h3 className="pb-2 text-sm font-medium text-gray-12">{title}</h3>
      {children}
    </section>
  );
}

export const TaskPanelSlotContext = createContext<HTMLElement | null>(null);

const MAX_SEARCH_RESULTS = 4;
