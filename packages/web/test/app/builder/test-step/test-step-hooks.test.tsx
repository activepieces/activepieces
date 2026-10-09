// @vitest-environment jsdom
import { ErrorCode } from '@activepieces/core-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { AxiosError, AxiosHeaders } from 'axios';
import { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('react-hook-form', () => ({
  useFormContext: () => ({ getValues: () => ({ name: 'trigger' }) }),
}));
vi.mock('@/app/builder/builder-hooks', () => ({
  useBuilderStateContext: () => ({
    flow: { id: 'flow1' },
    flowVersionId: 'version1',
    updateSampleData: vi.fn(),
  }),
}));
vi.mock('@/components/ui/sonner', () => ({ internalErrorToast: vi.fn() }));
vi.mock('@/features/flow-runs', () => ({ flowRunsApi: {} }));
vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: { getProjectId: () => 'proj1' },
}));

const testTrigger = vi.fn();
vi.mock('@/features/flows', () => ({
  triggerEventsApi: { test: () => testTrigger() },
}));

import { testStepHooks } from '@/app/builder/test-step/utils/test-step-hooks';

describe('testStepHooks.usePollTrigger', () => {
  let queryClient: QueryClient;
  const setErrorMessage = vi.fn();

  beforeEach(() => {
    testTrigger.mockReset();
    setErrorMessage.mockReset();
    queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('shows the generic failure message when the request fails with no response', async () => {
    testTrigger.mockRejectedValue(
      new AxiosError('Network Error', 'ERR_NETWORK'),
    );

    runPollTrigger();

    await waitFor(() =>
      expect(setErrorMessage).toHaveBeenLastCalledWith(GENERIC_FAILURE),
    );
  });

  it('shows the structured piece error for TEST_TRIGGER_FAILED', async () => {
    testTrigger.mockRejectedValue(
      axiosErrorWithResponse({
        code: ErrorCode.TEST_TRIGGER_FAILED,
        params: { message: 'Invalid API key' },
      }),
    );

    runPollTrigger();

    await waitFor(() =>
      expect(setErrorMessage.mock.lastCall?.[0]).toContain('Invalid API key'),
    );
  });

  it('shows the generic failure message for other API errors', async () => {
    testTrigger.mockRejectedValue(
      axiosErrorWithResponse({ code: ErrorCode.VALIDATION, params: {} }),
    );

    runPollTrigger();

    await waitFor(() =>
      expect(setErrorMessage).toHaveBeenLastCalledWith(GENERIC_FAILURE),
    );
  });

  it('shows the internal error message for non-HTTP errors', async () => {
    testTrigger.mockRejectedValue(new Error('boom'));

    runPollTrigger();

    await waitFor(() =>
      expect(setErrorMessage).toHaveBeenLastCalledWith(
        'Internal error, please try again later.',
      ),
    );
  });

  function runPollTrigger(): void {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(
      () =>
        testStepHooks.usePollTrigger({ setErrorMessage, onSuccess: vi.fn() }),
      { wrapper },
    );
    result.current.mutate();
  }
});

function axiosErrorWithResponse(data: unknown): AxiosError {
  const headers = new AxiosHeaders();
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, null, {
    data,
    status: 400,
    statusText: 'Bad Request',
    headers,
    config: { headers },
  });
}

const GENERIC_FAILURE =
  'Failed to run test step, please ensure settings are correct.';
