/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-text-content -- @testing-library/jest-dom is not a dependency of packages/web */
import {
  PieceSelectionMode,
  PieceSet,
  RequiredActionsMode,
} from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { PieceActionsAndTriggersSheet } from '@/app/routes/platform/setup/pieces/piece-sets/piece-actions-and-triggers-sheet';

vi.mock('i18next', () => ({
  t: (key: string, params?: Record<string, unknown>) =>
    key.replace(/\{(\w+)\}/g, (match, name: string) =>
      params && name in params ? String(params[name]) : match,
    ),
}));

const gmail = {
  name: 'gmail',
  displayName: 'Gmail',
  logoUrl: '',
  actions: {
    send_email: {
      name: 'send_email',
      displayName: 'Send Email',
      description: 'Send an email',
    },
    find_email: {
      name: 'find_email',
      displayName: 'Find Email',
      description: 'Search the mailbox',
    },
  },
  triggers: {
    new_email: {
      name: 'new_email',
      displayName: 'New Email',
      description: 'A new email arrives',
    },
  },
};

vi.mock('@/features/pieces', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  piecesHooks: {
    usePiece: () => ({
      pieceModel: gmail,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    }),
  },
}));

const pieceSet: PieceSet = {
  id: 'ps_1',
  created: '2026-01-01T00:00:00.000Z',
  updated: '2026-01-01T00:00:00.000Z',
  platformId: 'pl_1',
  name: 'Support',
  key: 'support',
  isDefault: false,
  generatedForProjectId: null,
  config: {
    pieces: { mode: PieceSelectionMode.INCLUDE_ALL, exceptions: [] },
    selectedActions: { gmail: ['send_email', 'find_email'] },
    selectedTriggers: { gmail: ['new_email'] },
    requiredActions: { mode: RequiredActionsMode.ANY, actions: {} },
  },
};

describe('actions and triggers sheet saved as a fixed list', () => {
  it('lets the admin switch a fully checked fixed list to include new ones', async () => {
    const onChange = vi.fn().mockResolvedValue(true);
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <PieceActionsAndTriggersSheet
            pieceName="gmail"
            pieceDisplayName="Gmail"
            open
            onOpenChange={vi.fn()}
            pieceSet={pieceSet}
            onChange={onChange}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(
      screen.getByText(
        'Saved as a fixed list. Save to also include actions and triggers added later.',
      ),
    ).not.toBeNull();
    const saveButton = screen.getByRole('button', { name: /^Save/ });
    expect(saveButton.matches(':disabled')).toBe(false);

    fireEvent.click(saveButton);

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'components',
        pieceName: 'gmail',
        actions: { mode: 'all' },
        triggers: { mode: 'all' },
      }),
    );
  });
});
