import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { sageAccountingAuth } from '../auth';
import { sageAccountingClient } from '../client';
import { newContactPaymentTriggerOutputSchema } from '../output-schemas';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof sageAccountingAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const items = await sageAccountingClient.listAll<ContactPaymentPollRecord>({
      accessToken: auth.access_token,
      path: sageAccountingClient.paths.contactPayments,
      query: {
        ...(lastFetchEpochMS > 0
          ? { updated_or_created_since: new Date(lastFetchEpochMS).toISOString() }
          : {}),
      },
    });

    return items.map((record) => ({
      epochMilliSeconds: new Date(record.created_at).getTime(),
      data: record,
    }));
  },
};

export const newContactPaymentTrigger = createTrigger({
  auth: sageAccountingAuth,
  name: 'new_contact_payment',
  classification: 'READ',
  displayName: 'New Contact Payment',
  description: 'Triggers when a new contact payment is created in Sage Accounting.',
  aiMetadata: {
    description: 'Fires once for each new contact payment (received from a customer or made to a vendor) created in Sage Accounting.',
  },
  outputSchema: newContactPaymentTriggerOutputSchema,
  props: {},
  sampleData: {
    id: 'abf85666183b4518af9639bff387b6d8',
    displayed_as: 'ABS Garages payment',
    reference: 'REF-556',
    date: '2026-01-15',
    total_amount: 100.4,
    transaction_type: { id: 'CUSTOMER_RECEIPT', displayed_as: 'Customer Receipt' },
    created_at: '2026-01-15T10:30:00Z',
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});

type ContactPaymentPollRecord = {
  id: string;
  displayed_as: string;
  reference: string | null;
  date: string;
  total_amount: number;
  transaction_type: { id: string; displayed_as: string };
  created_at: string;
};
