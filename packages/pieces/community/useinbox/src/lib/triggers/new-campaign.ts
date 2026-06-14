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

type Campaign = {
  id: string;
  name?: string;
  subject?: string;
  senderAccountId?: string;
  newsletterId?: string;
  status?: number;
  plannedTime?: string;
  createTime?: string;
  updateTime?: string;
};

type CampaignListResponse = {
  resultStatus: boolean;
  resultObject?: {
    displayCount?: number;
    totalCount?: number;
    items?: Campaign[];
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
    const response = await useinboxClient.inboxApiCall<CampaignListResponse>({
      token,
      service: 'inbox',
      method: HttpMethod.GET,
      path: '/campaigns',
    });
    const campaigns = response.body?.resultObject?.items ?? [];
    return campaigns
      .filter((c) => Boolean(c.createTime))
      .map((c) => ({
        epochMilliSeconds: new Date(c.createTime as string).getTime(),
        data: {
          campaign_id: c.id,
          name: c.name ?? null,
          subject: c.subject ?? null,
          sender_id: c.senderAccountId ?? null,
          newsletter_id: c.newsletterId ?? null,
          status: c.status ?? null,
          planned_time: c.plannedTime ?? null,
          created_at: c.createTime ?? null,
          updated_at: c.updateTime ?? null,
        },
      }));
  },
};

export const newCampaignTrigger = createTrigger({
  auth: useinboxAuth,
  name: 'new_campaign',
  displayName: 'New Campaign',
  description:
    'Triggers when a new campaign is created in your INBOX account.',
  aiMetadata: {
    description:
      'Fires when a new campaign is created in the INBOX account. Represents a newly created campaign record and emits its details.',
  },
  props: {},
  sampleData: {
    campaign_id: '5df9d4b691183c000106cb90',
    name: 'Spring Newsletter',
    subject: 'Our biggest spring sale yet',
    sender_id: '5dd582ff648e4e0001db6171',
    newsletter_id: '5def48547bef2800014e94f1',
    status: 1,
    planned_time: '2024-04-01T09:00:00.000Z',
    created_at: '2024-03-25T10:30:00.000Z',
    updated_at: '2024-03-25T10:30:00.000Z',
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
