import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  HttpMethod,
} from '@activepieces/pieces-common';
import { useinboxAuth } from '../common/auth';
import { useinboxClient } from '../common/client';

type Contact = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  status?: number;
  tags?: string[];
  createTime?: string;
  updateTime?: string;
};

type ContactListResponse = {
  resultStatus: boolean;
  resultObject?: {
    displayCount?: number;
    totalCount?: number;
    items?: Contact[];
  };
};

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof useinboxAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth }) => {
    const token = await useinboxClient.fetchAccessToken({
      email: auth.username,
      password: auth.password,
    });
    const response = await useinboxClient.inboxApiCall<ContactListResponse>({
      token,
      service: 'inbox',
      method: HttpMethod.GET,
      path: '/contacts',
    });
    const contacts = response.body?.resultObject?.items ?? [];
    return contacts
      .filter((c) => Boolean(c.createTime))
      .map((c) => ({
        epochMilliSeconds: new Date(c.createTime as string).getTime(),
        data: {
          contact_id: c.id,
          email: c.email,
          first_name: c.firstName ?? null,
          last_name: c.lastName ?? null,
          status: c.status ?? null,
          tags: Array.isArray(c.tags) ? c.tags.join(', ') : null,
          created_at: c.createTime ?? null,
          updated_at: c.updateTime ?? null,
        },
      }));
  },
};

export const newContactTrigger = createTrigger({
  auth: useinboxAuth,
  name: 'new_contact',
  displayName: 'New Contact',
  description:
    'Triggers when a new contact is added to your INBOX account (through a form, manual entry, import, or API).',
  props: {},
  sampleData: {
    contact_id: '5df9d4b691183c000106cb90',
    email: 'jane@example.com',
    first_name: 'Jane',
    last_name: 'Doe',
    status: 1,
    tags: 'newsletter, vip',
    created_at: '2024-01-15T10:30:00.000Z',
    updated_at: '2024-01-15T10:30:00.000Z',
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
