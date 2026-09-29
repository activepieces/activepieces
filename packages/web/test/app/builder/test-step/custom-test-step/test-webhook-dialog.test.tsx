/**
 * @vitest-environment jsdom
 */
import { FlowTrigger } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { apiAny } = vi.hoisted(() => ({ apiAny: vi.fn() }));

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/lib/api', () => ({ api: { any: apiAny } }));

vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: {
    useFlag: () => ({ data: 'http://localhost/api/v1/webhooks' }),
  },
}));

vi.mock('@/app/builder/builder-hooks', () => ({
  useBuilderStateContext: (
    selector: (state: { flow: { id: string } }) => unknown,
  ) => selector({ flow: { id: 'flow-1' } }),
}));

vi.mock('@/components/custom/dictionary-input', () => ({
  DictionaryInput: () => null,
}));

vi.mock('@/components/custom/json-editor', () => ({
  JsonEditor: () => null,
}));

vi.mock('@/components/custom/searchable-select', () => ({
  SearchableSelect: () => null,
}));

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  TabsList: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  TabsTrigger: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  TabsContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: React.PropsWithChildren<{ open: boolean }>) =>
    open ? <div>{children}</div> : null,
  DialogContent: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  DialogHeader: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogFooter: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  DialogClose: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    asChild: _asChild,
    variant: _variant,
    size: _size,
    loading,
    ...props
  }: React.ComponentProps<'button'> & {
    asChild?: boolean;
    variant?: string;
    size?: string;
    loading?: boolean;
  }) => (
    <button {...props} disabled={loading}>
      {children}
    </button>
  ),
}));

import TestWebhookDialog from '@/app/builder/test-step/custom-test-step/test-webhook-dialog';

function renderDialog(queryClient = new QueryClient()) {
  render(
    <QueryClientProvider client={queryClient}>
      <TestWebhookDialog
        testingMode="trigger"
        open={true}
        onOpenChange={() => undefined}
        currentStep={{} as FlowTrigger}
      />
    </QueryClientProvider>,
  );
}

function sendButton(): HTMLButtonElement {
  return screen.getByRole('button', { name: 'Send' });
}

describe('TestWebhookDialog trigger mode Send button', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading while the request is in flight', async () => {
    apiAny.mockReturnValue(new Promise(() => undefined));
    renderDialog();
    fireEvent.click(sendButton());
    await waitFor(() => expect(apiAny).toHaveBeenCalledTimes(1));
    expect(sendButton().disabled).toBe(true);
  });

  it('becomes usable again after the request fails so the user can retry', async () => {
    apiAny.mockRejectedValue(new Error('Request failed with status code 500'));
    const queryClient = new QueryClient();
    renderDialog(queryClient);
    fireEvent.click(sendButton());
    await waitFor(() => expect(apiAny).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(queryClient.isMutating()).toBe(0));
    await waitFor(() => expect(sendButton().disabled).toBe(false));
    fireEvent.click(sendButton());
    await waitFor(() => expect(apiAny).toHaveBeenCalledTimes(2));
  });

  it('becomes usable again after a successful request', async () => {
    apiAny.mockResolvedValue(undefined);
    const queryClient = new QueryClient();
    renderDialog(queryClient);
    fireEvent.click(sendButton());
    await waitFor(() => expect(apiAny).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(queryClient.isMutating()).toBe(0));
    await waitFor(() => expect(sendButton().disabled).toBe(false));
  });
});
