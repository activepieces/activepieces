import { createAction, Property } from '@activepieces/pieces-framework';
import { ReachinboxAuth } from '../..';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { reachinboxCommon } from '../common/index';

// Define the structure of the summary response
interface SummaryAnalyticsResponse {
  status: number;
  message: string;
  data: {
    totalSent: number;
    open: number;
    openRate: string;
    click: number;
    clickRate: string;
    reply: number;
    replyRate: string;
    result: Array<{
      date: string;
      sent: number;
      totalOpens: string;
      uniqueOpens: string;
      linksClicked: string;
      totalReplies: string;
    }>;
  };
}

export const getSummary = createAction({
  auth: ReachinboxAuth,
  name: 'getSummary',
  classification: 'READ',
  displayName: 'Get Analytics Summary',
  description: 'Gets totals for all campaigns over a date range.',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves account-wide outreach analytics (totals and rates for sent, opens, clicks, and replies) aggregated across all campaigns for a date range. Use for an overall performance summary rather than a single campaign. Requires start/end dates in YYYY-MM-DD format; read-only and idempotent.',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'range',
      display: 'section',
      label: 'Date Range',
      icon: 'calendar',
      props: ['startDate', 'endDate'],
    },
  ],
  props: {
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
    const { startDate, endDate } = context.propsValue;

    // Build the URL with the startDate and endDate query parameters
    const url = `${reachinboxCommon.baseUrl}analytics/summary?startDate=${startDate}&endDate=${endDate}`;

    try {
      const response = await httpClient.sendRequest<SummaryAnalyticsResponse>({
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
        throw new Error(`Failed to fetch summary: ${response.body.message}`);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          success: false,
          message: 'Summary data not found for the provided date range.',
        };
      } else {
        throw new Error(`Failed to fetch summary: ${error.message}`);
      }
    }
  },
});
