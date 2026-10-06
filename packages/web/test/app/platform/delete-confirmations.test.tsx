/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document -- @testing-library/jest-dom is not a dependency of packages/web */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({
  t: (key: string, values?: Record<string, unknown>) =>
    values ? `${key} ${JSON.stringify(values)}` : key,
}));
vi.mock('@/features/platform-admin', () => ({
  platformAppConnectionsMutations: {
    useDelete: () => ({ mutateAsync: vi.fn(async () => ({ failed: [] })) }),
  },
}));
vi.mock('@/features/projects', () => ({
  getProjectName: (project: { displayName: string }) => project.displayName,
}));

import { DeleteConnectionsDialog } from '@/app/routes/platform/connections/delete-connections-dialog';
import { ConfirmDialog } from '@/components/custom/confirm-dialog';

const renderWithClient = (node: React.ReactNode) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      {node}
    </QueryClientProvider>,
  );

const confirmButton = (name: string) =>
  screen.getByRole('button', { name }) as HTMLButtonElement;

describe('ConfirmDialog', () => {
  it('confirms right away when no typing is required', async () => {
    const onConfirm = vi.fn();
    renderWithClient(
      <ConfirmDialog
        open
        title="Delete key?"
        description="Gone for good."
        consequence="Tokens are rejected."
        confirmLabel="Delete"
        onConfirm={onConfirm}
      />,
    );
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.getByText('Tokens are rejected.')).toBeTruthy();
    const button = confirmButton('Delete');
    expect(button.disabled).toBe(false);
    fireEvent.click(button);
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
  });

  it('keeps the button disabled until the name is typed', async () => {
    const onConfirm = vi.fn();
    renderWithClient(
      <ConfirmDialog
        open
        title="Delete Acme?"
        description="Gone for good."
        confirmLabel="Delete"
        typeToConfirm="Acme"
        onConfirm={onConfirm}
      />,
    );
    const input = screen.getByRole('textbox');
    expect(confirmButton('Delete').disabled).toBe(true);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: 'Acme' } });
    expect(confirmButton('Delete').disabled).toBe(false);
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
  });
});

type ConnectionProp = React.ComponentProps<
  typeof DeleteConnectionsDialog
>['connections'][number];

const connection = (id: string, flowCount: number): ConnectionProp =>
  ({
    id,
    displayName: `Conn ${id}`,
    scope: 'PROJECT',
    flowCount,
    flows: Array.from({ length: flowCount }, (_, index) => ({
      id: `${id}-flow-${index}`,
      displayName: `Flow ${index}`,
      projectId: 'p1',
    })),
    projects: [{ id: 'p1', displayName: 'Project 1' }],
  } as unknown as ConnectionProp);

const renderConnections = (connections: ConnectionProp[]) =>
  renderWithClient(
    <DeleteConnectionsDialog
      connections={connections}
      open
      onOpenChange={() => undefined}
      onDeleted={() => undefined}
    />,
  );

describe('DeleteConnectionsDialog', () => {
  it('uses a plain confirm when no flow uses the connection', () => {
    renderConnections([connection('a', 0)]);
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(confirmButton('Delete').disabled).toBe(false);
    expect(screen.getByText(/No flows use this connection/)).toBeTruthy();
  });

  it('asks for the name when a flow uses the connection', () => {
    renderConnections([connection('a', 2)]);
    expect(screen.getByRole('textbox')).toBeTruthy();
    expect(confirmButton('Delete').disabled).toBe(true);
    expect(screen.getByText(/flows stop working/)).toBeTruthy();
  });

  it('asks for typing in bulk when any selected connection is used', () => {
    renderConnections([connection('a', 0), connection('b', 1)]);
    expect(screen.getByRole('textbox')).toBeTruthy();
    expect(confirmButton('Delete').disabled).toBe(true);
  });

  it('uses a plain confirm in bulk when no selected connection is used', () => {
    renderConnections([connection('a', 0), connection('b', 0)]);
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.getByText(/No flows use these connections/)).toBeTruthy();
  });
});
