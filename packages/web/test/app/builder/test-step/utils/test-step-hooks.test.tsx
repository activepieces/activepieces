/**
 * @vitest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { listMock, testMock, updateSampleDataMock, waitMock } = vi.hoisted(
  () => ({
    listMock: vi.fn(),
    testMock: vi.fn(),
    updateSampleDataMock: vi.fn(),
    waitMock: vi.fn(),
  }),
);

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/features/flows', () => ({
  triggerEventsApi: { list: listMock, test: testMock },
}));

vi.mock('@/features/flow-runs', () => ({ flowRunsApi: {} }));

vi.mock('@/lib/api', () => ({ api: {} }));

vi.mock('@/components/ui/sonner', () => ({ internalErrorToast: vi.fn() }));

vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: { getProjectId: () => 'project-1' },
}));

vi.mock('@/lib/dom-utils', () => ({ wait: waitMock }));

vi.mock('react-hook-form', () => ({
  useFormContext: () => ({ getValues: () => ({ name: 'trigger' }) }),
}));

vi.mock('@/app/builder/builder-hooks', () => ({
  useBuilderStateContext: (
    selector: (state: {
      flow: { id: string };
      flowVersion: { id: string };
      addActionTestListener: () => void;
      updateSampleData: () => void;
    }) => unknown,
  ) =>
    selector({
      flow: { id: 'flow-1' },
      flowVersion: { id: 'version-1' },
      addActionTestListener: vi.fn(),
      updateSampleData: updateSampleDataMock,
    }),
}));

import { testStepHooks } from '@/app/builder/test-step/utils/test-step-hooks';

function wrapper({ children }: React.PropsWithChildren) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

function renderSimulateTrigger() {
  const setErrorMessage = vi.fn();
  const onSuccess = vi.fn();
  const { result } = renderHook(
    () => testStepHooks.useSimulateTrigger({ setErrorMessage, onSuccess }),
    { wrapper },
  );
  return { result, setErrorMessage, onSuccess };
}

describe('testStepHooks.useSimulateTrigger', () => {
  beforeEach(() => {
    listMock.mockReset();
    testMock.mockReset();
    updateSampleDataMock.mockReset();
    waitMock.mockReset();
    waitMock.mockResolvedValue(undefined);
    testMock.mockResolvedValue({ data: [] });
  });

  it('reports an error once polling gives up without a new sample', async () => {
    listMock.mockResolvedValue({ data: [{ id: 'old-event', payload: {} }] });
    const { result, setErrorMessage, onSuccess } = renderSimulateTrigger();

    act(() => result.current.mutate(new AbortController().signal));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(setErrorMessage).toHaveBeenLastCalledWith(
      'There is no sample data available found for this trigger.',
    );
    expect(onSuccess).not.toHaveBeenCalled();
    expect(updateSampleDataMock).not.toHaveBeenCalled();
  });

  it('saves the new sample when one arrives', async () => {
    listMock
      .mockResolvedValueOnce({ data: [{ id: 'old-event', payload: {} }] })
      .mockResolvedValue({
        data: [{ id: 'new-event', payload: { hello: 'world' } }],
      });
    const { result, setErrorMessage, onSuccess } = renderSimulateTrigger();

    act(() => result.current.mutate(new AbortController().signal));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(updateSampleDataMock).toHaveBeenCalledWith({
      stepName: 'trigger',
      output: { hello: 'world' },
    });
    expect(setErrorMessage).toHaveBeenLastCalledWith(undefined);
  });

  it('stays silent when the user cancels', async () => {
    listMock.mockResolvedValue({ data: [{ id: 'old-event', payload: {} }] });
    const abortController = new AbortController();
    abortController.abort();
    const { result, setErrorMessage, onSuccess } = renderSimulateTrigger();

    act(() => result.current.mutate(abortController.signal));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(setErrorMessage).toHaveBeenLastCalledWith(undefined);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('stays silent when the user cancels during the last wait', async () => {
    listMock.mockResolvedValue({ data: [{ id: 'old-event', payload: {} }] });
    const abortController = new AbortController();
    waitMock.mockImplementation(async () => {
      if (waitMock.mock.calls.length === 1000) {
        abortController.abort();
      }
    });
    const { result, setErrorMessage, onSuccess } = renderSimulateTrigger();

    act(() => result.current.mutate(abortController.signal));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(waitMock).toHaveBeenCalledTimes(1000);
    expect(setErrorMessage).toHaveBeenLastCalledWith(undefined);
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
