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
import { echowinAuth } from '../common/auth';
import dayjs from 'dayjs';
import { makeRequest } from '../common/client';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof echowinAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const queryParams = new URLSearchParams({
      page: '1',
      limit: '100',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    const response = await makeRequest(
      auth.secret_text,
      HttpMethod.GET,
      `/contacts?${queryParams.toString()}`
    );

    const contacts = response.data;

    return contacts
      .filter((contact: any) => {
        const createdAtEpoch = dayjs(contact.createdAt).valueOf();
        return createdAtEpoch > lastFetchEpochMS;
      })
      .map((contact: any) => ({
        epochMilliSeconds: dayjs(contact.createdAt).valueOf(),
        data: contact,
      }));
  },
};

export const newContact = createTrigger({
  auth: echowinAuth,
  name: 'newContact',
  displayName: 'New Contact',
  description: 'Trigger when a new contact is created in Echowin',
  props: {},
  sampleData: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    number: '+15551234567',
    carrier: 'AT&T',
    customFields: {
      company: 'Acme Corp',
      role: 'Manager',
    },
    tags: [
      {
        id: 'tag-id-1',
        name: 'VIP',
        color: '#10B981',
      },
      {
        id: 'tag-id-2',
        name: 'Lead',
        color: '#3B82F6',
      },
    ],
    crmStage: {
      id: 'stage-id',
      name: 'Lead',
    },
    createdAt: '2024-01-01T00:00:00.000Z',
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
