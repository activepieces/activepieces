import { ChatBubbleAvatar } from "@/components/ui/chat/chat-bubble";

export const CopilotAvatar = () => (
  <ChatBubbleAvatar
    src="src/assets/img/custom/copilot.webp"
    fallback="L"
    className="rounded-full size-10"
  />
);