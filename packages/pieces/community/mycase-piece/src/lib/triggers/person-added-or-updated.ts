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

    const response = await api.get('/clients', queryParams);

    if (response.success && Array.isArray(response.data)) {
      return response.data.map((person: any) => ({
        epochMilliSeconds: dayjs(person.created_at).valueOf(),
        data: person,
      }));
    }

    return [];
  },
};

export const personAddedOrUpdated = createTrigger({
  auth: mycaseAuth,
  name: 'person_added_or_updated',
  displayName: 'Person Added or Updated',
  description: 'Triggers when a person (client) has been added or updated',
  props: {},
  sampleData: {
    id: 12345,
    email: 'john.doe@example.com',
    first_name: 'John',
    middle_name: 'Michael',
    last_name: 'Doe',
    address: {
      address1: '123 Main St',
      address2: 'Suite 100',
      city: 'Los Angeles',
      state: 'CA',
      zip_code: '90001',
      country: 'USA',
    },
    cell_phone_number: '555-123-4567',
    work_phone_number: '555-987-6543',
    home_phone_number: '555-111-2222',
    fax_phone_number: '555-333-4444',
    contact_group: 'Client',
    people_group: {
      id: 1,
    },
    notes: 'Important client notes',
    birthdate: '1980-05-15',
    archived: false,
    cases: [
      {
        id: 100,
      },
    ],
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
