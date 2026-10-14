/**
 * @vitest-environment jsdom
 */
/* eslint-disable testing-library/no-node-access -- document order is what these tests assert */
import {
  PieceSelectionMode,
  PieceSet,
  RequiredActionsMode,
} from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { PieceActionsAndTriggersSheet } from '@/app/routes/platform/setup/pieces/piece-sets/piece-actions-and-triggers-sheet';
import { RequiredActionsSheet } from '@/app/routes/platform/setup/pieces/piece-sets/required-actions';

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
    reply_to_email: {
      name: 'reply_to_email',
      displayName: 'Reply to Email',
      description: 'Reply to an email',
    },
    find_email: {
      name: 'find_email',
      displayName: 'Find Email',
      description: 'Search the mailbox',
    },
  },
  triggers: {},
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
    useMultiplePieces: ({ names }: { names: string[] }) =>
      names.map(() => ({ data: gmail, isLoading: false })),
    usePlatformCatalog: () => ({
      pieces: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    }),
  },
}));

const pieceSet = (requiredActions: Record<string, string[]>): PieceSet => ({
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
    selectedActions: {},
    selectedTriggers: {},
    requiredActions: {
      mode: RequiredActionsMode.ANY,
      actions: requiredActions,
    },
  },
});

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

function isBefore(first: Node, second: Node): boolean {
  return Boolean(
    first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING,
  );
}

describe('publishing rule sheet', () => {
  it('puts the action picker above the current list, so the list grows below it', () => {
    renderWithProviders(
      <RequiredActionsSheet
        pieceSet={pieceSet({ gmail: ['send_email'] })}
        open
        onOpenChange={vi.fn()}
        onChange={vi.fn().mockResolvedValue(true)}
      />,
    );
    expect(
      isBefore(
        screen.getByText('Add an action'),
        screen.getByText('Send Email'),
      ),
    ).toBe(true);
  });
});

describe('actions and triggers sheet', () => {
  it('keeps the header and the list in place when an action is unchecked', () => {
    renderWithProviders(
      <PieceActionsAndTriggersSheet
        pieceName="gmail"
        pieceDisplayName="Gmail"
        open
        onOpenChange={vi.fn()}
        pieceSet={pieceSet({})}
        onChange={vi.fn().mockResolvedValue(true)}
      />,
    );
    const rowOrder = () =>
      screen
        .getAllByRole('checkbox')
        .map((box) => box.closest('label')?.textContent ?? '')
        .filter((text) => !/^(Actions|AI tools|Triggers) \(/.test(text));
    const subtitle = screen.getByText(
      'Check what builders, MCP and agents can use.',
    );
    const before = rowOrder();
    const firstAction = screen.getByText('Send Email');

    fireEvent.click(
      screen
        .getByText('Reply to Email')
        .closest('label')!
        .querySelector('button[role="checkbox"]')!,
    );

    expect(rowOrder()).toEqual(before);
    expect(screen.getByText('Send Email')).toBe(firstAction);
    expect(
      screen.getByText('Check what builders, MCP and agents can use.'),
    ).toBe(subtitle);
    const note = screen.getByText(
      'Hidden from the builder. Flows already using it keep running.',
    );
    expect(isBefore(firstAction, note)).toBe(true);
    expect(note.closest('[aria-live]')).not.toBeNull();
  });
});

describe('saving a sheet', () => {
  it('locks the checklist until the save finishes, so later edits cannot be lost', () => {
    renderWithProviders(
      <PieceActionsAndTriggersSheet
        pieceName="gmail"
        pieceDisplayName="Gmail"
        open
        onOpenChange={vi.fn()}
        pieceSet={pieceSet({})}
        onChange={vi.fn().mockReturnValue(new Promise(() => undefined))}
      />,
    );
    const checkboxOf = (name: string) =>
      screen
        .getByText(name)
        .closest('label')!
        .querySelector<HTMLElement>('button[role="checkbox"]')!;

    fireEvent.click(checkboxOf('Reply to Email'));
    fireEvent.click(screen.getByRole('button', { name: /^Save/ }));

    expect(checkboxOf('Find Email').matches(':disabled')).toBe(true);
    expect(checkboxOf('Send Email').matches(':disabled')).toBe(true);
    expect(
      screen
        .getByPlaceholderText('Search actions and triggers')
        .matches(':disabled'),
    ).toBe(true);
  });
});
