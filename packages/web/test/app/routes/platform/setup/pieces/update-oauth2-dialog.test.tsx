/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-enabled-disabled, jest-dom/prefer-to-have-attribute -- @testing-library/jest-dom is not a dependency of packages/web */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ConfigurePieceOAuth2Dialog } from '@/app/routes/platform/setup/pieces/update-oauth2-dialog';
import { TooltipProvider } from '@/components/ui/tooltip';

const state = vi.hoisted(() => ({ upsert: vi.fn() }));

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));
vi.mock('@/features/connections', () => ({
  oauthAppsQueries: {
    useOAuthAppConfigured: () => ({ oauth2App: null, refetch: vi.fn() }),
  },
}));
vi.mock('@/features/connections/api/oauth-apps', () => ({
  oauthAppsApi: {
    upsert: (...args: unknown[]) => state.upsert(...args),
    delete: vi.fn(),
  },
}));

describe('ConfigurePieceOAuth2Dialog', () => {
  it('lets the admin retry after a server error', async () => {
    state.upsert.mockRejectedValue(new Error('boom'));
    render(
      <QueryClientProvider client={new QueryClient()}>
        <TooltipProvider>
          <ConfigurePieceOAuth2Dialog
            pieceName="@activepieces/piece-google-sheets"
            onConfigurationDone={vi.fn()}
            isEnabled
          />
        </TooltipProvider>
      </QueryClientProvider>,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Configure OAuth2 App' }),
    );
    fireEvent.change(await screen.findByLabelText(/Client ID/), {
      target: { value: 'id' },
    });
    fireEvent.change(screen.getByLabelText(/Client Secret/), {
      target: { value: 'secret' },
    });
    const save = screen.getByRole('button', { name: 'Save' });
    await waitFor(() => expect(save.hasAttribute('disabled')).toBe(false));
    fireEvent.submit(save);

    await screen.findByText(
      'An unexpected error occurred. Please try again in a moment.',
    );
    expect(screen.getByRole('dialog')).toBeTruthy();
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Save' }).hasAttribute('disabled'),
      ).toBe(false),
    );

    fireEvent.submit(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(state.upsert).toHaveBeenCalledTimes(2));
  });
});
