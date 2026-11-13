/**
 * @vitest-environment jsdom
 */
import { FlowTrigger, FlowTriggerType } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { axiosMock, toastErrorMock, waitMock } = vi.hoisted(() => ({
  axiosMock: vi.fn(),
  toastErrorMock: vi.fn(),
  waitMock: vi.fn(),
}));

vi.mock('i18next', () => ({
  t: (key: string, values?: Record<string, unknown>) =>
    Object.entries(values ?? {}).reduce(
      (text, [name, value]) => text.replace(`{${name}}`, String(value)),
      key,
    ),
}));

vi.mock('axios', () => ({ default: axiosMock }));

vi.mock('@/lib/api', () => ({
  api: {
    extractServerErrorMessage: (error: unknown, fallback: string) =>
      error instanceof Error ? error.message : fallback,
  },
}));

vi.mock('@/lib/dom-utils', () => ({ wait: waitMock }));

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
  'No sample data arrived after 30 seconds. It can still arrive while this dialog stays open. If it does not, check the request and the trigger settings, then send again.';

function catchWebhookTrigger(input: Record<string, unknown>): FlowTrigger {
  return {
    name: 'trigger',
    valid: true,
    displayName: 'Catch Webhook',
    lastUpdatedDate: '2026-10-07T00:00:00.000Z',
    type: FlowTriggerType.PIECE,
    settings: {
      pieceName: '@activepieces/piece-webhook',
      pieceVersion: '0.1.42',
      triggerName: 'catch_webhook',
      propertySettings: {},
      input,
    },
  };
}

function mount(
  trigger: FlowTrigger = catchWebhookTrigger({ authType: 'none' }),
) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <TestWebhookDialog
        testingMode="trigger"
        open={true}
        onOpenChange={vi.fn()}
        currentStep={trigger}
      />
    </QueryClientProvider>,
  );
}

function sendButton() {
  return screen.getByRole<HTMLButtonElement>('button', { name: 'Send' });
}

describe('TestWebhookDialog (trigger)', () => {
  beforeEach(() => {
    axiosMock.mockReset();
    toastErrorMock.mockReset();
    waitMock.mockReset();
    waitMock.mockResolvedValue(undefined);
  });

  it('stops loading and explains when no sample arrives after sending', async () => {
    axiosMock.mockResolvedValue({});
    let finishWait: () => void = () => undefined;
    waitMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finishWait = resolve;
        }),
    );
    mount();

    fireEvent.click(sendButton());

    await waitFor(() => expect(waitMock).toHaveBeenCalledWith(30000));
    expect(screen.queryAllByRole('button', { name: 'Send' }).length).toBe(0);
    expect(screen.queryAllByText(NO_SAMPLE_NOTE).length).toBe(0);

    act(() => finishWait());

    await screen.findByText(NO_SAMPLE_NOTE);
    expect(axiosMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://cloud.example.com/api/v1/webhooks/flow-1/test',
      }),
    );
    expect(sendButton().disabled).toBe(false);
  });

  it('sends a user-typed Authorization header unchanged', async () => {
    axiosMock.mockResolvedValue({});
    mount(catchWebhookTrigger({ authType: 'basic' }));

    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Headers' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Add Item' }));
    const [keyInput, valueInput] = within(
      screen.getByRole('tabpanel'),
    ).getAllByRole('textbox');
    fireEvent.change(keyInput, { target: { value: 'Authorization' } });
    fireEvent.change(valueInput, {
      target: { value: 'Basic dXNlcjpzM2NyZXQ=' },
    });
    fireEvent.click(sendButton());

    await waitFor(() => expect(axiosMock).toHaveBeenCalled());
    expect(axiosMock).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: { Authorization: 'Basic dXNlcjpzM2NyZXQ=' },
      }),
    );
  });

  it('re-enables Send and shows the server error when the request fails', async () => {
    axiosMock.mockRejectedValue(new Error('Payload too large'));
    mount();

    fireEvent.click(sendButton());

    await waitFor(() => expect(axiosMock).toHaveBeenCalled());
    await waitFor(() => expect(sendButton().disabled).toBe(false));
    expect(toastErrorMock).toHaveBeenCalledWith('Payload too large');
    expect(screen.queryAllByText(NO_SAMPLE_NOTE).length).toBe(0);
  });

  it.each([
    {
      name: 'a named auth header',
      input: {
        authType: 'header',
        authFields: { headerName: 'x-api-key', headerValue: 'secret' },
      },
      note: 'This trigger only accepts requests that include the x-api-key header. Add the header in the Headers tab before you send.',
    },
    {
      name: 'an auth header whose name is a template',
      input: {
        authType: 'header',
        authFields: { headerName: "{{connections['webhook-key']}}" },
      },
      note: 'This trigger only accepts requests that include its authentication header. Add the header in the Headers tab before you send.',
    },
    {
      name: 'Basic Auth',
      input: {
        authType: 'basic',
        authFields: { username: 'user', password: 's3cret' },
      },
      note: 'This trigger uses Basic Auth. Add an Authorization header with the username and password from the trigger settings before you send.',
    },
    {
      name: 'an HMAC signature in a named header',
      input: {
        authType: 'hmac',
        authFields: { hmacHeaderName: 'x-signature', hmacSecret: 's3cret' },
      },
      note: 'This trigger checks an HMAC signature. Add the x-signature header with the signature of the exact request body before you send. You can also send the sample to the Test URL from the service that signs the request.',
    },
    {
      name: 'an HMAC signature in a header whose name is a template',
      input: {
        authType: 'hmac',
        authFields: { hmacHeaderName: '{{trigger.signatureHeader}}' },
      },
      note: 'This trigger checks an HMAC signature. Add the signature header with the signature of the exact request body before you send. You can also send the sample to the Test URL from the service that signs the request.',
    },
  ])(
    'tells the user before sending that the trigger requires $name',
    ({ input, note }) => {
      mount(catchWebhookTrigger(input));

      expect(screen.getByText(note)).toBeTruthy();
    },
  );

  it('shows no auth note when the trigger has no authentication', () => {
    mount(catchWebhookTrigger({ authType: 'none', authFields: {} }));

    expect(screen.queryAllByText(/^This trigger /).length).toBe(0);
  });
});
