import * as React from 'react';

import { ResizableTextareaProps, Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface ChatInputProps extends ResizableTextareaProps {
  button?: React.ReactNode;
}

const ChatInput = React.forwardRef<HTMLTextAreaElement, ChatInputProps>(
  ({ className, button, ...props }, ref) => (
    <div className="flex flex-col w-full bg-muted rounded-xl p-2">
      <div className="relative flex-1">
        <Textarea
          autoComplete="off"
          ref={ref}
          name="message"
          className={cn(
            'px-4 py-3 bg-muted text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 w-full flex items-center resize-none border-0 p-3 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:ring-offset-background',
            className,
          )}
          {...props}
        />
      </div>
      <div className="flex justify-end">
        {button}
      </div>
    </div>
  ),
);
ChatInput.displayName = 'ChatInput';

export { ChatInput };
