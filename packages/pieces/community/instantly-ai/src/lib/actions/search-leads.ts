import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { instantlyAiAuth } from '../../index';

export const searchLeadsAction = createAction({
  auth: instantlyAiAuth,
  name: 'search_leads',
  displayName: 'Search Leads',
  description: 'Search for leads in Instantly by name or email',
  props: {
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Search string to find leads - can be First Name, Last Name, or Email (e.g. "John Doe")',
      required: false,
    }),
    filter: Property.ShortText({
      displayName: 'Filter',
      description: 'Filter criteria for leads. For custom lead labels, use the interest_status field',
      required: false,
    }),
    campaign: Property.ShortText({
      displayName: 'Campaign ID',
      description: 'Campaign ID to filter leads',
      required: false,
    }),
    list_id: Property.ShortText({
      displayName: 'List ID',
      description: 'List ID to filter leads',
      required: false,
    }),
    in_campaign: Property.Checkbox({
      displayName: 'In Campaign',
      description: 'Whether the lead is in a campaign',
      required: false,
    }),
    in_list: Property.Checkbox({
      displayName: 'In List',
      description: 'Whether the lead is in a list',
      required: false,
    }),
    ids: Property.Array({
      displayName: 'Lead IDs',
      description: 'Array of lead IDs to include',
      required: false,
    }),
    queries: Property.Array({
      displayName: 'Queries',
      description: 'Array of objects with actionType and values parameters',
      required: false,
    }),
    excluded_ids: Property.Array({
      displayName: 'Excluded IDs',
      description: 'Array of lead IDs to exclude',
      required: false,
    }),
    contacts: Property.Array({
      displayName: 'Contacts',
      description: 'Array of emails the leads needs to have',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of leads to return (1-100)',
      required: false,
      defaultValue: 20,
    }),
    starting_after: Property.ShortText({
      displayName: 'Starting After',
      description: 'The ID of the last item in the previous page - used for pagination',
      required: false,
    }),
    organization_user_ids: Property.Array({
      displayName: 'Organization User IDs',
      description: 'Array of organization user IDs to filter leads',
      required: false,
    }),
    smart_view_id: Property.ShortText({
      displayName: 'Smart View ID',
      description: 'Smart view ID to filter leads',
      required: false,
    }),
    is_website_visitor: Property.Checkbox({
      displayName: 'Is Website Visitor',
      description: 'Whether the lead is a website visitor',
      required: false,
    }),
    distinct_contacts: Property.Checkbox({
      displayName: 'Distinct Contacts',
      description: 'Whether to return distinct contacts',
      required: false,
    }),
    enrichment_status: Property.Number({
      displayName: 'Enrichment Status',
      description: 'Enrichment status to filter leads (1: successfully enriched, 11: pending, -1: not available, -2: error)',
      required: false,
    }),
  },
  async run(context) {
    const {
      search,
      filter,
      campaign,
      list_id,
      in_campaign,
      in_list,
      ids,
      queries,
      excluded_ids,
      contacts,
      limit,
      starting_after,
      organization_user_ids,
      smart_view_id,
      is_website_visitor,
      distinct_contacts,
      enrichment_status,
    } = context.propsValue;
    const { auth: apiKey } = context;

    const requestBody: Record<string, any> = {};

    if (search !== undefined) requestBody['search'] = search;
    if (filter !== undefined) requestBody['filter'] = filter;
    if (campaign !== undefined) requestBody['campaign'] = campaign;
    if (list_id !== undefined) requestBody['list_id'] = list_id;
    if (in_campaign !== undefined) requestBody['in_campaign'] = in_campaign;
    if (in_list !== undefined) requestBody['in_list'] = in_list;
    if (ids !== undefined) requestBody['ids'] = ids;
    if (queries !== undefined) requestBody['queries'] = queries;
    if (excluded_ids !== undefined) requestBody['excluded_ids'] = excluded_ids;
    if (contacts !== undefined) requestBody['contacts'] = contacts;
    if (limit !== undefined) requestBody['limit'] = Math.min(100, Math.max(1, limit));
    if (starting_after !== undefined) requestBody['starting_after'] = starting_after;
    if (organization_user_ids !== undefined) requestBody['organization_user_ids'] = organization_user_ids;
    if (smart_view_id !== undefined) requestBody['smart_view_id'] = smart_view_id;
    if (is_website_visitor !== undefined) requestBody['is_website_visitor'] = is_website_visitor;
    if (distinct_contacts !== undefined) requestBody['distinct_contacts'] = distinct_contacts;
    if (enrichment_status !== undefined) requestBody['enrichment_status'] = enrichment_status;

    return await makeRequest({
      endpoint: 'leads/list',
      method: HttpMethod.POST,
      apiKey: apiKey as string,
      body: requestBody,
    });
  },
});
