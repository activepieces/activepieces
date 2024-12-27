import { ChatBubble, ChatBubbleMessage } from "@/components/ui/chat/chat-bubble";
import { CopilotAvatar } from "./copilot-avatar";

export const WelcomeMessage = () => (
  <ChatBubble variant="received">
    <CopilotAvatar />
    <ChatBubbleMessage>
      Hi! I'm Lotfi, your AI assistant. How can I help you today?
    </ChatBubbleMessage>
  </ChatBubble>
); 