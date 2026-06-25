import { AppConnectionStatus } from '@activepieces/shared';

import { ChatUIMessage } from '@/features/chat/lib/chat-types';

export function normalizePieceName(piece: string): string {
  const shortName = piece.replace(/[^a-z0-9-]/gi, '');
  return piece.startsWith('@activepieces/')
    ? piece
    : `@activepieces/piece-${shortName}`;
}

export function isConnectionHealthy(status: string): boolean {
  return status === AppConnectionStatus.ACTIVE;
}

export function pickDefaultConnectionExternalId({
  healthy,
  updatedByExternalId,
}: {
  healthy: Array<{ externalId: string }>;
  updatedByExternalId: Record<string, string | undefined>;
}): string | null {
  if (healthy.length === 0) return null;
  const sorted = [...healthy].sort((a, b) => {
    const aUpdated = updatedByExternalId[a.externalId];
    const bUpdated = updatedByExternalId[b.externalId];
    if (aUpdated && bUpdated) return bUpdated.localeCompare(aUpdated);
    if (aUpdated) return -1;
    if (bUpdated) return 1;
    return 0;
  });
  return sorted[0].externalId;
}

export function getTextFromParts(parts: ChatUIMessage['parts']): string {
  return parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('');
}

export type { MultiQuestion } from '@/features/chat/lib/chat-store-types';

export type ConnectionPickerData = {
  piece: string;
  displayName: string;
  connections?: Array<{
    label: string;
    project: string;
    externalId: string;
    projectId: string;
    status: AppConnectionStatus;
  }>;
};

export type ProjectPickerData = {
  suggestedProjects: Array<{
    name: string;
    id: string;
  }>;
};
