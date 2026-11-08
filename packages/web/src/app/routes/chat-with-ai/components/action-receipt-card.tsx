import { isObject } from '@activepieces/core-utils';
import { ActionReceiptEvent } from '@activepieces/shared';
import { t } from 'i18next';
import { useState } from 'react';

import { SimpleJsonViewer } from '@/components/custom/simple-json-viewer';
import { SmartOutputFriendlyView } from '@/components/custom/smart-output-viewer';
import { Button } from '@/components/ui/button';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';

import { normalizePieceName } from '../lib/message-parsers';

import {
  ChatCard,
  ChatCardBody,
  ChatCardFold,
  ChatCardHeader,
  ChatCardTile,
} from './chat-ui/chat-card';
import { ChatStatusText } from './chat-ui/chat-status';
import { chatStatusUtils } from './chat-ui/chat-status-utils';

export function ActionReceiptCard({
  receipt,
  doneTitle,
  flat,
}: ActionReceiptCardProps) {
  const pieceName = normalizePieceName(receipt.pieceName);
  const { summary } = piecesHooks.usePieceSummary({ name: pieceName });
  const status = chatStatusUtils.fromReceipt(receipt.status);
  const failed = receipt.status === 'failed';
  const errorMessage = failed ? receipt.errorMessage : undefined;
  const hasOutput = receipt.output != null;
  const title = doneTitle ?? receipt.actionDisplayName;
  const meta = joinMeta(
    errorMessage
      ? [summary?.displayName, errorMessage]
      : [
          summary?.displayName,
          receipt.connectionLabel,
          formatTimestamp(receipt.timestamp),
        ],
  );
  const tile = <ChatCardTile kind="app" pieceName={pieceName} />;
  const trailing = <ChatStatusText status={status} />;

  if (!hasOutput && !errorMessage) {
    return (
      <ChatCard flat={flat}>
        <ChatCardHeader
          tile={tile}
          title={title}
          meta={meta}
          trailing={trailing}
        />
      </ChatCard>
    );
  }

  return (
    <ChatCard flat={flat}>
      <ChatCardFold
        defaultOpen={false}
        tile={tile}
        title={title}
        meta={meta}
        trailing={trailing}
      >
        <ChatCardBody>
          {errorMessage && (
            <p className="break-words text-sm text-danger-11">{errorMessage}</p>
          )}
          {hasOutput && <ReceiptOutput output={receipt.output} />}
        </ChatCardBody>
      </ChatCardFold>
    </ChatCard>
  );
}

function ReceiptOutput({ output }: { output: unknown }) {
  const [showJson, setShowJson] = useState(false);
  const json = tryParseJson(output);
  const hasFriendlyView =
    typeof json === 'string' ||
    (Array.isArray(json) && json.length > 0) ||
    isObject(json);

  return (
    <div className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-gray-5">
      <div className="max-h-80 overflow-auto">
        {hasFriendlyView && !showJson ? (
          <SmartOutputFriendlyView json={json} />
        ) : (
          <SimpleJsonViewer
            data={json}
            hideCopyButton={true}
            maxHeight={320}
            fontSize="12px"
          />
        )}
      </div>
      {hasFriendlyView && (
        <div className="border-t border-gray-5 px-2 py-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-11"
            onClick={() => setShowJson(!showJson)}
          >
            {showJson ? t('View as fields') : t('View as JSON')}
          </Button>
        </div>
      )}
    </div>
  );
}

function joinMeta(values: Array<string | undefined>): string | undefined {
  const parts = values.filter((value): value is string => Boolean(value));
  return parts.length > 0 ? parts.join(' · ') : undefined;
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return timestamp;
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function tryParseJson(value: unknown): unknown {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

type ActionReceiptCardProps = {
  receipt: ActionReceiptEvent;
  doneTitle?: string;
  flat?: boolean;
};
