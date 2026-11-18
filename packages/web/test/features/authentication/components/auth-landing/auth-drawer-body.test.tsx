/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document -- @testing-library/jest-dom is not a dependency of packages/web */
import { ErrorCode } from '@activepieces/core-utils';
import { ApFlagId } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { AxiosError, AxiosHeaders } from 'axios';
import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const requestEmailCode = vi.hoisted(() => vi.fn());
const verifyEmailCode = vi.hoisted(() => vi.fn());

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('motion/react', () => ({
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  motion: {
    div: ({ children, className }: React.ComponentProps<'div'>) => (
      <div className={className}>{children}</div>
    ),
  },
}));

vi.mock('@/api/authentication-api', () => ({
  authenticationApi: { requestEmailCode, verifyEmailCode },
}));

vi.mock('@/components/providers/telemetry-provider', () => ({
  useTelemetry: () => ({ capture: vi.fn() }),
}));

vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: {
    useFlag: (flagId: ApFlagId) => ({
      data: [
        ApFlagId.EMAIL_CODE_AUTH_ENABLED,
        ApFlagId.EMAIL_AUTH_ENABLED,
        ApFlagId.SMTP_CONFIGURED,
        ApFlagId.USER_CREATED,
      ].includes(flagId)
        ? true
        : undefined,
    }),
  },
}));

vi.mock('@/components/ui/input-otp', () => ({
  InputOTP: ({ value, onChange, ...rest }: OtpInputProps) => (
    <input
      data-testid={rest['data-testid']}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
  InputOTPGroup: ({ children }: React.PropsWithChildren) => <>{children}</>,
  InputOTPSlot: () => null,
}));

vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: {
    isOnboarding: () => false,
    saveResponse: vi.fn(),
    clearSession: vi.fn(),
  },
}));

vi.mock('@/lib/navigation-utils', () => ({
  useRedirectAfterLogin: () => vi.fn(),
}));

vi.mock('@/components/custom/full-logo', () => ({ FullLogo: () => null }));

vi.mock(
  '@/features/authentication/components/auth-landing/turnstile-widget',
  () => ({ TurnstileWidget: () => null, useTurnstileSiteKey: () => null }),
);

vi.mock('@/features/authentication/components/third-party-logins', () => ({
  ThirdPartyLogin: () => null,
  useShowThirdPartyProviders: () => false,
  useThirdPartyAvailability: () => ({
    google: false,
    saml: false,
    samlIsCloud: false,
  }),
}));

vi.mock('@/features/authentication/hooks/use-start-saml-login', () => ({
  useStartSamlLogin: () => vi.fn(),
}));

vi.mock('@/features/authentication/components/sign-in-form', () => ({
  SignInForm: () => null,
}));

vi.mock('@/features/authentication/components/sign-up-form', () => ({
  SignUpForm: () => null,
}));

vi.mock('@/features/authentication/components/saml-login-form', () => ({
  SamlLoginForm: () => null,
}));

vi.mock('@/features/authentication/components/check-email-note', () => ({
  CheckEmailNote: () => null,
}));

import { AuthDrawerBody } from '@/features/authentication/components/auth-landing/auth-drawer-body';

function rejection(code: ErrorCode | undefined): AxiosError {
  return new AxiosError(
    'request failed',
    AxiosError.ERR_BAD_REQUEST,
    undefined,
    undefined,
    {
      status: 403,
      statusText: 'Forbidden',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: code === undefined ? {} : { code },
    },
  );
}

async function submitCode() {
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { mutations: { retry: false } } })
      }
    >
      <MemoryRouter>
        <AuthDrawerBody initialMode="signin" />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  fireEvent.change(screen.getByTestId('auth-email'), {
    target: { value: 'ada@example.com' },
  });
  fireEvent.click(screen.getByTestId('auth-continue'));
  const codeInput = await screen.findByTestId('auth-code');
  fireEvent.change(codeInput, { target: { value: '123456' } });
}

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  requestEmailCode.mockReset().mockResolvedValue(undefined);
  verifyEmailCode.mockReset();
});

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  'data-testid'?: string;
};

describe('signing in with an emailed code', () => {
  it.each([
    {
      name: 'a deactivated user',
      code: ErrorCode.USER_IS_INACTIVE,
      message: 'User has been deactivated',
    },
    {
      name: 'a wrong code',
      code: ErrorCode.INVALID_OTP,
      message: 'That code is invalid or expired. Try again.',
    },
    {
      name: 'an unexpected failure',
      code: undefined,
      message: 'Something went wrong, please try again later',
    },
  ])('tells $name what happened', async ({ code, message }) => {
    verifyEmailCode.mockRejectedValue(rejection(code));

    await submitCode();

    expect(await screen.findByText(message)).toBeTruthy();
  });
});
