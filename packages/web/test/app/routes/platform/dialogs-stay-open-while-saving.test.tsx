/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-enabled-disabled, jest-dom/prefer-to-have-attribute -- @testing-library/jest-dom is not a dependency of packages/web */
import { PlatformWithoutSensitiveData } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ConfigureSamlDialog } from '@/app/routes/platform/security/sso/saml-dialog';
import { ConfigurePieceOAuth2Dialog } from '@/app/routes/platform/setup/pieces/update-oauth2-dialog';
import { TooltipProvider } from '@/components/ui/tooltip';

const state = vi.hoisted(() => ({
  upsert: vi.fn(),
  updateSsoDomain: vi.fn(),
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));
vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: { useFlag: () => ({ data: undefined }) },
}));
vi.mock('@/api/platforms-api', () => ({
  platformApi: { update: vi.fn(), getCurrentPlatform: vi.fn() },
}));
vi.mock('@/features/platform-admin', () => ({
  samlSsoApi: {
    updateSsoDomain: (...args: unknown[]) => state.updateSsoDomain(...args),
  },
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

function wrap(node: React.ReactNode) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <TooltipProvider>{node}</TooltipProvider>
    </QueryClientProvider>
  );
}

async function expectStaysOpen() {
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(screen.getByRole('dialog')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
}

describe('dialogs with inline save errors', () => {
  it('keeps the OAuth2 app dialog open while it saves', async () => {
    state.upsert = vi.fn(() => new Promise(() => undefined));
    render(
      wrap(
        <ConfigurePieceOAuth2Dialog
          pieceName="@activepieces/piece-slack"
          onConfigurationDone={vi.fn()}
          isEnabled
        />,
      ),
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
    fireEvent.submit(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(state.upsert).toHaveBeenCalledTimes(1));

    expect(
      screen.getByRole('button', { name: 'Cancel' }).hasAttribute('disabled'),
    ).toBe(true);
    await expectStaysOpen();
  });

  it('keeps the SAML dialog open while it saves', async () => {
    state.updateSsoDomain = vi.fn(() => new Promise(() => undefined));
    render(
      wrap(
        <ConfigureSamlDialog
          platform={
            {
              id: 'p',
              emailAuthEnabled: true,
              googleAuthEnabled: false,
              federatedAuthProviders: {},
              ssoDomain: null,
              ssoDomainVerification: null,
              allowedAuthDomains: [],
            } as unknown as PlatformWithoutSensitiveData
          }
          connected={false}
          refetch={() => Promise.resolve()}
        />,
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Enable' }));
    fireEvent.change(await screen.findByLabelText('Domain'), {
      target: { value: 'acme.com' },
    });
    fireEvent.submit(screen.getByRole('button', { name: 'Save domain' }));
    await waitFor(() => expect(state.updateSsoDomain).toHaveBeenCalledTimes(1));

    await expectStaysOpen();
  });
});
