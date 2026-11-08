/**
 * @vitest-environment jsdom
 */
import { AppConnectionStatus } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ConnectionPickerCard } from '@/app/routes/chat-with-ai/components/connection-picker-card';
import { ConnectionPickerData } from '@/app/routes/chat-with-ai/lib/message-parsers';

const getPickerConnections = vi.hoisted(() =>
  vi.fn(() => new Promise<never>(() => undefined)),
);

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('@/features/chat/lib/chat-api', () => ({
  chatApi: { getPickerConnections },
}));
vi.mock('@/features/connections/api/app-connections', () => ({
  appConnectionsApi: { list: async () => ({ data: [] }) },
}));
vi.mock('@/features/pieces', () => ({
  piecesHooks: {
    usePiece: () => ({ pieceModel: undefined, isLoading: false }),
  },
}));
vi.mock('@/features/pieces/components/piece-icon-from-name', () => ({
  PieceIconWithPieceName: () => null,
}));
vi.mock('@/app/connections/create-edit-connection-dialog', () => ({
  CreateOrEditConnectionDialog: () => null,
}));
vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: { getProjectId: () => 'project-current' },
}));
vi.mock('@/app/routes/chat-with-ai/lib/use-conversation-id', () => ({
  useConversationId: () => 'conversation-1',
}));

afterEach(() => {
  cleanup();
  getPickerConnections.mockClear();
});

describe('ConnectionPickerCard', () => {
  it('resolves once with the default healthy account on Continue', async () => {
    const { onResolve } = renderPicker({ picker: PICKER });

    fireEvent.click(await screen.findByRole('button', { name: 'Continue' }));

    expect(onResolve).toHaveBeenCalledTimes(1);
    expect(onResolve).toHaveBeenCalledWith({
      connectionExternalId: 'conn-work',
      projectId: 'project-1',
      label: 'Work Slack',
    });
  });

  it('does not let an expired account be picked', async () => {
    renderPicker({ picker: PICKER });

    const expired = await screen.findByRole('option', { name: /Old Slack/ });
    expect(expired.hasAttribute('disabled')).toBe(true);
  });

  it('resolves with the account the user picks', async () => {
    const { onResolve } = renderPicker({ picker: PICKER });

    fireEvent.click(await screen.findByRole('option', { name: /Home Slack/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(onResolve).toHaveBeenCalledWith({
      connectionExternalId: 'conn-home',
      projectId: 'project-1',
      label: 'Home Slack',
    });
  });

  it('dismisses on Skip', async () => {
    const { onDismiss } = renderPicker({ picker: PICKER });

    fireEvent.click(await screen.findByRole('button', { name: 'Skip' }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

function renderPicker({ picker }: { picker: ConnectionPickerData }) {
  const onResolve = vi.fn();
  const onDismiss = vi.fn();
  render(
    <Providers>
      <ConnectionPickerCard
        picker={picker}
        onResolve={onResolve}
        onDismiss={onDismiss}
      />
    </Providers>,
  );
  return { onResolve, onDismiss };
}

function Providers({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const PICKER: ConnectionPickerData = {
  piece: 'slack',
  displayName: 'Slack',
  connections: [
    {
      label: 'Work Slack',
      project: 'Marketing',
      externalId: 'conn-work',
      projectId: 'project-1',
      status: AppConnectionStatus.ACTIVE,
    },
    {
      label: 'Home Slack',
      project: 'Marketing',
      externalId: 'conn-home',
      projectId: 'project-1',
      status: AppConnectionStatus.ACTIVE,
    },
    {
      label: 'Old Slack',
      project: 'Marketing',
      externalId: 'conn-old',
      projectId: 'project-1',
      status: AppConnectionStatus.ERROR,
    },
  ],
};
