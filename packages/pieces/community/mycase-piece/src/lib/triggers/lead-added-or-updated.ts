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

    const response = await api.get('/leads', queryParams);

    if (response.success && Array.isArray(response.data)) {
      return response.data.map((lead: any) => ({
        epochMilliSeconds: dayjs(lead.created_at).valueOf(),
        data: lead,
      }));
    }

    return [];
  },
};

export const leadAddedOrUpdated = createTrigger({
  auth: mycaseAuth,
  name: 'lead_added_or_updated',
  displayName: 'Lead Added or Updated',
  description: 'Triggers when a lead has been added or updated',
  props: {},
  sampleData: {
    id: 12345,
    email: 'lead@example.com',
    first_name: 'Jane',
    middle_initial: 'M',
    last_name: 'Smith',
    address: {
      address1: '789 Lead St',
      address2: 'Apt 3',
      city: 'Chicago',
      state: 'IL',
      zip_code: '60601',
      country: 'USA',
    },
    cell_phone_number: '555-123-4567',
    work_phone_number: '555-987-6543',
    home_phone_number: '555-111-2222',
    lead_details: 'Potential client for personal injury case',
    birthdate: '1985-03-20',
    drivers_license_number: 'D1234567',
    drivers_license_state: 'IL',
    status: 'New',
    approved: false,
    referral_source_reference: {
      id: 1,
    },
    referred_by: {
      id: 100,
    },
    custom_field_values: [],
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
