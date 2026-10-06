import { SubagentActivity } from '@activepieces/shared';
import { t } from 'i18next';
import { Check, Loader2, Maximize2, Minimize2, X } from 'lucide-react';
import { motion } from 'motion/react';
import { createContext, useState } from 'react';

import {
  ChatContainerContent,
  ChatContainerRoot,
} from '@/components/prompt-kit/chat-container';
import { Markdown } from '@/components/prompt-kit/markdown';
import { cn } from '@/lib/utils';

import { PreviewIconButton } from './previews/preview-card';
import { Duration, LiveLine, StatusMark } from './subagent-primitives';

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
  const selected = tasks.find(
    ({ toolCallId }) => toolCallId === selectedToolCallId,
  );
  if (!selected) return null;

  return (
    <motion.aside
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        'flex h-full flex-col bg-panel',
        fullscreen
          ? 'fixed inset-0 z-50'
          : 'max-lg:fixed max-lg:inset-0 max-lg:z-50 lg:w-[460px] lg:shrink-0 lg:border-l xl:w-[540px]',
      )}
    >
      <div className="flex items-center gap-1 border-b px-4 py-2.5">
        <p className="flex-1 truncate text-sm font-medium text-gray-12">
          {tasks.length > 1
            ? t('{count} tasks', { count: tasks.length })
            : selected.activity.title}
        </p>
        <PreviewIconButton
          icon={fullscreen ? Minimize2 : Maximize2}
          label={fullscreen ? t('Exit full screen') : t('Full screen')}
          onClick={() => setFullscreen((value) => !value)}
          className="max-lg:hidden"
        />
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
    </motion.aside>
  );
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
                key={`${index}-${entry.text}`}
                text={entry.text}
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
      </ChatContainerContent>
    </ChatContainerRoot>
  );
}

function TimelineItem({ text, active }: { text: string; active: boolean }) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex gap-3"
    >
      <span className="flex size-5 shrink-0 items-center justify-center">
        {active ? (
          <Loader2 className="size-3.5 animate-spin text-accent-10 motion-reduce:animate-none" />
        ) : (
          <Check className="size-3.5 text-success-10" strokeWidth={2.5} />
        )}
      </span>
      <p className="min-w-0 flex-1 text-sm text-gray-12">{text}</p>
    </motion.li>
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
