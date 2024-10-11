import * as React from 'react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

type ChatMessageListProps = React.HTMLAttributes<HTMLDivElement>;

const ChatMessageList = React.forwardRef<HTMLDivElement, ChatMessageListProps>(
  ({ className, children, ...props }, ref) => (
    <ScrollArea className="h-full w-full">
      <div
        className={cn('flex flex-col w-full h-full p-4 gap-6', className)}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    </ScrollArea>
  ),
);

ChatMessageList.displayName = 'ChatMessageList';

export { ChatMessageList };
