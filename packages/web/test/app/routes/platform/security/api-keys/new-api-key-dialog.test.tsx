/**
 * @vitest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { NewApiKeyDialog } from '@/app/routes/platform/security/api-keys/new-api-key-dialog';
import { TooltipProvider } from '@/components/ui/tooltip';

const state = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));
vi.mock('@/features/platform-admin', () => ({
  apiKeyApi: { create: (...args: unknown[]) => state.create(...args) },
}));

describe('NewApiKeyDialog', () => {
  it('creates one key when Create is double-clicked', async () => {
    state.create = vi.fn(() => new Promise(() => undefined));
    render(
      <QueryClientProvider client={new QueryClient()}>
        <TooltipProvider>
          <NewApiKeyDialog onCreate={vi.fn()}>
            <button type="button">New API Key</button>
          </NewApiKeyDialog>
        </TooltipProvider>
      </QueryClientProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'New API Key' }));
    fireEvent.change(await screen.findByPlaceholderText('API Key Name'), {
      target: { value: 'CI key' },
    });
    const create = screen.getByRole('button', { name: 'Create' });
    fireEvent.submit(create);
    fireEvent.submit(create);

    await waitFor(() => expect(state.create).toHaveBeenCalledTimes(1));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(state.create).toHaveBeenCalledTimes(1);
  });
});
