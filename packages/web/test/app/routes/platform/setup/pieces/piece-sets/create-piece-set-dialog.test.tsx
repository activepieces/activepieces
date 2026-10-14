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
vi.mock('@/features/piece-sets', async () => {
  const { useMutation } = await vi.importActual<
    typeof import('@tanstack/react-query')
  >('@tanstack/react-query');
  return {
    pieceSetTerms: {
      get: () => ({
        term: 'piece set',
        terms: 'piece sets',
        Term: 'Piece set',
      }),
    },
    pieceSetMutations: {
      useCreatePieceSet: ({ onError }: { onError: (error: Error) => void }) =>
        useMutation({
          mutationFn: (request: unknown) => state.create(request),
          onError,
        }),
    },
  };
});

function Harness() {
  const [open, setOpen] = React.useState(true);
  return (
    <CreatePieceSetDialog
      open={open}
      onOpenChange={setOpen}
      onCreated={vi.fn()}
    />
  );
}

function renderDialog() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <TooltipProvider>
        <Harness />
      </TooltipProvider>
    </QueryClientProvider>,
  );
}

async function fillName() {
  fireEvent.change(await screen.findByPlaceholderText('e.g. Sales'), {
    target: { value: 'Engineering' },
  });
}

describe('CreatePieceSetDialog', () => {
  it('creates one piece set when Create is double-clicked', async () => {
    state.create = vi.fn(() => new Promise(() => undefined));
    renderDialog();
    await fillName();

    const create = await screen.findByRole('button', { name: 'Create' });
    await waitFor(() => expect(create.hasAttribute('disabled')).toBe(false));
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
    const create = await screen.findByRole('button', { name: 'Create' });
    await waitFor(() => expect(create.hasAttribute('disabled')).toBe(false));
    fireEvent.submit(create);
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
