import { t } from 'i18next';
import { Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ChatUIMessage, chatPartUtils } from '@/features/chat/lib/chat-types';
import { resourceRegistry } from '@/features/chat/lib/resources/registry';

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
      resourceRegistry.outcome(part.output) === 'timeout',
  );
}
