import { createTrigger, TriggerStrategy, PiecePropValueSchema, Property, AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { bexioAuth } from '../../index';
import { BexioClient } from '../common/client';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import dayjs from 'dayjs';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof bexioAuth>,
  { status_id?: number }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS, propsValue }) => {
    const client = new BexioClient(auth);

    const isTest = lastFetchEpochMS === 0;

    const lastFetchDate = isTest
      ? dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss')
      : dayjs(lastFetchEpochMS).format('YYYY-MM-DD HH:mm:ss');

    const searchBody: Array<{ field: string; value: string; criteria: string }> = [
      {
        field: 'updated_at',
        value: lastFetchDate,
        criteria: '>=',
      },
    ];

    if (propsValue.status_id !== undefined && propsValue.status_id !== null) {
      searchBody.push({
        field: 'kb_item_status_id',
        value: propsValue.status_id.toString(),
        criteria: '=',
      });
    }

    const queryParams: Record<string, string> = {
      order_by: 'updated_at_desc',
      limit: isTest ? '5' : '500',
    };

    const orders = await client.post<Array<{
      id: number;
      document_nr: string;
      title: string | null;
      contact_id: number | null;
      contact_sub_id: number | null;
      user_id: number;
      project_id: number | null;
      language_id: number;
      bank_account_id: number;
      currency_id: number;
      payment_type_id: number;
      total_gross: string;
      total_net: string;
      total_taxes: string;
      total: string;
      kb_item_status_id: number;
      is_valid_from: string;
      updated_at: string;
    }>>('/2.0/kb_order/search', searchBody, queryParams);

    return orders.map((order) => {
      const updatedAt = order.updated_at || new Date().toISOString();
      const epochMilliSeconds = dayjs(updatedAt).valueOf();

      return {
        epochMilliSeconds,
        data: order,
      };
    });
  },
};

export const newOrderTrigger = createTrigger({
  auth: bexioAuth,
  name: 'new_order',
  displayName: 'New Order',
  description: 'Triggers when an Order is created or updated with the chosen status',
  type: TriggerStrategy.POLLING,
  props: {
    status_id: Property.Dropdown({
      auth: bexioAuth,
      displayName: 'Status',
      description: 'Filter orders by status (leave empty to trigger for all statuses)',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Bexio account first',
            options: [],
          };
        }

        try {
          const client = new BexioClient(auth);
          const statuses = await client.get<Array<{
            id: number;
            name: string;
          }>>('/2.0/kb_order_status').catch(() => []);

          if (statuses.length === 0) {
            return {
              disabled: false,
              placeholder: 'Status filter not available - will trigger for all statuses',
              options: [],
            };
          }

          return {
            disabled: false,
            options: statuses.map((status) => ({
              label: status.name,
              value: status.id,
            })),
          };
        } catch (error) {
          return {
            disabled: false,
            placeholder: 'Enter status ID manually or leave empty for all statuses',
            options: [],
          };
        }
      },
    }),
  },
  sampleData: {
    id: 4,
    document_nr: 'AU-00001',
    title: null,
    contact_id: 14,
    contact_sub_id: null,
    user_id: 1,
    project_id: null,
    language_id: 1,
    bank_account_id: 1,
    currency_id: 1,
    payment_type_id: 1,
    total_gross: '17.800000',
    total_net: '17.800000',
    total_taxes: '1.3706',
    total: '19.150000',
    kb_item_status_id: 5,
    is_valid_from: '2019-06-24',
    updated_at: '2019-04-08 13:17:32',
  },
  onEnable: async (context) => {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  onDisable: async (context) => {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  test: async (context) => {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  run: async (context) => {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
});

