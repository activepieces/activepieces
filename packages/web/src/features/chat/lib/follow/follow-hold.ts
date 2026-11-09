import { create } from 'zustand';

import { useChatPanel } from '@/features/workspace/lib/chat-panel-open';

const useFollowHold = create<FollowHold>(() => ({
  drafting: false,
  scrolledUp: false,
  pressing: false,
}));

function report(patch: Partial<FollowHold>): void {
  const current = useFollowHold.getState();
  const changed = Object.entries(patch).some(
    ([key, value]) => Reflect.get(current, key) !== value,
  );
  if (changed) useFollowHold.setState(patch);
}

function holds({ fullPage }: { fullPage: boolean }): boolean {
  const { drafting, scrolledUp } = useFollowHold.getState();
  const { gateOpen } = useChatPanel.getState();
  return gateOpen || (fullPage && (drafting || scrolledUp));
}

function pagePressed(): boolean {
  return useFollowHold.getState().pressing;
}

const followHold = { report, holds, pagePressed };

export { useFollowHold, followHold };

type FollowHold = {
  drafting: boolean;
  scrolledUp: boolean;
  pressing: boolean;
};
