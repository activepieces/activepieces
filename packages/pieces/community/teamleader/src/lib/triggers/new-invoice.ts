import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  HttpMethod,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { teamleaderAuth } from '../common/auth';
import { makeRequest } from '../common/client';

const polling: Polling<any, { statusFilter?: string; pageSize?: number }> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const requestBody: any = {
      filter: {
        updated_since: lastFetchEpochMS
          ? dayjs(lastFetchEpochMS).toISOString()
          : dayjs().subtract(1, 'day').toISOString(),
      },
      page: {
        size: propsValue.pageSize || 20,
        number: 1,
      },
      sort: [
        {
          field: 'updated_at',
          order: 'desc',
        },
      ],
    };

    // Add status filter if specified
    if (propsValue.statusFilter) {
      requestBody.filter.status = propsValue.statusFilter;
    }

    const response = await makeRequest(
      auth.access_token,
      HttpMethod.POST,
      '/invoices.list',
      requestBody
    );

    return response.data
      .filter((invoice: any) => {
        // Filter for invoices that are booked, sent, or paid
        return (
          invoice.status === 'booked' ||
          invoice.status === 'sent' ||
          invoice.paid === true
        );
      })
      .map((invoice: any) => ({
        epochMilliSeconds: dayjs(invoice.updated_at).valueOf(),
        data: invoice,
      }));
  },
};

export const newInvoice = createTrigger({
  auth: teamleaderAuth,
  name: 'newInvoice',
  displayName: 'New Invoice (Paid)',
  description:
    'Triggers when an invoice is booked, sent, or paid in Teamleader',
  props: {
    statusFilter: Property.StaticDropdown({
      displayName: 'Status Filter',
      description: 'Filter invoices by specific status (optional)',
      required: false,
      options: {
        options: [
          { label: 'Booked', value: 'booked' },
          { label: 'Sent', value: 'sent' },
          { label: 'Paid', value: 'paid' },
          { label: 'Matched', value: 'matched' },
        ],
      },
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'Number of invoices to fetch per poll (max 100)',
      required: false,
      defaultValue: 20,
    }),
  },
  sampleData: {
    id: '2aa4a6a9-9ce8-4851-a9b3-26aea2ea14c4',
    department: {
      type: 'department',
      id: '5e90eb0a-b502-4344-aa0f-3b8525af6186',
    },
    invoice_number: '2017 / 5',
    invoice_date: '2016-02-04',
    status: 'matched',
    due_on: '2016-03-03',
    paid: true,
    paid_at: '2016-02-04T16:44:33+00:00',
    sent: true,
    purchase_order_number: '000023',
    payment_reference: '+++084/2613/66074+++',
    invoicee: {
      name: 'De Rode Duivels',
      vat_number: 'BE0899623035',
      customer: {
        type: 'contact',
        id: '4b0f959a-27e3-4080-b1b2-a05b374863cb',
      },
    },
    total: {
      tax_exclusive: {
        amount: 123.3,
        currency: 'EUR',
      },
      tax_inclusive: {
        amount: 123.3,
        currency: 'EUR',
      },
      payable: {
        amount: 123.3,
        currency: 'EUR',
      },
    },
    created_at: '2016-02-04T16:44:33+00:00',
    updated_at: '2016-02-05T16:44:33+00:00',
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
