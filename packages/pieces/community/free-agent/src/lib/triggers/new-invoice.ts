import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  DedupeStrategy,
  httpClient,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { freeAgentAuth } from '../../index';

const props = {
  status: Property.StaticDropdown({
    displayName: 'Invoice Status',
    description: 'Filter invoices by status',
    required: false,
    options: {
      options: [
        { label: 'All Invoices', value: 'all' },
        { label: 'Open', value: 'open' },
        { label: 'Overdue', value: 'overdue' },
        { label: 'Open or Overdue', value: 'open_or_overdue' },
        { label: 'Draft', value: 'draft' },
        { label: 'Paid', value: 'paid' },
        { label: 'Scheduled to Email', value: 'scheduled_to_email' },
      ],
    },
    defaultValue: 'all',
  }),
  include_items: Property.Checkbox({
    displayName: 'Include Invoice Items',
    description: 'Include invoice items in the response',
    required: false,
    defaultValue: false,
  }),
};

type PropsValue = {
  status?: string;
  include_items?: boolean;
};

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof freeAgentAuth>,
  PropsValue
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const { status, include_items } = propsValue;

    let url = 'https://api.freeagent.com/v2/invoices?';

    if (status && status !== 'all') {
      url += `view=${status}&`;
    }

    if (lastFetchEpochMS > 0) {
      const updatedSince = new Date(lastFetchEpochMS).toISOString();
      url += `updated_since=${encodeURIComponent(updatedSince)}&`;
    }

    if (include_items) {
      url += 'nested_invoice_items=true&';
    }

    url = url.replace(/&$/, '');

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.access_token,
      },
    });

    const invoices = response.body['invoices'] || [];

    return invoices.map((invoice: { created_at: string }) => ({
      epochMilliSeconds: new Date(invoice.created_at).getTime(),
      data: invoice,
    }));
  },
};

export const freeAgentNewInvoiceTrigger = createTrigger({
  auth: freeAgentAuth,
  name: 'new_invoice',
  displayName: 'New Invoice',
  description: 'Triggers when a new invoice is created',
  type: TriggerStrategy.POLLING,
  props,
  sampleData: {
    url: 'https://api.freeagent.com/v2/invoices/1',
    contact: 'https://api.freeagent.com/v2/contacts/2',
    dated_on: '2011-08-29',
    due_on: '2011-09-28',
    reference: '001',
    currency: 'GBP',
    exchange_rate: '1.0',
    net_value: '100.0',
    sales_tax_value: '20.0',
    total_value: '120.0',
    paid_value: '0.0',
    due_value: '120.0',
    status: 'Open',
    comments: 'An example invoice comment.',
    payment_terms_in_days: 30,
    created_at: '2011-08-29T00:00:00Z',
    updated_at: '2011-08-29T00:00:00Z',
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async run(context) {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  async test(context) {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
});
