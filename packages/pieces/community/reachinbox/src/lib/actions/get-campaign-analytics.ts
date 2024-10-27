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
  displayName: 'Get Campaign Analytics',
  description:
    'Fetch analytics data for a selected campaign based on a date range.',
  props: {
    campaignId: Property.Dropdown({
      displayName: 'Select Campaign',
      description:
        'Choose a campaign from the list or enter the campaign ID manually.',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        const campaigns = await fetchCampaigns(auth as string);

        return {
          options: campaigns.map((campaign) => ({
            label: campaign.name,
            value: campaign.id.toString(),
          })),
          disabled: campaigns.length === 0,
        };
      },
    }),
    startDate: Property.ShortText({
      displayName: 'Start Date',
      description: 'Enter the start date (YYYY-MM-DD). E.g. 2023-10-11',
      required: true, // Made mandatory again
    }),
    endDate: Property.ShortText({
      displayName: 'End Date',
      description: 'Enter the end date (YYYY-MM-DD). E.g. 2023-10-20',
      required: true, // Made mandatory again
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
          Authorization: `Bearer ${context.auth as string}`,
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
