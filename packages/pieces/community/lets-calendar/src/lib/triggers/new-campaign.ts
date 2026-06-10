import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { letsCalendarAuth } from '../common/auth';
import { getAccessToken, makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

interface Campaign {
  campaign_id: string;
  title: string;
  subject: string;
  start_datetime: string;
  end_datetime: string;
  timezone: string;
  created_on: string;
}

interface CampaignsResponse {
  campaigns: {
    data: Campaign[];
  };
}

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof letsCalendarAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth }) => {
    try {
      const accessToken = await getAccessToken(
        auth.props.client_key,
        auth.props.secret_key
      );

      const response = (await makeRequest(
        accessToken,
        HttpMethod.GET,
        '/campaigns?page=1'
      )) as CampaignsResponse;

      const campaigns = response.campaigns.data || [];

      return campaigns.map((campaign) => ({
        epochMilliSeconds: dayjs(campaign.created_on).valueOf(),
        data: campaign,
      }));
    } catch (error) {
      return [];
    }
  },
};

export const newCampaign = createTrigger({
  auth: letsCalendarAuth,
  name: 'newCampaign',
  displayName: 'New Campaign',
  description: 'Trigger when a new campaign is created',
  props: {},
  sampleData: {
    campaign_id: 'Q2Q4g1rr333lcxZXkzW4',
    title: 'APIs Campaign',
    subject: 'APIs Campaign',
    start_datetime: '2026-04-23 13:00:00',
    end_datetime: '2026-04-23 14:00:00',
    timezone: 'Asia/Kolkata',
    created_on: '2025-04-24 10:47:22',
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
