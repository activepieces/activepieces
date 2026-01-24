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
import { chatlingAuth } from '../../index';
import { chatbotIdDropdown } from '../common/props';
import { makeRequest } from '../common';
import dayjs from 'dayjs';

type ContactItem = {
  id: string;
  name: string;
  email: string;
  phone: string;
  job_title: string;
  website: string;
  company: string;
  created_at: string;
};

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof chatlingAuth>,
  { chatbotId: string }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const response = await makeRequest<{
      data: {
        contacts: ContactItem[];
      };
    }>(
      auth.secret_text,
      HttpMethod.GET,
      `/chatbots/${propsValue.chatbotId}/contacts?sort=date_desc`
    );

    const contacts = response.data.contacts;

    const items = contacts
      .filter((contact) => {
        if (lastFetchEpochMS === 0) return true;
        return dayjs(contact.created_at).valueOf() > lastFetchEpochMS;
      })
      .map((contact) => ({
        epochMilliSeconds: dayjs(contact.created_at).valueOf(),
        data: contact,
      }));

    return items;
  },
};

export const newContact = createTrigger({
  auth: chatlingAuth,
  name: 'new_contact',
  displayName: 'New Contact/Lead',
  description: 'Triggers when a new contact or lead is collected by the chatbot.',
  props: {
    chatbotId: chatbotIdDropdown,
  },
  type: TriggerStrategy.POLLING,
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
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
  sampleData: {
    id: 'contact_abc123',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    job_title: 'Product Manager',
    website: 'https://example.com',
    company: 'Acme Inc',
    created_at: '2024-01-15T10:30:00.000Z',
  },
});
