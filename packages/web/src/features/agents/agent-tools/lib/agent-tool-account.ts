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

function label({
  tools,
  connections,
  connectionsComplete,
}: {
  tools: AgentPieceTool[];
  connections: { externalId: string; displayName: string }[];
  connectionsComplete: boolean;
}): string | null {
  if (tools.length === 0) {
    return null;
  }
  const externalIds = [...new Set(tools.map(pinnedExternalId))];
  if (externalIds.some(isNil)) {
    return t('Connect an account');
  }
  if (externalIds.length > 1) {
    return t('Different account per action');
  }
  const pinned = connections.find(
    (connection) => connection.externalId === externalIds[0],
  );
  if (!isNil(pinned)) {
    return pinned.displayName;
  }
  // Absent from a list we know is partial proves nothing, and a wrong "deleted" is worse than
  // saying nothing at all.
  return connectionsComplete ? t('Account was deleted') : null;
}

export const agentToolAccount = { label, requiresAccount };
