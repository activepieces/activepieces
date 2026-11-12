import { isObject, tryCatchSync } from '@activepieces/core-utils';
import { t } from 'i18next';
import { Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ChatUIMessage, chatPartUtils } from '@/features/chat/lib/chat-types';

export function ExpiredGateCard({
  onSendPrompt,
}: {
  onSendPrompt?: (text: string) => void;
}) {
  return (
    <div
      className="mt-2 flex items-center gap-2 rounded-lg border border-gray-6 bg-gray-2 px-3 py-2 text-sm"
      data-testid="chat-expired-gate"
    >
      <Clock className="size-4 shrink-0 text-gray-11" aria-hidden />
      <span className="min-w-0 flex-1 text-gray-12">
        {t('This request expired.')}
      </span>
      {onSendPrompt && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onSendPrompt(t("I'm back. Please ask me again."))}
        >
          {t('Ask again')}
        </Button>
      )}
    </div>
  );
}

export function hasExpiredGate(parts: ChatUIMessage['parts']): boolean {
  return parts.some(
    (part) =>
      chatPartUtils.isAnyToolPart(part) &&
      part.state === 'output-available' &&
      isTimedOut(part.output),
  );
}

function isTimedOut(output: unknown): boolean {
  const parsed =
    typeof output === 'string'
      ? tryCatchSync<unknown>(() => JSON.parse(output)).data ?? output
      : output;
  if (typeof parsed === 'string') return isGateTimeoutText(parsed);
  if (!isObject(parsed)) return false;
  if (parsed['timedOut'] === true) return true;
  return isGateTimeoutText(firstText(parsed));
}

function firstText(output: Record<string, unknown>): string | null {
  const content = output['content'];
  if (Array.isArray(content)) {
    const first: unknown = content[0];
    if (isObject(first) && typeof first['text'] === 'string') {
      return first['text'];
    }
  }
  const message = output['message'];
  if (typeof message === 'string') return message;
  const error = output['error'];
  return typeof error === 'string' ? error : null;
}

function isGateTimeoutText(text: string | null): boolean {
  return text !== null && text.trimStart().startsWith(GATE_TIMEOUT_PREFIX);
}

const GATE_TIMEOUT_PREFIX = "⏳ The user hasn't responded";
