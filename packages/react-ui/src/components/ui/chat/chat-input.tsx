import * as React from 'react';

import { ResizableTextareaProps, Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const ChatInput = React.forwardRef<HTMLTextAreaElement, ResizableTextareaProps>(
  ({ className, ...props }, ref) => (
    <Textarea
      autoComplete="off"
      ref={ref}
      name="message"
      className={cn(
        ' px-4 py-3 bg-muted text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-full flex items-center resize-none border-0 p-3 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:ring-offset-background',
        className,
      )}
      {...props}
    />
  ),
);
ChatInput.displayName = 'ChatInput';

export { ChatInput };
