/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-enabled-disabled, jest-dom/prefer-to-have-attribute -- @testing-library/jest-dom is not a dependency of packages/web */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { CreatePieceSetDialog } from '@/app/routes/platform/setup/pieces/piece-sets/create-piece-set-dialog';
import { pieceSetName } from '@/app/routes/platform/setup/pieces/piece-sets/piece-set-name';
import { TooltipProvider } from '@/components/ui/tooltip';

const state = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));
vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: { plan: { managePiecesEnabled: true } },
    }),
  },
}));
vi.mock('@/features/piece-sets', () => ({
  pieceSetKeys: { all: ['piece-sets'] },
  pieceSetsApi: { create: (...args: unknown[]) => state.create(...args) },
}));

function renderDialog() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <TooltipProvider>
        <CreatePieceSetDialog onCreated={vi.fn()} />
      </TooltipProvider>
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'New Piece Set' }));
}

async function fillName() {
  fireEvent.change(await screen.findByPlaceholderText('e.g. Engineering'), {
    target: { value: 'Engineering' },
  });
}

describe('CreatePieceSetDialog', () => {
  it('creates one piece set when Create is double-clicked', async () => {
    state.create = vi.fn(() => new Promise(() => undefined));
    renderDialog();
    await fillName();

    const create = screen.getByRole('button', { name: 'Create' });
    fireEvent.submit(create);
    fireEvent.submit(create);

    await waitFor(() => expect(state.create).toHaveBeenCalledTimes(1));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(state.create).toHaveBeenCalledTimes(1);
  });

  it('stays open while the piece set is being created', async () => {
    state.create = vi.fn(() => new Promise(() => undefined));
    renderDialog();
    await fillName();
    fireEvent.submit(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => expect(state.create).toHaveBeenCalledTimes(1));

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Cancel' }).hasAttribute('disabled'),
    ).toBe(true);
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
  });
});

describe('pieceSetName.short', () => {
  it('keeps short names and caps long ones at 60 characters', () => {
    expect(pieceSetName.short('Engineering')).toBe('Engineering');
    const long = 'a'.repeat(300);
    expect(pieceSetName.short(long)).toBe(`${'a'.repeat(60)}…`);
  });
});
