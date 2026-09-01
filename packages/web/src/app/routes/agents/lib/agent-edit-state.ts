import { isNil } from '@activepieces/core-utils';

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

function headerStatus({
  needsModel,
  justLaunched,
  live,
  hasChanges,
}: {
  needsModel: boolean;
  justLaunched: boolean;
  live: unknown;
  hasChanges: boolean;
}): HeaderStatus {
  if (justLaunched) {
    return 'live';
  }
  if (needsModel) {
    return 'needs-model';
  }
  return !isNil(live) && !hasChanges ? 'live' : 'pending';
}

function modeIntent({
  next,
  unsavedTyping,
  blockedReason,
}: {
  next: string;
  unsavedTyping: boolean;
  blockedReason: string | null;
}): ModeIntent {
  if (next !== 'test' || !unsavedTyping || !isNil(blockedReason)) {
    return 'switch';
  }
  return 'stage';
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
  modelPickChanged,
  headerStatus,
  modeIntent,
  leaveGuard,
  createWriteLock,
};

export type ModelPick = {
  provider?: string | null;
  modelName?: string | null;
  providerConfigId?: string | null;
};
export type HeaderStatus = 'needs-model' | 'live' | 'pending';
export type ModeIntent = 'switch' | 'stage';
export type LeaveGuard = {
  open: boolean;
  discardAction: 'proceed' | 'exit' | 'none';
};
export type WriteLock = {
  claim: () => boolean;
  release: () => void;
  held: () => boolean;
};
