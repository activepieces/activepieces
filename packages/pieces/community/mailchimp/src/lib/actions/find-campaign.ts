import { createAction, Property } from '@activepieces/pieces-framework';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../auth';

export const findCampaign = createAction({
  auth: mailchimpAuth,
  name: 'find_campaign',
  displayName: 'Find Campaign',
  description: 'Search for campaigns by name or other criteria',
  props: {
    search_term: Property.ShortText({
      displayName: 'Search Term',
      description: 'Search term to find campaigns (searches in subject line and title)',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Campaign Status',
      description: 'Filter campaigns by status',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Any Status', value: '' },
          { label: 'Save', value: 'save' },
          { label: 'Paused', value: 'paused' },
          { label: 'Schedule', value: 'schedule' },
          { label: 'Sending', value: 'sending' },
          { label: 'Sent', value: 'sent' },
        ],
      },
    }),
    type: Property.StaticDropdown({
      displayName: 'Campaign Type',
      description: 'Filter campaigns by type',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Any Type', value: '' },
          { label: 'Regular', value: 'regular' },
          { label: 'Plain Text', value: 'plaintext' },
          { label: 'A/B Test', value: 'absplit' },
          { label: 'RSS', value: 'rss' },
        ],
      },
    }),
    count: Property.Number({
      displayName: 'Number of Results',
      description: 'Maximum number of campaigns to return (default: 10, max: 1000)',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    try {
      let endpoint = '/campaigns?';
      const params = new URLSearchParams();

      if (context.propsValue.status) {
        params.append('status', context.propsValue.status);
      }
      if (context.propsValue.type) {
        params.append('type', context.propsValue.type);
      }
      if (context.propsValue.count) {
        params.append('count', context.propsValue.count.toString());
      }

      endpoint += params.toString();

      const response = await mailchimpCommon.makeApiRequest(
        context.auth,
        endpoint
      );

      let campaigns = response.body.campaigns || [];

      // Filter by search term if provided
      if (context.propsValue.search_term) {
        const searchTerm = context.propsValue.search_term.toLowerCase();
        campaigns = campaigns.filter((campaign: any) => 
          (campaign.settings?.subject_line?.toLowerCase().includes(searchTerm)) ||
          (campaign.settings?.title?.toLowerCase().includes(searchTerm))
        );
      }

      return {
        campaigns,
        total_items: campaigns.length,
      };
    } catch (error) {
      throw new Error(`Failed to find campaigns: ${JSON.stringify(error)}`);
    }
  },
});
