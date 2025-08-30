import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { MailchimpClient } from '../common/types';

export const findCampaign = createAction({
  auth: mailchimpAuth,
  name: 'find_campaign',
  displayName: 'Find Campaign',
  description: 'Search campaigns by query, status, type, or other criteria',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Search terms to find campaigns (matches subject line, title, etc.)',
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
    fields: Property.LongText({
      displayName: 'Fields',
      description: 'Comma-separated list of fields to include in the response',
      required: false,
    }),
    exclude_fields: Property.LongText({
      displayName: 'Exclude Fields',
      description: 'Comma-separated list of fields to exclude from the response',
      required: false,
    }),
  },
  async run(context) {
    const accessToken = getAccessTokenOrThrow(context.auth);
    const server = await mailchimpCommon.getMailChimpServerPrefix(accessToken);

    const client = mailchimp as unknown as MailchimpClient;
    client.setConfig({
      accessToken: accessToken,
      server: server,
    });

    try {
      const params: any = {
        count: context.propsValue.count || 10,
      };

      if (context.propsValue.status) {
        params.status = context.propsValue.status;
      }
      if (context.propsValue.type) {
        params.type = context.propsValue.type;
      }
      if (context.propsValue.fields) {
        params.fields = context.propsValue.fields.split(',').map(f => f.trim());
      }
      if (context.propsValue.exclude_fields) {
        params.exclude_fields = context.propsValue.exclude_fields.split(',').map(f => f.trim());
      }

      // Fetch campaigns
      const response = await client.campaigns.list(params);
      let campaigns = response.campaigns || [];

      // Filter locally if query is provided
      if (context.propsValue.query) {
        const searchTerm = context.propsValue.query.toLowerCase();
        campaigns = campaigns.filter((campaign: any) =>
          (campaign.settings?.subject_line?.toLowerCase().includes(searchTerm)) ||
          (campaign.settings?.title?.toLowerCase().includes(searchTerm))
        );
      }

      return {
        success: true,
        query: context.propsValue.query,
        campaigns,
        total_items: campaigns.length,
      };
    } catch (error: any) {
      throw new Error(`Failed to find campaigns: ${error.message || JSON.stringify(error)}`);
    }
  },
});
