import { chatDom } from '@/features/chat/lib/chat-dom';
import { isEditableTarget } from '@/lib/dom-utils';

function isBusyIn(focused: Element | null): boolean {
  return (
    focused !== null &&
    !chatDom.inChat(focused) &&
    (isEditableTarget(focused) ||
      focused.closest(chatDom.OVERLAY_SELECTOR) !== null)
  );
}

export const pageFocus = { isBusyIn };
