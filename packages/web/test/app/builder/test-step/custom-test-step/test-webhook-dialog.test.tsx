/**
 * @vitest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiAnyMock, toastErrorMock } = vi.hoisted(() => ({
  apiAnyMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

vi.mock('i18next', () => ({
  t: (key: string, values?: Record<string, unknown>) =>
    Object.entries(values ?? {}).reduce(
      (text, [name, value]) => text.replace(`{${name}}`, String(value)),
      key,
    ),
}));

vi.mock('@/lib/api', () => ({
  api: {
    any: apiAnyMock,
    extractServerErrorMessage: (error: unknown, fallback: string) =>
      error instanceof Error ? error.message : fallback,
  },
}));

vi.mock('@/lib/dom-utils', () => ({ wait: () => Promise.resolve() }));

vi.mock('sonner', () => ({ toast: { error: toastErrorMock } }));

vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: {
    useFlag: () => ({ data: 'https://cloud.example.com/api/v1/webhooks' }),
  },
}));

vi.mock('@/app/builder/builder-hooks', () => ({
  useBuilderStateContext: (
    selector: (state: { flow: { id: string } }) => unknown,
  ) => selector({ flow: { id: 'flow-1' } }),
}));

vi.mock('@/components/custom/json-editor', () => ({
  JsonEditor: () => <div />,
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: React.PropsWithChildren<{ open: boolean }>) =>
    open ? <div role="dialog">{children}</div> : null,
  DialogClose: ({ children }: React.PropsWithChildren) => <>{children}</>,
  DialogContent: ({ children }: React.PropsWithChildren) => <>{children}</>,
  DialogFooter: ({ children }: React.PropsWithChildren) => <>{children}</>,
  DialogHeader: ({ children }: React.PropsWithChildren) => <>{children}</>,
  DialogTitle: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

import TestWebhookDialog from '@/app/builder/test-step/custom-test-step/test-webhook-dialog';

const NO_SAMPLE_NOTE =
  'No sample data arrived after 30 seconds. If this trigger uses authentication, add the required header or credentials and send again.';

function mount() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <TestWebhookDialog
        testingMode="trigger"
        open={true}
        onOpenChange={vi.fn()}
        currentStep={{} as never}
      />
    </QueryClientProvider>,
  );
}

function sendButton() {
  return screen.getByRole<HTMLButtonElement>('button', { name: 'Send' });
}

describe('TestWebhookDialog (trigger)', () => {
  beforeEach(() => {
    apiAnyMock.mockReset();
    toastErrorMock.mockReset();
  });

  it('stops loading and explains when no sample arrives after sending', async () => {
    apiAnyMock.mockResolvedValue({});
    mount();

    fireEvent.click(sendButton());

    await screen.findByText(NO_SAMPLE_NOTE);
    expect(apiAnyMock).toHaveBeenCalledWith(
      'https://cloud.example.com/api/v1/webhooks/flow-1/test',
      expect.anything(),
    );
    expect(sendButton().disabled).toBe(false);
  });

  it('re-enables Send and shows the server error when the request fails', async () => {
    apiAnyMock.mockRejectedValue(new Error('Payload too large'));
    mount();

    fireEvent.click(sendButton());

    await waitFor(() => expect(apiAnyMock).toHaveBeenCalled());
    await waitFor(() => expect(sendButton().disabled).toBe(false));
    expect(toastErrorMock).toHaveBeenCalledWith('Payload too large');
    expect(screen.queryAllByText(NO_SAMPLE_NOTE).length).toBe(0);
  });
});
