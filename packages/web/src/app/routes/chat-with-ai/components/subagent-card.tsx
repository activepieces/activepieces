import { isObject } from '@activepieces/core-utils';
import { SubagentActivity } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronRight, ListTodo } from 'lucide-react';
import { useContext } from 'react';
import { createPortal } from 'react-dom';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { ToolCallMeta } from '@/features/chat/lib/chat-store';
import { useChatStoreContext } from '@/features/chat/lib/chat-store-context';
import { cn } from '@/lib/utils';

import { TaskRow } from '../lib/message-blocks';

import {
  ChatCard,
  ChatCardBody,
  ChatCardHeader,
  ChatCardTile,
} from './chat-ui/chat-card';
import { ChatStatusIcon, ChatStatusText } from './chat-ui/chat-status';
import { ChatStatus, chatStatusUtils } from './chat-ui/chat-status-utils';
import {
  AppLogos,
  Duration,
  LiveLine,
  ReadFavicons,
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
  const sorted = [...activities].sort(
    (a, b) => needsYouRank(a.activity) - needsYouRank(b.activity),
  );
  const statuses = activities.map(({ activity }) =>
    chatStatusUtils.fromSubagent(activity.status),
  );
  const working = statuses.includes('working');
  const doneCount = statuses.filter((status) => status === 'done').length;
  const needsCount = statuses.filter((status) => status === 'needs-you').length;
  const panelOpenHere = activities.some(
    ({ toolCallId }) => toolCallId === panelToolCallId,
  );

  return (
    <ChatCard className="my-2">
      <ChatCardHeader
        tile={<ChatCardTile kind="bits" icon={ListTodo} />}
        title={
          working
            ? t(
                '{count, plural, =1 {Working on a task} other {Working on # tasks at once}}',
                { count: tasks.length },
              )
            : t('{count, plural, =1 {Task finished} other {# tasks finished}}', {
                count: tasks.length,
              })
        }
        meta={
          needsCount > 0
            ? t(
                '{done} done, {needs, plural, =1 {1 needs you} other {# need you}}',
                { done: doneCount, needs: needsCount },
              )
            : t('{done} of {total} done', {
                done: doneCount,
                total: tasks.length,
              })
        }
        trailing={<ChatStatusText status={worstStatus(statuses)} />}
      />
      <ChatCardBody className="gap-0">
        {sorted.map(({ toolCallId, activity }) => (
          <SubagentRow
            key={toolCallId}
            activity={activity}
            selected={toolCallId === panelToolCallId}
            onOpen={() => openTaskPanel(toolCallId)}
          />
        ))}
      </ChatCardBody>
      {panelOpenHere &&
        panelSlot &&
        panelToolCallId &&
        createPortal(
          <TaskPanel
            tasks={sorted}
            selectedToolCallId={panelToolCallId}
            onSelect={openTaskPanel}
            onClose={closeTaskPanel}
          />,
          panelSlot,
        )}
    </ChatCard>
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
    <div className="border-t border-gray-4 py-1">
      <button
        type="button"
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-gray-3',
          selected && 'bg-accent-3 hover:bg-accent-4',
        )}
        onClick={onOpen}
      >
        <ChatStatusIcon status={chatStatusUtils.fromSubagent(activity.status)} />
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
        <ChevronRight aria-hidden className="size-4 shrink-0 text-gray-9" />
      </button>
    </div>
  );
}

function needsYouRank(activity: SubagentActivity): number {
  return activity.status === 'blocked' ? 0 : 1;
}

function worstStatus(statuses: ChatStatus[]): ChatStatus {
  return (
    STATUS_SEVERITY.find((status) => statuses.includes(status)) ?? 'done'
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
const STATUS_SEVERITY: ChatStatus[] = [
  'needs-you',
  'failed',
  'working',
  'stopped',
  'done',
];
