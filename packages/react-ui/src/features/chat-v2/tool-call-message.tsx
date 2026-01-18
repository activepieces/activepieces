import { t } from 'i18next';
import { ListTodo, Wrench } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  ConversationMessage,
  ToolCallConversationMessage,
} from '@activepieces/shared';

interface ToolCallMessageProps {
  message: ToolCallConversationMessage;
  conversation: ConversationMessage[];
  className?: string;
}

export function ToolCallMessage({
  message,
  conversation,
  className,
}: ToolCallMessageProps) {
  const isWriteTodos = message.toolName === 'write_todos';

  const isCompleted = conversation.some(
    (msg) =>
      msg.role === 'assistant' &&
      msg.parts.some(
        (part) =>
          part.type === 'tool-result' && part.toolCallId === message.toolCallId,
      ),
  );

  const getIcon = () => {
    if (isWriteTodos) {
      return <ListTodo className="size-4  shrink-0" />;
    }
    return <Wrench className="size-4 text-muted-foreground shrink-0" />;
  };

  const getLabel = () => {
    if (isWriteTodos) {
      return isCompleted ? t('Planning completed') : t('Planning...');
    }
    return isCompleted
      ? t('Used {{toolName}}', { toolName: message.toolName })
      : t('Using {{toolName}}', { toolName: message.toolName });
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-sm text-muted-foreground py-1',
        className,
      )}
    >
      {getIcon()}
      <span>{getLabel()}</span>
    </div>
  );
}
