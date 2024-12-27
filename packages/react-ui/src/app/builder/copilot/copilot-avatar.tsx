import { ChatBubbleAvatar } from "@/components/ui/chat/chat-bubble";

export const CopilotAvatar = () => (
  <ChatBubbleAvatar
    src="src/assets/img/custom/lotfi-avatar.png"
    fallback="L"
    className="rounded-full size-112"
  />
);