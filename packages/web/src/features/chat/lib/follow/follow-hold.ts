import { create } from 'zustand';

// What the user is doing in the chat that should keep the AI from opening a
// page under them. The chat reports it; the follow-along controller re-checks
// whenever it changes.
export const useFollowHold = create<FollowHold>(() => ({
  drafting: false,
  scrolledUp: false,
  gateOpen: false,
}));

function report(patch: Partial<FollowHold>): void {
  const current = useFollowHold.getState();
  const changed = (Object.keys(patch) as (keyof FollowHold)[]).some(
    (key) => patch[key] !== current[key],
  );
  if (changed) useFollowHold.setState(patch);
}

function holds({ fullPage }: { fullPage: boolean }): boolean {
  const { drafting, scrolledUp, gateOpen } = useFollowHold.getState();
  return gateOpen || (fullPage && (drafting || scrolledUp));
}

export const followHold = { report, holds };

type FollowHold = {
  drafting: boolean;
  scrolledUp: boolean;
  gateOpen: boolean;
};
