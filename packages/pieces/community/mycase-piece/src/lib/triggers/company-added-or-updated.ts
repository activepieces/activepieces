import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { mycaseAuth } from '../../index';
import { createMyCaseApi } from '../common/mycase-api';
import dayjs from 'dayjs';

const polling: Polling<OAuth2PropertyValue, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const api = createMyCaseApi(auth);

    const lastFetchDate = dayjs(lastFetchEpochMS).toISOString();

    const queryParams: Record<string, string> = {
      'filter[updated_after]': lastFetchDate,
      page_size: '1000',
    };

    const response = await api.get('/companies', queryParams);

    if (response.success && Array.isArray(response.data)) {
      return response.data.map((company: any) => ({
        epochMilliSeconds: dayjs(company.created_at).valueOf(),
        data: company,
      }));
    }

    return [];
  },
};

export const companyAddedOrUpdated = createTrigger({
  auth: mycaseAuth,
  name: 'company_added_or_updated',
  displayName: 'Company Added or Updated',
  description: 'Triggers when a company has been added or updated',
  props: {},
  sampleData: {
    id: 12345,
    name: 'Acme Corporation',
    email: 'contact@acmecorp.com',
    website: 'https://www.acmecorp.com',
    main_phone_number: '555-123-4567',
    fax_phone_number: '555-987-6543',
    address: {
      address1: '456 Business Ave',
      address2: 'Floor 5',
      city: 'New York',
      state: 'NY',
      zip_code: '10001',
      country: 'USA',
    },
    notes: 'Important company notes',
    cases: [
      {
        id: 100,
      },
    ],
    clients: [
      {
        id: 200,
      },
    ],
    custom_field_values: [],
    archived: false,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-15T14:30:00Z',
  },
  type: TriggerStrategy.POLLING,
  async onEnable(ctx) {
    await pollingHelper.onEnable(polling, {
      auth: ctx.auth,
      store: ctx.store,
      propsValue: ctx.propsValue,
    });
  },
  async onDisable(ctx) {
    await pollingHelper.onDisable(polling, {
      auth: ctx.auth,
      store: ctx.store,
      propsValue: ctx.propsValue,
    });
  },
  async run(ctx) {
    return await pollingHelper.poll(polling, ctx);
  },
  async test(ctx) {
    return await pollingHelper.test(polling, {
      auth: ctx.auth,
      store: ctx.store,
      propsValue: ctx.propsValue,
      files: ctx.files,
    });
  },
});
