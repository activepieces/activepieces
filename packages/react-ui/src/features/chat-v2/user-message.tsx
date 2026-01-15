import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/user-avatar';

interface UserMessageProps {
  className?: string;
  text: string;
}

export function UserMessage({ className, text }: UserMessageProps) {
  return (
    <div className="flex items-start gap-2 justify-end ml-auto max-w-[70%]">
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'text-base',
            className
          )}
        >
          {text}
        </div>
      </div>
    </div>
  );
}

