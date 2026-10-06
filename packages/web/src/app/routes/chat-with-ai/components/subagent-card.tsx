import { isObject } from '@activepieces/core-utils';
import { SubagentActivity } from '@activepieces/shared';
import { t } from 'i18next';
import { motion } from 'motion/react';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { ToolCallMeta } from '@/features/chat/lib/chat-store';
import { AnyToolPart } from '@/features/chat/lib/chat-types';

import {
  AppLogos,
  Duration,
  LiveLine,
  StatusMark,
} from './subagent-primitives';

export function SubagentGroup({
  builders,
  toolCallMeta,
  isStreaming,
}: {
  builders: { toolCallId: string; part: AnyToolPart }[];
  toolCallMeta: Record<string, ToolCallMeta>;
  isStreaming: boolean;
}) {
  const tasks = builders.map(({ toolCallId, part }) => ({
    toolCallId,
    activity: resolveActivity({
      live: toolCallMeta[toolCallId]?.subagent,
      part,
      isStreaming,
    }),
  }));
  const working = tasks.some(({ activity }) => activity.status === 'running');

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
              { count: builders.length },
            )
          : t('{count, plural, =1 {Task finished} other {# tasks finished}}', {
              count: builders.length,
            })}
      </div>
      <div className="pb-1.5">
        {tasks.map(({ toolCallId, activity }) => (
          <SubagentRow key={toolCallId} activity={activity} />
        ))}
      </div>
    </motion.div>
  );
}

function SubagentRow({ activity }: { activity: SubagentActivity }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2">
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
      <Duration activity={activity} />
    </div>
  );
}

function resolveActivity({
  live,
  part,
  isStreaming,
}: {
  live: SubagentActivity | undefined;
  part: AnyToolPart;
  isStreaming: boolean;
}): SubagentActivity {
  const saved = activityFromOutput(part);
  if (saved) return saved;
  if (live) {
    const stoppedMidRun = live.status === 'running' && !isStreaming;
    return stoppedMidRun ? { ...live, status: 'failed' } : live;
  }
  const input = isObject(part.input) ? part.input : {};
  return {
    title: typeof input['title'] === 'string' ? input['title'] : t('Task'),
    status: isStreaming ? 'running' : 'failed',
    steps: [],
    startedAt: '',
  };
}

function activityFromOutput(part: AnyToolPart): SubagentActivity | null {
  if (part.state !== 'output-available') return null;
  const output = parseOutput(part.output);
  if (!isObject(output)) return null;
  const activity = output['activity'];
  return isSubagentActivity(activity) ? activity : null;
}

function isSubagentActivity(value: unknown): value is SubagentActivity {
  return (
    isObject(value) &&
    typeof value['title'] === 'string' &&
    typeof value['startedAt'] === 'string' &&
    typeof value['status'] === 'string' &&
    STATUSES.includes(value['status']) &&
    Array.isArray(value['steps'])
  );
}

function parseOutput(output: unknown): unknown {
  if (typeof output !== 'string') return output;
  try {
    return JSON.parse(output);
  } catch {
    return output;
  }
}

const STATUSES: string[] = ['running', 'done', 'blocked', 'failed'];
