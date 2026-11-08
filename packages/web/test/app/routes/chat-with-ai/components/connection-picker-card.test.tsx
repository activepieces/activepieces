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

describe('ConnectionPickerCard (characterization)', () => {
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

  it('shows Reconnect on an unhealthy row', async () => {
    renderPicker({ picker: PICKER });

    expect(
      await screen.findByRole('button', { name: 'Reconnect' }),
    ).toBeTruthy();
    expect(screen.getByText('Old Slack')).toBeTruthy();
  });

  it('renders the selected label when not interactive', () => {
    renderPicker({
      picker: PICKER,
      isInteractive: false,
      selectedConnectionLabel: 'Work Slack',
    });

    expect(screen.getByText('Work Slack')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Continue' })).toBeNull();
  });

  it('today renders nothing while the account list loads (P4b adds a loading state)', () => {
    const { container } = renderPicker({
      picker: { piece: 'slack', displayName: 'Slack' },
    });

    expect(getPickerConnections).toHaveBeenCalledTimes(1);
    expect(container.innerHTML).toBe('');
  });
});

function renderPicker({
  picker,
  isInteractive,
  selectedConnectionLabel,
}: {
  picker: ConnectionPickerData;
  isInteractive?: boolean;
  selectedConnectionLabel?: string;
}) {
  const onResolve = vi.fn();
  const onDismiss = vi.fn();
  const view = render(
    <Providers>
      <ConnectionPickerCard
        picker={picker}
        onResolve={onResolve}
        onDismiss={onDismiss}
        isInteractive={isInteractive}
        selectedConnectionLabel={selectedConnectionLabel}
      />
    </Providers>,
  );
  return { onResolve, onDismiss, container: view.container };
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
