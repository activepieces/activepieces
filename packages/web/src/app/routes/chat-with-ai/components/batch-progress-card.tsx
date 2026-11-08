import { BatchProgressData } from '@activepieces/shared';
import { t } from 'i18next';
import { Zap } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
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
  ended = false,
}: {
  progress: BatchProgressData;
  ended?: boolean;
}) {
  const status = chatStatusUtils.fromBatch({ progress, ended });
  const failures = progress.results.filter((result) => !result.success);
  const countText = t('{done} of {total}', {
    done: progress.done ? progress.succeeded : progress.completed,
    total: progress.total,
  });
  const failedText =
    progress.failed > 0
      ? t('{count, plural, =1 {1 failed} other {# failed}}', {
          count: progress.failed,
        })
      : null;

  return (
    <ChatCard>
      <ChatCardFold
        defaultOpen={!(progress.done && progress.failed === 0)}
        tile={<ChatCardTile kind="bits" icon={Zap} />}
        title={progress.label}
        meta={
          <>
            {countText}
            {failedText && (
              <>
                {' · '}
                <span className="text-danger-11">{failedText}</span>
              </>
            )}
          </>
        }
        metaText={failedText ? `${countText} · ${failedText}` : countText}
        trailing={<ChatStatusText status={status} />}
      >
        <ChatCardBody>
          <BatchBar progress={progress} status={status} />
          {progress.done && failures.length > 0 && (
            <FailureList failures={failures} />
          )}
        </ChatCardBody>
      </ChatCardFold>
    </ChatCard>
  );
}

function BatchBar({
  progress,
  status,
}: {
  progress: BatchProgressData;
  status: ChatStatus;
}) {
  const share = (count: number) =>
    progress.total > 0 ? `${(count / progress.total) * 100}%` : '0%';
  const succeeded = Math.max(progress.completed - progress.failed, 0);
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={progress.total}
      aria-valuenow={progress.completed}
      className="flex h-1.5 w-full overflow-hidden rounded-full bg-gray-4"
    >
      <div
        className={cn('h-full transition-all duration-500', BAR_CLASS[status])}
        style={{ width: share(succeeded) }}
      />
      <div
        className="h-full bg-danger-9 transition-all duration-500"
        style={{ width: share(progress.failed) }}
      />
    </div>
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
            <span className="min-w-0 flex-1 break-words text-danger-11">
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
