import { ChatBubble, ChatBubbleMessage } from "@/components/ui/chat/chat-bubble";

export const UserMessage = ({ message }: { message: string }) => (
  <ChatBubble variant="sent">
    <ChatBubbleMessage>
      {message}
    </ChatBubbleMessage>
  </ChatBubble>
); 