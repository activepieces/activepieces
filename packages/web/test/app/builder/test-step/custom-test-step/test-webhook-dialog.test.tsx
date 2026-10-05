/**
 * @vitest-environment jsdom
 */
import { EmptyTrigger, FlowTriggerType } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import axios from 'axios';
import { describe, expect, it, vi } from 'vitest';

import TestWebhookDialog from '@/app/builder/test-step/custom-test-step/test-webhook-dialog';

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();
  return { ...actual, default: vi.fn().mockResolvedValue({ data: {} }) };
});

vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: {
    useFlag: () => ({ data: 'https://ap.example.com/api/v1/webhooks' }),
  },
}));

vi.mock('@/app/builder/builder-hooks', () => ({
  useBuilderStateContext: (
    selector: (state: { flow: { id: string } }) => unknown,
  ) => selector({ flow: { id: 'flow-1' } }),
}));

const trigger: EmptyTrigger = {
  name: 'trigger',
  displayName: 'Trigger',
  type: FlowTriggerType.EMPTY,
  valid: true,
  lastUpdatedDate: '2026-10-05T00:00:00.000Z',
  settings: {},
};

describe('TestWebhookDialog', () => {
  it('sends a user-typed Authorization header to the webhook test url', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <TestWebhookDialog
          testingMode="trigger"
          currentStep={trigger}
          open
          onOpenChange={vi.fn()}
        />
      </QueryClientProvider>,
    );
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Headers' }));
    const panel = screen.getByRole('tabpanel');
    fireEvent.click(within(panel).getByRole('button', { name: 'Add Item' }));
    const [keyInput, valueInput] = within(panel).getAllByRole('textbox');
    fireEvent.change(keyInput, { target: { value: 'Authorization' } });
    fireEvent.change(valueInput, { target: { value: 'Basic dXNlcjpwYXNz' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() =>
      expect(axios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://ap.example.com/api/v1/webhooks/flow-1/test',
          headers: { Authorization: 'Basic dXNlcjpwYXNz' },
        }),
      ),
    );
  });
});
