import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { instantlyAiAuth } from '../../index';

export const addLeadToCampaignAction = createAction({
  auth: instantlyAiAuth,
  name: 'move_leads_to_campaign',
  displayName: 'Move Leads to Campaign',
  description: 'Move leads to a different campaign or list in Instantly',
  props: {
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Search string to find leads - can be First Name, Last Name, or Email',
      required: false,
    }),
    filter: Property.Dropdown({
      displayName: 'Filter',
      description: 'Filter criteria for leads',
      required: false,
      refreshers: [],
      options: async () => {
        return {
          options: [
            { label: 'Contacted', value: 'FILTER_VAL_CONTACTED' },
            { label: 'Not Contacted', value: 'FILTER_VAL_NOT_CONTACTED' },
            { label: 'Completed', value: 'FILTER_VAL_COMPLETED' },
            { label: 'Unsubscribed', value: 'FILTER_VAL_UNSUBSCRIBED' },
            { label: 'Active', value: 'FILTER_VAL_ACTIVE' },
            { label: 'Interested', value: 'FILTER_LEAD_INTERESTED' },
            { label: 'Not Interested', value: 'FILTER_LEAD_NOT_INTERESTED' },
            { label: 'Meeting Booked', value: 'FILTER_LEAD_MEETING_BOOKED' },
            { label: 'Meeting Completed', value: 'FILTER_LEAD_MEETING_COMPLETED' },
            { label: 'Closed', value: 'FILTER_LEAD_CLOSED' },
          ],
        };
      },
    }),
    campaign: Property.ShortText({
      displayName: 'Campaign ID',
      description: 'Campaign ID to filter leads (UUID)',
      required: false,
    }),
    list_id: Property.ShortText({
      displayName: 'List ID',
      description: 'List ID to filter leads (UUID)',
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
      description: 'Array of lead IDs to include (UUIDs)',
      required: false,
    }),
    queries: Property.Object({
      displayName: 'Queries',
      description: 'Array of query objects for advanced filtering',
      required: false,
    }),
    excluded_ids: Property.Array({
      displayName: 'Excluded Lead IDs',
      description: 'Array of lead IDs to exclude (UUIDs)',
      required: false,
    }),
    contacts: Property.Array({
      displayName: 'Contacts',
      description: 'Array of email addresses the leads need to have',
      required: false,
    }),
    to_campaign_id: Property.ShortText({
      displayName: 'To Campaign ID',
      description: 'The campaign ID to move leads to (UUID)',
      required: false,
    }),
    to_list_id: Property.ShortText({
      displayName: 'To List ID',
      description: 'The list ID to move leads to (UUID)',
      required: false,
    }),
    check_duplicates_in_campaigns: Property.Checkbox({
      displayName: 'Check Duplicates in Campaigns',
      description: 'Whether to check for duplicates in campaigns',
      required: false,
      defaultValue: false,
    }),
    skip_leads_in_verification: Property.Checkbox({
      displayName: 'Skip Leads in Verification',
      description: 'Whether to skip leads in verification',
      required: false,
      defaultValue: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of leads to move',
      required: false,
    }),
    assigned_to: Property.ShortText({
      displayName: 'Assigned To',
      description: 'User ID to assign leads to (UUID)',
      required: false,
    }),
    esp_code: Property.Number({
      displayName: 'ESP Code',
      description: 'ESP code for the leads',
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
      to_campaign_id,
      to_list_id,
      check_duplicates_in_campaigns,
      skip_leads_in_verification,
      limit,
      assigned_to,
      esp_code,
    } = context.propsValue;
    const { auth: apiKey } = context;

    if (!to_campaign_id && !to_list_id) {
      throw new Error('Either To Campaign ID or To List ID must be provided');
    }

    const payload: Record<string, unknown> = {};

    if (search) payload['search'] = search;
    if (filter) payload['filter'] = filter;
    if (campaign) payload['campaign'] = campaign;
    if (list_id) payload['list_id'] = list_id;
    if (in_campaign !== undefined) payload['in_campaign'] = in_campaign;
    if (in_list !== undefined) payload['in_list'] = in_list;
    if (ids && ids.length > 0) payload['ids'] = ids;
    if (queries) payload['queries'] = queries;
    if (excluded_ids && excluded_ids.length > 0) payload['excluded_ids'] = excluded_ids;
    if (contacts && contacts.length > 0) payload['contacts'] = contacts;
    if (to_campaign_id) payload['to_campaign_id'] = to_campaign_id;
    if (to_list_id) payload['to_list_id'] = to_list_id;
    if (check_duplicates_in_campaigns !== undefined) payload['check_duplicates_in_campaigns'] = check_duplicates_in_campaigns;
    if (skip_leads_in_verification !== undefined) payload['skip_leads_in_verification'] = skip_leads_in_verification;
    if (limit) payload['limit'] = limit;
    if (assigned_to) payload['assigned_to'] = assigned_to;
    if (esp_code !== undefined) payload['esp_code'] = esp_code;

    return await makeRequest({
      endpoint: 'leads/move',
      method: HttpMethod.POST,
      apiKey: apiKey as string,
      body: payload,
    });
  },
});
