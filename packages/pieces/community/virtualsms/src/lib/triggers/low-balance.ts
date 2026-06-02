import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { request, virtualSmsAuth } from '../common';

interface BalanceResp {
  balance: number;
  success?: boolean;
}

export const lowBalance = createTrigger({
  auth: virtualSmsAuth,
  name: 'low_balance',
  displayName: 'Low Balance',
  description:
    'Fires once when balance crosses below the configured USD threshold. Debounced — only fires once per crossing.',
  type: TriggerStrategy.POLLING,
  props: {
    threshold: Property.Number({
      displayName: 'Threshold (USD)',
      description: 'Trigger fires when balance drops below this value',
      required: true,
      defaultValue: 5,
    }),
  },
  sampleData: {
    balance: 4.5,
    threshold: 5,
    currency: 'USD',
    crossed_at: '2026-05-24T12:34:56Z',
  },

  async onEnable(context) {
    await context.store.put('fired', false);
  },

  async onDisable(context) {
    await context.store.delete('fired');
  },

  async run(context) {
    const threshold = Number(context.propsValue.threshold ?? 5);
    const resp = await request<BalanceResp>(
      context.auth,
      HttpMethod.GET,
      '/api/v1/customer/balance'
    );
    const balance = Number(resp.balance);
    const fired = Boolean(await context.store.get<boolean>('fired'));

    if (balance < threshold && !fired) {
      await context.store.put('fired', true);
      return [
        {
          balance,
          threshold,
          currency: 'USD',
          crossed_at: new Date().toISOString(),
        },
      ];
    }
    if (balance >= threshold && fired) {
      await context.store.put('fired', false);
    }
    return [];
  },

  async test() {
    return [];
  },
});
