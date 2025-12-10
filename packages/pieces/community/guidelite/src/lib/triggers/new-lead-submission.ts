import {
  createTrigger,
  TriggerStrategy,
  StaticPropsValue,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  HttpMethod,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { guideliteAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { assistantIdDropdown } from '../common/props';

const props = {
  assistantId: assistantIdDropdown,
};

const polling: Polling<AppConnectionValueForAuthProperty<typeof guideliteAuth>, StaticPropsValue<typeof props>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ propsValue, auth, lastFetchEpochMS }) => {
    const { assistantId } = propsValue;

    const fromDate = dayjs(lastFetchEpochMS).format('YYYY-MM-DD HH:mm:ss.SSS');
    const toDate = dayjs(Date.now()).format('YYYY-MM-DD HH:mm:ss.SSS');

    const leads = await makeRequest(
      auth,
      HttpMethod.POST,
      '/manage-assistant/lead',
      {
        assistantId,
        from: fromDate,
        to: toDate,
        country: 'all',
      }
    );

    return leads.map((lead: { createdDate: string }) => ({
      epochMilliSeconds: dayjs(lead.createdDate).valueOf(),
      data: lead,
    }));
  },
};

export const newLeadSubmission = createTrigger({
  auth: guideliteAuth,
  name: 'newLeadSubmission',
  displayName: 'new lead submission',
  description:
    'Trigger when a new lead is captured through the assistant conversation',
  props,
  sampleData: {
    createdDate: '2024-04-25T10:13:12.504Z',
    conversationId: '<YOUR-CONVERSATION-ID>',
    assistantId: '<YOUR-ASSISTANT-ID>',
    country: 'USA',
    emailId: 'user@gmail.com',
    phoneNumber: 1234567890,
    ipAddress: '192.168.1.1',
    city: 'New York',
    countryCode: 'US',
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
