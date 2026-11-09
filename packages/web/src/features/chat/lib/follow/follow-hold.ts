import { create } from 'zustand';

import { useChatPanel } from '@/features/workspace/lib/chat-panel-open';

// What the user is doing in the chat that should keep the AI from opening a
// page under them: an open approval card (chat panel store), a draft in the
// full-page composer, or reading back up the full-page chat. The controller
// re-checks whenever any of it changes.
export const useFollowHold = create<FollowHold>(() => ({
  drafting: false,
  scrolledUp: false,
}));

function report(patch: Partial<FollowHold>): void {
  const current = useFollowHold.getState();
  const changed = (Object.keys(patch) as (keyof FollowHold)[]).some(
    (key) => patch[key] !== current[key],
  );
  if (changed) useFollowHold.setState(patch);
}

function holds({ fullPage }: { fullPage: boolean }): boolean {
  const { drafting, scrolledUp } = useFollowHold.getState();
  const { gateOpen } = useChatPanel.getState();
  return gateOpen || (fullPage && (drafting || scrolledUp));
}

export const followHold = { report, holds };

type FollowHold = {
  drafting: boolean;
  scrolledUp: boolean;
};
