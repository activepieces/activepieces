/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-enabled-disabled, jest-dom/prefer-to-have-attribute -- @testing-library/jest-dom is not a dependency of packages/web */
import {
  PlatformWithoutSensitiveData,
  SsoDomainVerificationRecordType,
  SsoDomainVerificationStatus,
} from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConfigureSamlDialog } from '@/app/routes/platform/security/sso/saml-dialog';
import { mutationFeedback } from '@/lib/mutation-feedback';

const state = vi.hoisted(() => ({ update: vi.fn(), updateDomain: vi.fn() }));

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));
vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: { useFlag: () => ({ data: undefined }) },
}));
vi.mock('@/api/platforms-api', () => ({
  platformApi: {
    update: (...args: unknown[]) => state.update(...args),
    getCurrentPlatform: () =>
      Promise.resolve({ ...PLATFORM, emailAuthEnabled: true }),
  },
}));
vi.mock('@/features/platform-admin', () => ({
  samlSsoApi: {
    updateSsoDomain: (...args: unknown[]) => state.updateDomain(...args),
  },
}));

const PLATFORM = {
  id: 'p',
  emailAuthEnabled: false,
  googleAuthEnabled: false,
  federatedAuthProviders: {
    saml: { idpMetadata: 'old', idpCertificate: 'old' },
  },
  ssoDomain: 'acme.com',
  ssoDomainVerification: {
    status: SsoDomainVerificationStatus.VERIFIED,
    record: {
      type: SsoDomainVerificationRecordType.TXT,
      name: '_activepieces-verify.acme.com',
      value: 'activepieces-verify=token',
    },
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  allowedAuthDomains: [],
} as unknown as PlatformWithoutSensitiveData;

beforeEach(() => {
  state.update = vi
    .fn()
    .mockRejectedValue(
      mutationFeedback.userError('The IdP metadata is invalid'),
    );
  state.updateDomain = vi
    .fn()
    .mockRejectedValue(mutationFeedback.userError('That domain is taken'));
});

describe('Update SSO domain confirm', () => {
  it('stays open and shows why the domain change failed', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <ConfigureSamlDialog
          platform={PLATFORM}
          connected
          refetch={() => Promise.resolve()}
        />
      </QueryClientProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(await screen.findByLabelText('Domain'), {
      target: { value: 'acme.io' },
    });
    fireEvent.submit(screen.getByRole('button', { name: 'Update domain' }));
    const confirm = await screen.findByRole('dialog', {
      name: 'Update SSO domain?',
      hidden: true,
    });
    fireEvent.click(
      within(confirm).getByRole('button', {
        name: 'Update domain',
        hidden: true,
      }),
    );

    await waitFor(() => expect(state.updateDomain).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(within(confirm).getByText('That domain is taken')).toBeDefined(),
    );
    expect(
      screen.getByRole('dialog', { name: 'Update SSO domain?', hidden: true }),
    ).toBe(confirm);
    expect(screen.getAllByText('That domain is taken')).toHaveLength(1);
    expect(toast.error).not.toHaveBeenCalled();
  });
});

describe('New SAML settings confirm', () => {
  it('stays open and shows why the save failed', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <ConfigureSamlDialog
          platform={PLATFORM}
          connected
          refetch={() => Promise.resolve()}
        />
      </QueryClientProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(await screen.findByLabelText('IDP Metadata'), {
      target: { value: '<xml />' },
    });
    fireEvent.change(screen.getByLabelText('IDP Certificate'), {
      target: { value: 'cert' },
    });
    fireEvent.submit(screen.getByRole('button', { name: 'Save' }));
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Save settings',
        hidden: true,
      }),
    );

    await waitFor(() => expect(state.update).toHaveBeenCalledTimes(1));
    const confirm = screen.getByRole('dialog', {
      name: 'Save new SAML settings?',
      hidden: true,
    });
    await waitFor(() =>
      expect(
        within(confirm).getByText('The IdP metadata is invalid'),
      ).toBeDefined(),
    );
    expect(screen.getAllByText('The IdP metadata is invalid')).toHaveLength(1);
    expect(toast.error).not.toHaveBeenCalled();
  });
});
