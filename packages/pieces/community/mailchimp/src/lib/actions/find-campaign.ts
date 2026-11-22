import { mailchimpOutputSchemas } from '../common/output-schemas';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mailchimpApi } from '../common/client';
import { mailchimpAuth } from '../..';

export const findCampaign = createAction({
  auth: mailchimpAuth,
  name: 'find_campaign',
  classification: 'SEARCH',
  displayName: 'Find Campaign',
  description: 'Search sent campaigns for the specified query terms. Mailchimp search does not include drafts or scheduled campaigns; use List Campaigns for those.',
  audience: 'both',
  aiMetadata: { description: 'Searches sent campaigns only (Mailchimp search skips drafts and scheduled campaigns; use List Campaigns for those) by a free-text query (matching titles, subject lines, and related fields) and returns the matches. Use to locate a campaign by name or wording before reading or acting on it. Read-only and idempotent; a query is required.', idempotent: true },
  outputSchema: mailchimpOutputSchemas['findCampaign'],
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
    const query = mailchimpApi.requireText({ value: context.propsValue.query, label: 'Search Query' });
    const fields = mailchimpApi.toStringList(context.propsValue.fields);
    const excludeFields = mailchimpApi.toStringList(context.propsValue.exclude_fields);
    const client = mailchimpApi.createClient({ accessToken: context.auth.access_token });
    const searchResult = await client.request<SearchCampaignsResponse>({
      method: HttpMethod.GET,
      path: '/search-campaigns',
      queryParams: {
        query,
        fields: fields.length > 0 ? fields.join(',') : undefined,
        exclude_fields: excludeFields.length > 0 ? excludeFields.join(',') : undefined,
      },
      operation: 'search campaigns',
    });
    return {
      success: true,
      query: context.propsValue.query,
      results: searchResult.results ?? [],
      total_items: searchResult.total_items ?? 0,
      _links: searchResult._links ?? [],
    };
  },
});

type SearchCampaignsResponse = {
  results?: unknown[];
  total_items?: number;
  _links?: unknown[];
};
