import { isNil } from '@activepieces/core-utils';
import { AgentPieceTool } from '@activepieces/shared';
import { t } from 'i18next';

const CONNECTION_TEMPLATE = /^\{\{connections\['([^']+)'\]\}\}$/;

function pinnedExternalId(tool: AgentPieceTool): string | null {
  const auth = tool.pieceMetadata.predefinedInput?.auth;
  if (typeof auth !== 'string' || auth.length === 0) {
    return null;
  }
  return auth.match(CONNECTION_TEMPLATE)?.[1] ?? auth;
}

function label({
  tools,
  connections,
  needsAccount,
}: {
  tools: AgentPieceTool[];
  connections: { externalId: string; displayName: string }[];
  needsAccount: boolean;
}): string | null {
  if (!needsAccount) {
    return null;
  }
  const pinned = tools.map(pinnedExternalId);
  if (pinned.some(isNil)) {
    return t('No account');
  }
  const names = pinned.map(
    (externalId) =>
      connections.find((connection) => connection.externalId === externalId)
        ?.displayName ?? null,
  );
  const distinct = [...new Set(names)];
  if (distinct.length > 1) {
    return t('Several accounts');
  }
  return distinct[0] ?? t('Account not found');
}

export const agentToolAccount = { label, pinnedExternalId };
