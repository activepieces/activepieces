/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document -- @testing-library/jest-dom is not a dependency of packages/web */
import {
  PieceSelectionMode,
  PieceSet,
  RequiredActionsMode,
} from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
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
      platform: { id: 'pl_1', plan: { managePiecesEnabled: true } },
    }),
  },
}));
vi.mock('@/features/piece-sets', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  pieceSetQueries: {
    useAllPieceSets: () => ({
      data: SETS,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    }),
  },
  pieceSetMutations: {
    useDeletePieceSet: () => ({ mutateAsync: vi.fn() }),
  },
}));
vi.mock('@/features/projects', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  projectHooks: {
    useProjectsForPlatforms: () => ({ data: [], isLoading: false }),
  },
}));
vi.mock('@/features/pieces', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  piecesHooks: { usePlatformCatalog: () => ({ pieces: [] }) },
}));

import { PieceSetsTab } from '@/app/routes/platform/setup/pieces/piece-sets/piece-sets-tab';

const SETS: PieceSet[] = Array.from({ length: 300 }, (_, index) => ({
  id: `ps_${index}`,
  created: '2026-01-01T00:00:00.000Z',
  updated: '2026-01-01T00:00:00.000Z',
  platformId: 'pl_1',
  name: `Set ${index}`,
  key: `set-${index}`,
  isDefault: index === 0,
  generatedForProjectId: null,
  config: {
    pieces: { mode: PieceSelectionMode.INCLUDE_ALL, exceptions: [] },
    selectedActions: {},
    selectedTriggers: {},
    requiredActions: { mode: RequiredActionsMode.ANY, actions: {} },
  },
}));

describe('PieceSetsTab', () => {
  it('renders only the visible rows of a long list of sets', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <PieceSetsTab />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.getByRole('table')).not.toBeNull();
    const rendered = screen.queryAllByText(/^Set \d+$/).length;
    expect(rendered).toBeLessThan(SETS.length / 3);
  });
});
