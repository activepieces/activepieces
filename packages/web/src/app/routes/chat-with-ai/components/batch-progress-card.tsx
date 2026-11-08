import { BatchProgressData } from '@activepieces/shared';
import { t } from 'i18next';
import { Zap } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

import {
  ChatCard,
  ChatCardBody,
  ChatCardFold,
  ChatCardTile,
} from './chat-ui/chat-card';
import { ChatStatusText } from './chat-ui/chat-status';
import { ChatStatus, chatStatusUtils } from './chat-ui/chat-status-utils';

export function BatchProgressCard({
  progress,
}: {
  progress: BatchProgressData;
}) {
  const status = chatStatusUtils.fromBatch(progress);
  const percentage =
    progress.total > 0
      ? Math.round((progress.completed / progress.total) * 100)
      : 0;
  const failures = progress.results.filter((result) => !result.success);
  const meta = [
    t('{done} of {total}', {
      done: progress.completed,
      total: progress.total,
    }),
    ...(progress.failed > 0
      ? [
          t('{count, plural, =1 {1 failed} other {# failed}}', {
            count: progress.failed,
          }),
        ]
      : []),
  ].join(' · ');

  return (
    <ChatCard>
      <ChatCardFold
        defaultOpen={!(progress.done && progress.failed === 0)}
        tile={<ChatCardTile kind="bits" icon={Zap} />}
        title={progress.label}
        meta={meta}
        trailing={<ChatStatusText status={status} />}
      >
        <ChatCardBody>
          <Progress
            value={percentage}
            className="h-1.5 bg-gray-4"
            indicatorClassName={cn(
              'transition-all duration-500',
              BAR_CLASS[status],
            )}
          />
          {progress.done && failures.length > 0 && (
            <FailureList failures={failures} />
          )}
        </ChatCardBody>
      </ChatCardFold>
    </ChatCard>
  );
}

function FailureList({ failures }: { failures: BatchProgressData['results'] }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? failures : failures.slice(0, VISIBLE_FAILURES);
  const hasMore = failures.length > VISIBLE_FAILURES;

  return (
    <div className="flex flex-col">
      <ul className="flex flex-col">
        {visible.map((failure) => (
          <li
            key={failure.index}
            className="flex min-w-0 items-start gap-3 border-t border-gray-6 py-2 text-sm"
          >
            <span className="shrink-0 tabular-nums text-gray-11">
              #{failure.index + 1}
            </span>
            <span className="min-w-0 flex-1 break-words text-right text-danger-11">
              {cleanErrorText(failure.error ?? t('Unknown error'))}
            </span>
          </li>
        ))}
      </ul>
      {hasMore && (
        <div className="border-t border-gray-6 pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-11"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll
              ? t('Show less')
              : t(
                  '{count, plural, =1 {Show all 1 failed} other {Show all # failed}}',
                  { count: failures.length },
                )}
          </Button>
        </div>
      )}
    </div>
  );
}

function cleanErrorText(text: string): string {
  return text.replace(/^[❌⏳✅]\s*/u, '');
}

const VISIBLE_FAILURES = 3;

const BAR_CLASS: Record<ChatStatus, string> = {
  working: 'bg-accent-9',
  'needs-you': 'bg-accent-9',
  done: 'bg-success-9',
  failed: 'bg-danger-9',
  stopped: 'bg-gray-9',
};
