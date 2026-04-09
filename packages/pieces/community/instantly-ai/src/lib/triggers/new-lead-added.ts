import {
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { SecretTextConnectionValue } from '@activepieces/shared';
import { instantlyAuth } from '../auth';
import { instantlyClient } from '../common/client';
import { InstantlyLead } from '../common/types';
import dayjs from 'dayjs';

const polling: Polling<SecretTextConnectionValue, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, lastFetchEpochMS }) {
    const isTest = lastFetchEpochMS === 0;

    const leads = await instantlyClient.listAllPages<InstantlyLead>({
      auth: auth.secret_text,
      path: 'leads/list',
      method: HttpMethod.POST,
      maxPages: isTest ? 1 : 50,
    });

    return leads.map((lead) => ({
      epochMilliSeconds: dayjs(lead.timestamp_created).valueOf(),
      data: lead,
    }));
  },
};

export const newLeadAddedTrigger = createTrigger({
  auth: instantlyAuth,
  name: 'new_lead_added',
  displayName: 'New Lead Added',
  description: 'Triggers when a new lead is added to a campaign',
  props: {},
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
    id: 'd1f61dbc-bcb2-44fb-86b8-3d01c8701fe9',
    timestamp_created: '2025-05-25T12:50:04.748Z',
    timestamp_updated: '2025-05-25T13:00:52.019Z',
    status: 1,
    email_open_count: 0,
    email_reply_count: 0,
    email_click_count: 0,
    email: 'test@gmail.com',
    first_name: 'John',
    last_name: 'Doe',
  },
});
