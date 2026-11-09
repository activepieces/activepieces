import { chatLayoutUtils } from '@/features/workspace/lib/chat-layout';

function inChat(target: EventTarget | null | undefined): boolean {
  return (
    target instanceof Element &&
    target.closest(`#${chatLayoutUtils.PANEL_ID}`) !== null
  );
}

export const chatDom = {
  inChat,
};
