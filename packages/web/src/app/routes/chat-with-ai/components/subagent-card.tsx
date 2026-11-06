import { isObject } from '@activepieces/core-utils';
import { SubagentActivity } from '@activepieces/shared';
import { t } from 'i18next';
import { motion } from 'motion/react';
import { useContext } from 'react';
import { createPortal } from 'react-dom';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { ToolCallMeta } from '@/features/chat/lib/chat-store';
import { useChatStoreContext } from '@/features/chat/lib/chat-store-context';
import { cn } from '@/lib/utils';

import { TaskRow } from '../lib/message-blocks';

import {
  AppLogos,
  Duration,
  LiveLine,
  ReadFavicons,
  StatusMark,
} from './subagent-primitives';
import { TaskPanel, TaskPanelSlotContext } from './task-panel';

export function SubagentGroup({
  tasks,
  toolCallMeta,
  isStreaming,
}: {
  tasks: TaskRow[];
  toolCallMeta: Record<string, ToolCallMeta>;
  isStreaming: boolean;
}) {
  const panelToolCallId = useChatStoreContext((s) => s.taskPanelToolCallId);
  const openTaskPanel = useChatStoreContext((s) => s.openTaskPanel);
  const closeTaskPanel = useChatStoreContext((s) => s.closeTaskPanel);
  const panelSlot = useContext(TaskPanelSlotContext);
  const activities = tasks.map((task) => ({
    toolCallId: task.toolCallId,
    activity: resolveActivity({
      live: toolCallMeta[task.toolCallId]?.subagent,
      task,
      isStreaming,
    }),
  }));
  const working = activities.some(
    ({ activity }) => activity.status === 'running',
  );
  const panelOpenHere = activities.some(
    ({ toolCallId }) => toolCallId === panelToolCallId,
  );

  return (
    <motion.div
      className="my-2 overflow-hidden rounded-xl border bg-panel"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="px-4 pt-3 pb-1 text-xs text-gray-11">
        {working
          ? t(
              '{count, plural, =1 {Working on a task} other {Working on # tasks at once}}',
              { count: tasks.length },
            )
          : t('{count, plural, =1 {Task finished} other {# tasks finished}}', {
              count: tasks.length,
            })}
      </div>
      <div className="pb-1.5">
        {activities.map(({ toolCallId, activity }) => (
          <SubagentRow
            key={toolCallId}
            activity={activity}
            selected={toolCallId === panelToolCallId}
            onOpen={() => openTaskPanel(toolCallId)}
          />
        ))}
      </div>
      {panelOpenHere &&
        panelSlot &&
        panelToolCallId &&
        createPortal(
          <TaskPanel
            tasks={activities}
            selectedToolCallId={panelToolCallId}
            onSelect={openTaskPanel}
            onClose={closeTaskPanel}
          />,
          panelSlot,
        )}
    </motion.div>
  );
}

function SubagentRow({
  activity,
  selected,
  onOpen,
}: {
  activity: SubagentActivity;
  selected: boolean;
  onOpen: () => void;
}) {
  return (
    <div className="px-1.5">
      <button
        type="button"
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-gray-3',
          selected && 'bg-gray-3',
        )}
        onClick={onOpen}
      >
        <StatusMark status={activity.status} />
        <div className="min-w-0 flex-1">
          <TextWithTooltip tooltipMessage={activity.title}>
            <p className="truncate text-sm font-medium text-gray-12">
              {activity.title}
            </p>
          </TextWithTooltip>
          <LiveLine activity={activity} />
        </div>
        <AppLogos pieces={activity.pieces ?? []} />
        <ReadFavicons timeline={activity.timeline ?? []} />
        <Duration activity={activity} />
      </button>
    </div>
  );
}

function resolveActivity({
  live,
  task,
  isStreaming,
}: {
  live: SubagentActivity | undefined;
  task: TaskRow;
  isStreaming: boolean;
}): SubagentActivity {
  const saved = activityFromOutput(task);
  if (saved) return saved;
  if (live) {
    const stoppedMidRun = live.status === 'running' && !isStreaming;
    return stoppedMidRun ? { ...live, status: 'failed' } : live;
  }
  const input = isObject(task.part.input) ? task.part.input : {};
  const inputTitle =
    typeof input['title'] === 'string' ? input['title'] : undefined;
  return {
    title: task.subject ?? inputTitle ?? t('Task'),
    status: isStreaming ? 'running' : 'failed',
    stepCount: 0,
    startedAt: '',
  };
}

function activityFromOutput(task: TaskRow): SubagentActivity | null {
  const activity = isObject(task.output) ? task.output['activity'] : undefined;
  return isSubagentActivity(activity) ? activity : null;
}

function isSubagentActivity(value: unknown): value is SubagentActivity {
  return (
    isObject(value) &&
    typeof value['title'] === 'string' &&
    typeof value['startedAt'] === 'string' &&
    typeof value['status'] === 'string' &&
    STATUSES.includes(value['status']) &&
    typeof value['stepCount'] === 'number'
  );
}

const STATUSES: string[] = ['running', 'done', 'blocked', 'failed'];
