import { connectionTemplate, isNil } from '@activepieces/core-utils';
import { AgentPieceTool } from '@activepieces/shared';
import { t } from 'i18next';

function pinnedExternalId(tool: AgentPieceTool): string | null {
  return connectionTemplate.unwrapExternalId(
    tool.pieceMetadata.predefinedInput?.auth,
  );
}

function requiresAccount({
  pieceHasAuth,
  actionRequireAuth,
}: {
  pieceHasAuth: boolean;
  actionRequireAuth: boolean | undefined;
}): boolean {
  // The framework defaults an action to requiring auth, so an action we cannot find is assumed to
  // need one rather than quietly labelled as fine.
  return pieceHasAuth && actionRequireAuth !== false;
}

function listIsComplete({
  isSuccess,
  isFetching,
  count,
  pageSize,
}: {
  isSuccess: boolean;
  isFetching: boolean;
  count: number;
  pageSize: number;
}): boolean {
  // Cached data counts as success while a refetch is still running, and that page can predate a
  // connection made a moment ago, so a fetch in flight means we do not yet know the full list.
  if (!isSuccess || isFetching) {
    return false;
  }
  // A full page means there may be more we cannot see.
  return count < pageSize;
}

function resolve({
  tools,
  connections,
  connectionsComplete,
}: {
  tools: AgentPieceTool[];
  connections: { externalId: string; displayName: string }[];
  connectionsComplete: boolean;
}): AccountStatus | null {
  if (tools.length === 0) {
    return null;
  }
  const externalIds = [...new Set(tools.map(pinnedExternalId))];
  if (externalIds.some(isNil)) {
    return { state: 'missing', text: t('Connect an account') };
  }
  if (externalIds.length > 1) {
    return { state: 'mixed', text: t('Different account per action') };
  }
  const pinned = connections.find(
    (connection) => connection.externalId === externalIds[0],
  );
  if (!isNil(pinned)) {
    return { state: 'connected', text: pinned.displayName };
  }
  // Absent from a list we know is partial proves nothing, and a wrong "deleted" is worse than
  // saying nothing at all.
  return connectionsComplete
    ? { state: 'deleted', text: t('Account was deleted') }
    : null;
}

function label(params: {
  tools: AgentPieceTool[];
  connections: { externalId: string; displayName: string }[];
  connectionsComplete: boolean;
}): string | null {
  return resolve(params)?.text ?? null;
}

export const agentToolAccount = {
  label,
  listIsComplete,
  requiresAccount,
  resolve,
};

export type AccountStatus = {
  state: 'connected' | 'missing' | 'mixed' | 'deleted';
  text: string;
};
