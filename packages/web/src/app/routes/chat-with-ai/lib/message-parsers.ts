import { AppConnectionStatus } from '@activepieces/shared';

import { ChatUIMessage } from '@/features/chat/lib/chat-types';

import type { ConnectionRequiredData } from '../components/connections-required-card';

export function normalizePieceName(piece: string): string {
  const shortName = piece.replace(/[^a-z0-9-]/gi, '');
  return piece.startsWith('@activepieces/')
    ? piece
    : `@activepieces/piece-${shortName}`;
}

export function isConnectionHealthy(status: string): boolean {
  return status === AppConnectionStatus.ACTIVE;
}

export function getTextFromParts(parts: ChatUIMessage['parts']): string {
  return parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('');
}

export function parseConnectionsInput(
  data: Record<string, unknown>,
): ConnectionRequiredData[] {
  return Array.isArray(data['connections'])
    ? (data['connections'] as unknown as ConnectionRequiredData[])
    : [data as unknown as ConnectionRequiredData];
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
