import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { instantlyAuth } from '../auth';
import { instantlyClient } from '../common/client';
import { InstantlyLead } from '../common/types';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof instantlyAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, lastFetchEpochMS }) {
    const isTest = lastFetchEpochMS === 0;

    const leads = await instantlyClient.listAllPages<InstantlyLead>({
      auth: auth.secret_text,
      path: 'leads/list',
      method: HttpMethod.POST,
      maxPages: isTest ? 1 : undefined,
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
  classification: 'READ',
  displayName: 'New Lead Added',
  description: 'Triggers when a new lead is added to a campaign',
  aiMetadata: {
    description: 'Fires when a new lead appears in Instantly, polling the leads list and emitting each newly created lead by its creation timestamp. Represents a lead being added across the workspace.',
  },
  props: {},
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async test(context) {
    return pollingHelper.test(polling, context);
  },
  async run(context) {
    return pollingHelper.poll(polling, context);
  },
  sampleData: {
    id: 'd1f61dbc-bcb2-44fb-86b8-3d01c8701fe9',
    timestamp_created: '2025-05-25T12:50:04.748Z',
    timestamp_updated: '2025-05-25T13:00:52.019Z',
    organization: '31ef9f6c-00f0-481f-b309-95694ed324bb',
    status: 1,
    email_open_count: 0,
    email_reply_count: 0,
    email_click_count: 0,
    company_domain: 'test@gmail.com',
    status_summary: {},
    campaign: 'd228fc8f-44f2-42f3-b63f-3667dafc24cf',
    email: 'test@gmail.com',
    payload: {
      email: 'test@gmail.com',
      lastTouch: null,
      leadOwner: 'Test',
      leadSource: 'manual',
    },
    uploaded_by_user: '7f74fadd-b96b-4011-a1da-9b81a5bed165',
    upload_method: 'manual',
    assigned_to: '7f74fadd-b96b-4011-a1da-9b81a5bed165',
    esp_code: 1,
  },
});
