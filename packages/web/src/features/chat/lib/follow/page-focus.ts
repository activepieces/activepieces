import { chatDom } from '@/features/chat/lib/chat-dom';

function isBusyIn(focused: Element | null): boolean {
  return (
    focused !== null && !chatDom.inChat(focused) && focused.closest(BUSY) !== null
  );
}

const BUSY =
  'input, textarea, select, [contenteditable="true"], [role="dialog"], [role="alertdialog"]';

export const pageFocus = { isBusyIn };
