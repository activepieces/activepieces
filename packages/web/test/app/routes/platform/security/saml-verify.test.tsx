/**
 * @vitest-environment jsdom
 */
import {
  PlatformWithoutSensitiveData,
  SsoDomainVerificationRecordType,
  SsoDomainVerificationStatus,
} from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConfigureSamlDialog } from '@/app/routes/platform/security/sso/saml-dialog';

const state = vi.hoisted(() => ({ verifySsoDomain: vi.fn() }));

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    message: vi.fn(),
  }),
}));
vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: { useFlag: () => ({ data: undefined }) },
}));
vi.mock('@/api/platforms-api', () => ({
  platformApi: { update: vi.fn(), getCurrentPlatform: vi.fn() },
}));
vi.mock('@/features/platform-admin', () => ({
  samlSsoApi: {
    verifySsoDomain: (...args: unknown[]) => state.verifySsoDomain(...args),
  },
}));

const RECORD = {
  type: SsoDomainVerificationRecordType.TXT,
  name: '_activepieces-verify.acme.com',
  value: 'activepieces-verify=token',
};

const PLATFORM = {
  id: 'p',
  emailAuthEnabled: true,
  googleAuthEnabled: false,
  federatedAuthProviders: {},
  ssoDomain: 'acme.com',
  ssoDomainVerification: {
    status: SsoDomainVerificationStatus.PENDING_VERIFICATION,
    record: RECORD,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  allowedAuthDomains: [],
} as unknown as PlatformWithoutSensitiveData;

function renderDialog() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ConfigureSamlDialog
        platform={PLATFORM}
        connected={false}
        refetch={() => Promise.resolve()}
      />
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Enable' }));
}

beforeEach(() => {
  vi.mocked(toast.success).mockClear();
});

describe('SAML domain verification', () => {
  it('shows a success toast once the domain is verified', async () => {
    state.verifySsoDomain = vi.fn().mockResolvedValue({
      ssoDomainVerification: {
        status: SsoDomainVerificationStatus.VERIFIED,
        record: RECORD,
      },
    });
    renderDialog();
    fireEvent.click(await screen.findByRole('button', { name: 'Verify DNS' }));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Domain verified', {
        description: undefined,
      }),
    );
  });

  it('shows no success toast while the record is not found yet', async () => {
    state.verifySsoDomain = vi.fn().mockResolvedValue({
      ssoDomainVerification: {
        status: SsoDomainVerificationStatus.PENDING_VERIFICATION,
        record: RECORD,
      },
    });
    renderDialog();
    fireEvent.click(await screen.findByRole('button', { name: 'Verify DNS' }));

    await screen.findByText(
      'TXT record not found yet — DNS can take a few minutes.',
    );
    expect(toast.success).not.toHaveBeenCalled();
  });
});
