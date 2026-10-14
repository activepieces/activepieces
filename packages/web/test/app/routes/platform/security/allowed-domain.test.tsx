/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-enabled-disabled, jest-dom/prefer-to-have-attribute -- @testing-library/jest-dom is not a dependency of packages/web */
import { PlatformWithoutSensitiveData } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AllowedDomainDialog } from '@/app/routes/platform/security/sso/allowed-domain';

const state = vi.hoisted(() => ({ update: vi.fn() }));

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));
vi.mock('@/api/platforms-api', () => ({
  platformApi: { update: (...args: unknown[]) => state.update(...args) },
}));
vi.mock('@/hooks/user-hooks', () => ({
  userHooks: { useCurrentUser: () => ({ data: { email: 'ana@acme.com' } }) },
}));

const PLATFORM = {
  id: 'p',
  allowedAuthDomains: ['acme.com'],
} as unknown as PlatformWithoutSensitiveData;

describe('AllowedDomainDialog', () => {
  it('stays open while the save runs', async () => {
    state.update = vi.fn(() => new Promise(() => undefined));
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AllowedDomainDialog
          platform={PLATFORM}
          refetch={() => Promise.resolve()}
        />
      </QueryClientProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Update' }));
    fireEvent.submit(await screen.findByRole('button', { name: 'Save' }));
    await waitFor(() => expect(state.update).toHaveBeenCalledTimes(1));

    expect(
      screen.getByRole('button', { name: 'Cancel' }).hasAttribute('disabled'),
    ).toBe(true);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.getByRole('dialog')).toBeTruthy();
  });
});
