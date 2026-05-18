import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { MailchimpClient, CampaignGetOptions } from '../common/types';

export const findCampaign = createAction({
  auth: mailchimpAuth,
  name: 'find_campaign',
  displayName: 'Find Campaign',
  description: 'Search all campaigns for the specified query terms',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Search terms to find campaigns',
      required: true,
    }),
    fields: Property.LongText({
      displayName: 'Fields',
      description: 'Comma-separated list of fields to return',
      required: false,
    }),
    exclude_fields: Property.LongText({
      displayName: 'Exclude Fields',
      description: 'Comma-separated list of fields to exclude',
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
      const searchParams: any = {
        query: context.propsValue.query,
      };

      if (context.propsValue.fields) {
        searchParams.fields = context.propsValue.fields.split(',').map(f => f.trim());
      }

      if (context.propsValue.exclude_fields) {
        searchParams.exclude_fields = context.propsValue.exclude_fields.split(',').map(f => f.trim());
      }

      const searchResult = await client.searchCampaigns.search(searchParams);

      return {
        success: true,
        query: context.propsValue.query,
        results: searchResult.results,
        total_items: searchResult.total_items,
        _links: searchResult._links,
      };
    } catch (error: any) {
      throw new Error(`Failed to search campaigns: ${error.message || JSON.stringify(error)}`);
    }
  },
});
