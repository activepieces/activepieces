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

export function parseAnswerPairs(text: string): AnswerPair[] {
  return text
    .split('\n')
    .filter((line) => line.startsWith('- **'))
    .map((line) => {
      const match = line.match(/^- \*\*(.+?)\*\*\s*(.*)$/);
      return match ? { question: match[1], answer: match[2] } : null;
    })
    .filter((p): p is AnswerPair => p !== null);
}

export type { MultiQuestion } from '@/features/chat/lib/chat-store-types';

export type AnswerPair = {
  question: string;
  answer: string;
};

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
  question?: string;
  suggestedProjects: Array<{
    name: string;
    id: string;
  }>;
};
