import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { heymarketSmsAuth } from '../common/auth';
import { makeRequest } from '../common/client';

interface HeymarketContact {
  id: number;
  display_name: string;
  first: string;
  last: string;
  email: string;
  phone: string;
  created: string;
  updated: string;
  team_id: number;
  creator_id: number;
  custom: Record<string, unknown>;
  assigned_user_id: number;
  is_opted_out: boolean;
  tags: unknown[];
}

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof heymarketSmsAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ propsValue, auth, lastFetchEpochMS }) => {
    const apiKey = auth.secret_text;

    // Convert lastFetchEpochMS to RFC 3339 format for Heymarket API
    const lastFetchDate = lastFetchEpochMS
      ? dayjs(lastFetchEpochMS).toISOString()
      : undefined;

    // Fetch contacts from Heymarket API with pagination
    const requestBody: Record<string, unknown> = {
      ...(lastFetchDate && { date: lastFetchDate }),
    };

    const response = await makeRequest(
      apiKey,
      HttpMethod.POST,
      '/v1/contacts',
      requestBody
    );

    if (!Array.isArray(response)) {
      return [];
    }

    const contacts = response as HeymarketContact[];

    return contacts.map((contact) => ({
      epochMilliSeconds: dayjs(contact.updated).valueOf(),
      data: contact,
    }));
  },
};

export const newOrUpdatedContact = createTrigger({
  auth: heymarketSmsAuth,
  name: 'newOrUpdatedContact',
  displayName: 'New or Updated Contact',
  description:
    'Trigger when a new contact is created or an existing contact is updated',
  props: {},
  sampleData: {
    id: 123456,
    display_name: 'John Doe',
    first: 'John',
    last: 'Doe',
    email: 'john.doe@example.com',
    phone: '15105553344',
    created: '2024-01-01T00:00:00Z',
    updated: '2024-01-02T12:30:00Z',
    team_id: 789,
    creator_id: 456,
    custom: {},
    assigned_user_id: 111,
    is_opted_out: false,
    tags: [],
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },

  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, { store, auth, propsValue });
  },

  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
