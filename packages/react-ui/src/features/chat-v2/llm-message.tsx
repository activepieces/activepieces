import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { ApMarkdown } from '@/components/custom/markdown';
import { cn } from '@/lib/utils';
import {
  AssistantConversationMessage,
  MarkdownVariant,
} from '@activepieces/shared';

import { Thinking } from './thinking';
import { Plan } from './todo';

interface LLMMessageProps {
  message: AssistantConversationMessage;
  className?: string;
}

export function LLMMessage({ message, className }: LLMMessageProps) {
  const fullText = message.parts
    .map((msg) => {
      if (msg.type === 'text') return msg.message;
      if (msg.type === 'plan')
        return msg.items.map((item) => item.text).join('\n');
      return '';
    })
    .join('\n\n');

  const hasNoMessage =
    message.parts.length === 0 || fullText.trim().length === 0;

  if (hasNoMessage) {
    return <Thinking className={className} />;
  }

  return (
    <div
      className={cn(
        'group text-base max-w-[70%] space-y-4 flex items-start gap-2',
        className,
      )}
    >
      <div className="flex-1 space-y-4">
        {message.parts.map((message, index) => {
          if (message.type === 'text') {
            return (
              <ApMarkdown
                key={index}
                markdown={message.message}
                variant={MarkdownVariant.BORDERLESS}
              />
            );
          }

          if (message.type === 'plan') {
            return <Plan key={index} items={message.items} />;
          }

          return null;
        })}
        <div className="h-5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
          <CopyButton
            textToCopy={fullText}
            variant="ghost"
            className="h-5 w-5 p-0"
          />
        </div>
      </div>
    </div>
  );
}
