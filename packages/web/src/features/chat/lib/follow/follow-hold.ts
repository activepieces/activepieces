import { create } from 'zustand';

import { useChatPanel } from '@/features/workspace/lib/chat-panel-open';

// What the user is doing that should keep the AI from opening a page under
// them: an open approval card (chat panel store), a draft in the full-page
// composer, reading back up the full-page chat, or a pointer held down on the
// page (a drag or a text selection). The controller re-checks whenever any of
// it changes.
export const useFollowHold = create<FollowHold>(() => ({
  drafting: false,
  scrolledUp: false,
  pressing: false,
}));

function report(patch: Partial<FollowHold>): void {
  const current = useFollowHold.getState();
  const changed = (Object.keys(patch) as (keyof FollowHold)[]).some(
    (key) => patch[key] !== current[key],
  );
  if (changed) useFollowHold.setState(patch);
}

function holds({ fullPage }: { fullPage: boolean }): boolean {
  const { drafting, scrolledUp, pressing } = useFollowHold.getState();
  const { gateOpen } = useChatPanel.getState();
  return pressing || gateOpen || (fullPage && (drafting || scrolledUp));
}

function pagePressed(): boolean {
  return useFollowHold.getState().pressing;
}

export const followHold = { report, holds, pagePressed };

type FollowHold = {
  drafting: boolean;
  scrolledUp: boolean;
  pressing: boolean;
};
