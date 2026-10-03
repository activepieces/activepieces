// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, waitFor } from '@testing-library/react';
import { AxiosError, AxiosHeaders } from 'axios';
import { StrictMode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('@/components/providers/telemetry-provider', () => ({
  useTelemetry: () => ({ capture: vi.fn() }),
}));
const reportSignup = vi.fn();
vi.mock('@/hooks/use-partner-stack', () => ({
  usePartnerStack: () => ({ reportSignup }),
}));
vi.mock('@/components/custom/full-logo', () => ({
  FullLogo: () => null,
}));

const verifyEmail = vi.fn();
vi.mock('@/api/authentication-api', () => ({
  authenticationApi: {
    verifyEmail: (request: unknown) => verifyEmail(request),
  },
}));

import { VerifyEmail } from '@/features/authentication/components/verify-email';

const SUCCESS_TEXT =
  'Email has been verified. You will be redirected to sign in...';
const FAILURE_TEXT =
  "We couldn't verify your email. Sign in to resend the verification email.";
const EXPIRED_TEXT =
  'invitation has expired, once you sign in again you will be able to resend the verification email.';

function httpError(status: number) {
  return new AxiosError('failed', String(status), undefined, undefined, {
    status,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: {},
  });
}

function pageText() {
  return document.body.textContent ?? '';
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter
          initialEntries={['/verify-email?otpcode=abc&identityId=id1']}
        >
          <Routes>
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/sign-in" element={<div>sign-in page</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </StrictMode>,
  );
}

describe('VerifyEmail', () => {
  beforeEach(() => {
    verifyEmail.mockReset();
    reportSignup.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('shows success only after the verification request succeeds', async () => {
    verifyEmail.mockResolvedValue({ email: 'a@b.com', firstName: 'A' });
    renderPage();
    await waitFor(() => expect(pageText()).toContain(SUCCESS_TEXT));
    expect(verifyEmail).toHaveBeenCalledWith({ otp: 'abc', identityId: 'id1' });
  });

  it.each([
    ['a server error', () => httpError(500)],
    ['rate limiting', () => httpError(429)],
    ['a network error', () => new AxiosError('Network Error', 'ERR_NETWORK')],
  ])('shows the failure panel, not success, on %s', async (_, makeError) => {
    verifyEmail.mockRejectedValue(makeError());
    renderPage();
    await waitFor(() => expect(pageText()).toContain(FAILURE_TEXT));
    expect(pageText()).not.toContain(SUCCESS_TEXT);
    expect(pageText()).not.toContain(EXPIRED_TEXT);
  });

  it('keeps showing success when signup reporting throws', async () => {
    verifyEmail.mockResolvedValue({ email: 'a@b.com', firstName: 'A' });
    reportSignup.mockImplementation(() => {
      throw new TypeError(
        "Cannot set properties of undefined (setting 'email')",
      );
    });
    renderPage();
    await waitFor(() => expect(pageText()).toContain(SUCCESS_TEXT));
    expect(pageText()).not.toContain(FAILURE_TEXT);
    expect(console.error).toHaveBeenCalledWith(expect.any(TypeError));
  });

  it('redirects to sign in five seconds after a failure', async () => {
    verifyEmail.mockRejectedValue(httpError(500));
    renderPage();
    await waitFor(() => expect(pageText()).toContain(FAILURE_TEXT));
    act(() => {
      vi.advanceTimersByTime(4900);
    });
    expect(pageText()).toContain(FAILURE_TEXT);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(pageText()).toContain('sign-in page');
  });

  it('shows the expired panel on 410', async () => {
    verifyEmail.mockRejectedValue(httpError(410));
    renderPage();
    await waitFor(() => expect(pageText()).toContain(EXPIRED_TEXT));
    expect(pageText()).not.toContain(SUCCESS_TEXT);
    expect(pageText()).not.toContain(FAILURE_TEXT);
  });

  it('never shows success while the request is in flight', () => {
    verifyEmail.mockReturnValue(new Promise(() => undefined));
    renderPage();
    expect(pageText()).toContain('Verifying email...');
    expect(pageText()).not.toContain(SUCCESS_TEXT);
  });
});
