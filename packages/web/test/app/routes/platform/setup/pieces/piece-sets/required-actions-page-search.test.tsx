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
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { RequiredActionsPage } from '@/app/routes/platform/setup/pieces/piece-sets/required-actions-page';

vi.mock('i18next', () => ({
  t: (key: string, params?: Record<string, unknown>) =>
    key.replace(/\{(\w+)\}/g, (match, name: string) =>
      params && name in params ? String(params[name]) : match,
    ),
}));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: { plan: { managePiecesEnabled: true } },
    }),
  },
}));

vi.mock('@/features/piece-sets', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  pieceSetQueries: {
    useAllPieceSets: () => ({
      data: allSets,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    }),
  },
  usePieceSetChange: () => vi.fn().mockResolvedValue(true),
}));

vi.mock('@/features/pieces', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  piecesHooks: {
    useMultiplePieces: () => [],
    usePiece: () => ({
      pieceModel: undefined,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    }),
    usePlatformCatalog: () => ({
      pieces: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    }),
  },
}));

const makeSet = (index: number): PieceSet => ({
  id: `ps_${index}`,
  created: '2026-01-01T00:00:00.000Z',
  updated: '2026-01-01T00:00:00.000Z',
  platformId: 'pl_1',
  name: `Team ${String(index).padStart(2, '0')}`,
  key: `team-${index}`,
  isDefault: false,
  generatedForProjectId: null,
  config: {
    pieces: { mode: PieceSelectionMode.INCLUDE_ALL, exceptions: [] },
    selectedActions: {},
    selectedTriggers: {},
    requiredActions: { mode: RequiredActionsMode.ANY, actions: {} },
  },
});

const allSets = Array.from({ length: 60 }, (_, index) => makeSet(index + 1));

function renderPage() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <RequiredActionsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const shownSetNames = () => screen.queryAllByText(/^Team \d\d$/);

describe('required actions page with many sets', () => {
  it('renders one page of sets and reveals the rest on demand', () => {
    renderPage();
    expect(shownSetNames().length).toBe(20);
    expect(screen.queryByText('Team 21')).toBe(null);

    fireEvent.click(screen.getByRole('button', { name: 'Show 20 more' }));
    expect(shownSetNames().length).toBe(40);
    fireEvent.click(screen.getByRole('button', { name: 'Show 20 more' }));
    expect(shownSetNames().length).toBe(60);
    expect(screen.queryByRole('button', { name: /^Show \d+ more$/ })).toBe(
      null,
    );
  });

  it('narrows the list to sets whose name matches the search', () => {
    renderPage();
    const search = screen.getByPlaceholderText(/^Search /);

    fireEvent.change(search, { target: { value: 'team 45' } });
    expect(shownSetNames().map((node) => node.textContent)).toEqual([
      'Team 45',
    ]);

    fireEvent.change(search, { target: { value: 'nothing like this' } });
    expect(shownSetNames().length).toBe(0);
    expect(screen.getByText(/^No .* matches$/)).toBeTruthy();
  });
});
