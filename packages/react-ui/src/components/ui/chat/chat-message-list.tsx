import * as React from 'react';

import { cn } from '@/lib/utils';

type ChatMessageListProps = React.HTMLAttributes<HTMLDivElement>;

const ChatMessageList = React.forwardRef<HTMLDivElement, ChatMessageListProps>(
  ({ className, children, ...props }, ref) => (
    <div className="h-full w-full flex items-center justify-center overflow-y-auto">
      <div
        className={cn('flex flex-col w-full h-full p-4 gap-2', className)}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    </div>
  ),
);

ChatMessageList.displayName = 'ChatMessageList';

export { ChatMessageList };
