/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-text-content -- @testing-library/jest-dom is not a dependency of packages/web */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({
  t: (key: string, params?: Record<string, unknown>) =>
    key.replace(/\{(\w+)\}/g, (match, name: string) =>
      params && name in params ? String(params[name]) : match,
    ),
}));
vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: { plan: { globalConnectionsEnabled: false } },
    }),
  },
}));
vi.mock('@/features/connections/hooks/global-connections-hooks', () => ({
  globalConnectionsQueries: {
    useGlobalConnections: () => ({ data: { data: [] }, isLoading: false }),
    getGlobalConnectionsQueryKey: () => ['global-connections'],
  },
}));
vi.mock('@/hooks/authorization-hooks', () => ({
  useAuthorization: () => ({ checkAccess: () => true }),
}));
vi.mock('@/hooks/user-hooks', () => ({
  userHooks: { getCurrentUserPlatformRole: () => 'ADMIN' },
}));
vi.mock('@/features/projects/stores/project-collection', () => ({
  projectCollectionUtils: {
    updateMutationKey: ['update-project'],
    useUpdateProject: () => ({ mutateAsync: vi.fn() }),
  },
}));

import {
  EditProjectDialog,
  PieceSetField,
} from '@/features/projects/components/edit-project-dialog';

const failed: PieceSetField = {
  status: 'error',
  render: () => <button type="button">Try again</button>,
};
const ready: PieceSetField = {
  status: 'ready',
  initialValue: 'ps_finance',
  render: ({ value }) => <output aria-label="Piece set">{value}</output>,
  save: async () => undefined,
  saveFailedMessage: () => 'failed',
};

function dialog(pieceSetField: PieceSetField) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <EditProjectDialog
        open
        onClose={vi.fn()}
        projectId="project_1"
        initialValues={{ projectName: 'Finance' }}
        pieceSetField={pieceSetField}
      />
    </QueryClientProvider>
  );
}

describe('EditProjectDialog', () => {
  it('keeps typed edits when the piece set list loads after a retry', () => {
    const { rerender } = render(dialog(failed));
    const name = screen.getByDisplayValue('Finance');
    fireEvent.change(name, { target: { value: 'Finance team' } });

    rerender(dialog(ready));

    expect(screen.getByDisplayValue('Finance team')).toBe(name);
    expect(screen.getByLabelText('Piece set').textContent).toBe('ps_finance');
  });

  it('shows the rest of the form while the piece set list loads', () => {
    render(dialog({ status: 'loading' }));
    expect(screen.getByDisplayValue('Finance')).not.toBeNull();
    expect(screen.getByLabelText('Loading')).not.toBeNull();
  });
});
