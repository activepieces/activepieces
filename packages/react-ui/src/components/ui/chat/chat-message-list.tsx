import * as React from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatMessageListProps extends React.HTMLAttributes<HTMLDivElement> { }

const ChatMessageList = React.forwardRef<HTMLDivElement, ChatMessageListProps>(
  ({ className, children, ...props }, ref) => (
    <ScrollArea className="h-full w-full">
      <div
        className={cn(
          "flex flex-col w-full h-full p-4 gap-6",
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    </ScrollArea>
  ),
);

ChatMessageList.displayName = "ChatMessageList";

export { ChatMessageList };
