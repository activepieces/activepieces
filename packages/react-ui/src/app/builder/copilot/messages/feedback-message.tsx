import { Button } from "@/components/ui/button";
import { ChatBubble, ChatBubbleMessage } from "@/components/ui/chat/chat-bubble";
import { CheckIcon, Cross2Icon } from "@radix-ui/react-icons";
import { CopilotAvatar } from "../copilot-avatar";

type FeedbackMessageProps = {
  message: string;
}

export const FeedbackMessage = ({ message }: FeedbackMessageProps) => (
  <ChatBubble variant="received">
    <CopilotAvatar />
    <ChatBubbleMessage>
      <div className="flex flex-col gap-4">
        <div>{message}</div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="rounded-full text-green-600 hover:text-green-700 hover:bg-green-50"
            onClick={() => {}}
          >
            <CheckIcon className="w-4 h-4 mr-2" />
            Accept
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="rounded-full text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => {}}
          >
            <Cross2Icon className="w-4 h-4 mr-2" />
            Reject
          </Button>
        </div>
      </div>
    </ChatBubbleMessage>
  </ChatBubble>
);