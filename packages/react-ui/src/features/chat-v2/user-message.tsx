import { cn } from '@/lib/utils';
import { UserConversationMessage } from '@activepieces/shared';

interface UserMessageProps {
  className?: string;
  message: UserConversationMessage;
}

export function UserMessage({ className, message }: UserMessageProps) {
  return (
    <div className="flex items-start gap-2 justify-end ml-auto max-w-[70%]">
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'text-base',
            className
          )}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}

