import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { instantlyAuth } from '../auth';
import { instantlyClient } from '../common/client';
import { instantlyProps } from '../common/props';
import { InstantlyCampaignAnalytics } from '../common/types';

export const getCampaignAnalyticsAction = createAction({
  auth: instantlyAuth,
  name: 'get_campaign_analytics',
  displayName: 'Get Campaign Analytics',
  description: 'Gets analytics data for a specific campaign.',
  props: {
    campaign_id: instantlyProps.campaignId(true),
    start_date: Property.DateTime({
      displayName: 'Start Date',
      description: 'Start date for the analytics period.',
      required: false,
    }),
    end_date: Property.DateTime({
      displayName: 'End Date',
      description: 'End date for the analytics period.',
      required: false,
    }),
  },
  async run(context) {
    const { campaign_id, start_date, end_date } = context.propsValue;

    const query: Record<string, string | undefined> = {
      campaign_id,
    };
    if (start_date) query['start_date'] = start_date;
    if (end_date) query['end_date'] = end_date;

    return instantlyClient.makeRequest<InstantlyCampaignAnalytics>({
      auth: context.auth.secret_text,
      method: HttpMethod.GET,
      path: 'analytics/campaign',
      query,
    });
  },
});
