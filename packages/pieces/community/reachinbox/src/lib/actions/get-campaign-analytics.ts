import { createAction, Property } from '@activepieces/pieces-framework';
import { fetchCampaigns, reachinboxCommon } from '../common/index';
import { ReachinboxAuth } from '../..';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

// Define the structure of the analytics response
interface CampaignAnalyticsResponse {
  status: number;
  message: string;
  data: {
    totalSent: number;
    opened: number;
    openRate: string;
    clicked: number;
    clickRate: string;
    replied: number;
    replyRate: string;
    campaignStatus: string;
    result: Array<{
      date: string;
      sent: number;
      totalOpens: string;
      uniqueOpens: string;
      linksClicked: string;
      totalReplies: string;
    }>;
    stepAnalytics: Array<{
      step: string;
      uniqueOpens: number;
      linkClicked: number;
      totalReplies: number;
      openedPercentage: number;
      clickedPercentage: number;
      repliedPercentage: number;
      variants: Array<{
        variant: string;
        sent: number;
        uniqueOpens: number;
        linkClicked: number;
        totalReplies: number;
        openedPercentage: number;
        clickedPercentage: number;
        repliedPercentage: number;
      }>;
    }>;
    activity: Array<{
      step: number;
      fromEmail: string;
      toEmail: string;
      activity: string;
      timestamp: string;
    }>;
  };
}

export const getCampaignAnalytics = createAction({
  auth: ReachinboxAuth,
  name: 'getCampaignAnalytics',
  classification: 'READ',
  displayName: 'Get Campaign Analytics',
  description: 'Gets opens, clicks and replies for one campaign over a date range.',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves performance analytics (sent, opens, clicks, replies, per-step breakdowns, and activity) for one ReachInbox campaign over a date range. Use to report on or evaluate a specific campaign. Requires a campaign id and start/end dates in YYYY-MM-DD format; read-only and idempotent.',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'report',
      display: 'section',
      label: 'Report',
      icon: 'calendar',
      props: ['campaignId', 'startDate', 'endDate'],
    },
  ],
  props: {
    campaignId: Property.Dropdown({
  auth: ReachinboxAuth,
      displayName: 'Campaign',
      description: 'Your campaigns, newest first.',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }
        try {
          const campaigns = await fetchCampaigns(auth.secret_text);

          if (campaigns.length === 0) {
            return {
              disabled: true,
              options: [],
              placeholder: 'No campaigns found. Create one in ReachInbox first.',
            };
          }
          return {
            options: campaigns.map((campaign) => ({
              label: reachinboxCommon.campaignLabel(campaign),
              value: campaign.id.toString(),
            })),
            disabled: false,
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load campaigns. Check your connection.',
          };
        }
      },
    }),
    startDate: Property.ShortText({
      displayName: 'Start Date',
      description: 'Format YYYY-MM-DD.',
      placeholder: '2024-01-01',
      required: true,
      width: 'half',
    }),
    endDate: Property.ShortText({
      displayName: 'End Date',
      description: 'Format YYYY-MM-DD.',
      placeholder: '2024-01-31',
      required: true,
      width: 'half',
    }),
  },
  async run(context) {
    const { campaignId, startDate, endDate } = context.propsValue;

    // Validate date format if needed

    const url = `${reachinboxCommon.baseUrl}campaign/analytics?campaignId=${campaignId}&startDate=${startDate}&endDate=${endDate}`;

    try {
      const response = await httpClient.sendRequest<CampaignAnalyticsResponse>({
        method: HttpMethod.GET,
        url: url,
        headers: {
          Authorization: `Bearer ${context.auth.secret_text}`,
        },
      });

      if (response.body.status === 200) {
        return {
          success: true,
          message: response.body.message,
          data: response.body.data,
        };
      } else {
        throw new Error(`Failed to fetch analytics: ${response.body.message}`);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          success: false,
          message:
            'Campaign not found or analytics data unavailable for the provided date range.',
        };
      } else {
        throw new Error(`Failed to fetch analytics: ${error.message}`);
      }
    }
  },
});
