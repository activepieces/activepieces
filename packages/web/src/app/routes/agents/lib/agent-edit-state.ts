function sameConfig({
  left,
  right,
}: {
  left: unknown;
  right: unknown;
}): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function modelPickChanged({
  picked,
  current,
}: {
  picked: ModelPick;
  current: ModelPick;
}): boolean {
  const same = (left?: string | null, right?: string | null) =>
    (left ?? null) === (right ?? null);
  return !(
    same(picked.provider, current.provider) &&
    same(picked.modelName, current.modelName) &&
    same(picked.providerConfigId, current.providerConfigId)
  );
}

function serverMovedWhileTyping({
  fromServer,
  lastSeen,
  unsavedTyping,
}: {
  fromServer: unknown;
  lastSeen: unknown;
  unsavedTyping: boolean;
}): boolean {
  return unsavedTyping && !sameConfig({ left: fromServer, right: lastSeen });
}

function leaveGuard({
  blockerState,
  exitRequested,
}: {
  blockerState: string;
  exitRequested: boolean;
}): LeaveGuard {
  if (blockerState !== 'blocked' && !exitRequested) {
    return { open: false, discardAction: 'none' };
  }
  return {
    open: true,
    discardAction: blockerState === 'blocked' ? 'proceed' : 'exit',
  };
}

function createWriteLock(): WriteLock {
  let held = false;
  return {
    claim: () => {
      if (held) return false;
      held = true;
      return true;
    },
    release: () => {
      held = false;
    },
    held: () => held,
  };
}

export const agentEditState = {
  sameConfig,
  serverMovedWhileTyping,
  modelPickChanged,
  leaveGuard,
  createWriteLock,
};

export type ModelPick = {
  provider?: string | null;
  modelName?: string | null;
  providerConfigId?: string | null;
};
export type LeaveGuard = {
  open: boolean;
  discardAction: 'proceed' | 'exit' | 'none';
};
export type WriteLock = {
  claim: () => boolean;
  release: () => void;
  held: () => boolean;
};
