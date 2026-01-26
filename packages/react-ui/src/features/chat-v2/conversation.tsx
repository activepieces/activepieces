import { ConversationMessage } from '@activepieces/shared';

import { LLMMessage } from './llm-message';
import { UserMessage } from './user-message';

interface ConversationProps {
  conversation: ConversationMessage[];
  className?: string;
}

export function Conversation({ conversation, className }: ConversationProps) {
  return (
    <div className={className}>
      {conversation.map((message, index) =>
        message.role === 'assistant' ? (
          <LLMMessage
            key={index}
            message={message}
          />
        ) : (
          <UserMessage key={index} message={message} />
        ),
      )}
    </div>
  );
}
