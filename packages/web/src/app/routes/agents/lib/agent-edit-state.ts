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

function adoptsPickedModel({
  values,
  syncedDraft,
}: {
  values: AgentDraftShape;
  syncedDraft: AgentDraftShape;
}): boolean {
  const hadNoModel =
    syncedDraft.draft.modelName === null ||
    syncedDraft.draft.modelName === undefined ||
    syncedDraft.draft.modelName === '';
  if (!hadNoModel) {
    return false;
  }
  const withoutModel = (shape: AgentDraftShape) => ({
    ...shape,
    draft: {
      ...shape.draft,
      provider: null,
      modelName: null,
      providerConfigId: null,
    },
  });
  return (
    values.draft.modelName !== syncedDraft.draft.modelName &&
    sameConfig({ left: withoutModel(values), right: withoutModel(syncedDraft) })
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
  adoptsPickedModel,
  headerStatus,
  modeIntent,
  leaveGuard,
  createWriteLock,
};

export type AgentDraftShape = {
  draft: {
    provider?: unknown;
    modelName?: string | null;
    providerConfigId?: unknown;
    [key: string]: unknown;
  };
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
