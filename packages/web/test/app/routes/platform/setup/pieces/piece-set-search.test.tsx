/**
 * @vitest-environment jsdom
 */
import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import {
  PieceSelectionMode,
  PieceSet,
  RequiredActionsMode,
} from '@activepieces/shared';
import { fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { PieceSelect } from '@/app/routes/platform/setup/pieces/piece-sets/piece-select';
import { PieceSetPiecesTable } from '@/app/routes/platform/setup/pieces/piece-sets/piece-set-pieces-table';
import { TooltipProvider } from '@/components/ui/tooltip';

const PIECES = [
  {
    name: '@activepieces/piece-forms',
    displayName: 'Human Input',
    version: '0.1.0',
    actions: 1,
    triggers: 1,
  },
  {
    name: '@activepieces/piece-slack',
    displayName: 'Slack',
    version: '0.1.0',
    actions: 1,
    triggers: 1,
  },
] as PieceMetadataModelSummary[];

vi.mock('i18next', () => ({
  t: (key: string) => key,
}));

vi.mock('sonner', () => ({ toast: vi.fn() }));

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number }) => {
    const items = Array.from({ length: count }, (_, index) => ({
      index,
      key: index,
      start: index * 53,
      end: (index + 1) * 53,
      size: 53,
    }));
    return {
      getVirtualItems: () => items,
      getTotalSize: () => count * 53,
      measureElement: () => undefined,
    };
  },
}));

vi.mock('@/features/pieces', () => ({
  PieceIcon: () => null,
  piecesHooks: {
    usePieces: () => ({
      pieces: PIECES,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    }),
  },
}));

vi.mock('@/features/piece-sets', () => ({
  pieceSetMutations: {
    useUpdatePieceSet: () => ({ mutate: vi.fn() }),
  },
}));

vi.mock(
  '@/app/routes/platform/setup/pieces/piece-sets/piece-set-bulk-actions',
  () => ({ BulkPieceSetActions: () => null }),
);

vi.mock(
  '@/app/routes/platform/setup/pieces/piece-sets/piece-actions-and-triggers-sheet',
  () => ({ PieceActionsAndTriggersSheet: () => null }),
);

vi.mock(
  '@/app/routes/platform/setup/pieces/piece-sets/confirm-excluding-required-actions',
  () => ({ ConfirmExcludingRequiredActionsDialog: () => null }),
);

const PIECE_SET: PieceSet = {
  id: 'set_1',
  created: '2026-01-01T00:00:00.000Z',
  updated: '2026-01-01T00:00:00.000Z',
  platformId: 'platform_1',
  name: 'Custom',
  key: null,
  isDefault: false,
  generatedForProjectId: null,
  config: {
    pieces: { mode: PieceSelectionMode.INCLUDE_ALL, exceptions: [] },
    selectedActions: {},
    selectedTriggers: {},
    requiredActions: { mode: RequiredActionsMode.ANY, actions: {} },
  },
};

const renderWithSearch = (search: string) =>
  render(
    <MemoryRouter
      initialEntries={[`/?displayName=${encodeURIComponent(search)}`]}
    >
      <TooltipProvider>
        <PieceSetPiecesTable pieceSet={PIECE_SET} />
      </TooltipProvider>
    </MemoryRouter>,
  );

describe('PieceSetPiecesTable search', () => {
  it('finds a piece by its package name', () => {
    renderWithSearch('@activepieces/piece-forms');
    expect(screen.getAllByText('Human Input')).toHaveLength(1);
    expect(screen.queryAllByText('Slack')).toHaveLength(0);
  });

  it('finds a piece by its display name, ignoring case', () => {
    renderWithSearch('human');
    expect(screen.getAllByText('Human Input')).toHaveLength(1);
    expect(screen.queryAllByText('Slack')).toHaveLength(0);
  });

  it('finds nothing when neither name matches', () => {
    renderWithSearch('no-such-piece');
    expect(screen.queryAllByText('Human Input')).toHaveLength(0);
    expect(screen.queryAllByText('Slack')).toHaveLength(0);
  });
});

describe('PieceSelect search', () => {
  const searchFor = (search: string) => {
    render(
      <PieceSelect
        pieces={PIECES}
        value={null}
        loading={false}
        onChange={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.change(screen.getByPlaceholderText('Search pieces'), {
      target: { value: search },
    });
  };

  it('finds a piece by its package name', () => {
    searchFor('@activepieces/piece-forms');
    expect(screen.getAllByText('Human Input')).toHaveLength(1);
    expect(screen.queryAllByText('Slack')).toHaveLength(0);
  });

  it('finds a piece by its display name, ignoring case', () => {
    searchFor('SLACK');
    expect(screen.getAllByText('Slack')).toHaveLength(1);
    expect(screen.queryAllByText('Human Input')).toHaveLength(0);
  });
});
