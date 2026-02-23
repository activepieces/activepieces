import { createAction, Property } from '@activepieces/pieces-framework';
import { isEmpty, isNil } from '@activepieces/shared';
import { pipedriveApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { pipedriveAuth } from '../../index';

export const searchLeads = createAction({
  auth: pipedriveAuth,
  name: 'searchLeads',
  displayName: 'Search Leads',
  description: 'Search Leads',
  props: {
    term: Property.ShortText({
      displayName: 'Search Term',
      description: 'The search term to look for. Minimum 2 characters (or 1 if using exact_match). Please note that the search term has to be URL encoded.',
      required: true,
    }),
    fields: Property.StaticMultiSelectDropdown({
      displayName: 'Fields',
      description: 'A comma-separated string array. The fields to perform the search from. Defaults to all of them.',
      required: false,
      options: {
        options: [
          { label: 'custom_fields', value: 'custom_fields' },
          { label: 'notes', value: 'notes' },
          { label: 'title', value: 'title' },
        ],
      }
    }),
    exact_match: Property.Checkbox({
      displayName: 'Exact Match',
      description: 'When enabled, only full exact matches against the given term are returned. It is not case sensitive.',
      required: false,
    }),
    person_id: Property.Number({
      displayName: 'Person ID',
      description: 'Will filter leads by the provided person ID. The upper limit of found leads associated with the person is 2000.',
      required: false,
    }),
    organization_id: Property.Number({
      displayName: 'Organization ID',
      description: 'Will filter leads by the provided organization ID. The upper limit of found leads associated with the organization is 2000.',
      required: false,
    }),
    include_fields: Property.StaticDropdown({
      displayName: 'Include Fields',
      description: 'Supports including optional fields in the results which are not provided by default',
      required: false,
      options: {
        options: [
          { label: 'lead.was_seen', value: 'lead.was_seen' },
        ],
      }
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'For pagination, the limit of entries to be returned. If not provided, 100 items will be returned. Please note that a maximum value of 500 is allowed.',
      required: false,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'For pagination, the marker (an opaque string value) representing the first item on the next page.',
      required: false,
    }),
  },
  async run(context) {
    // Action logic here
    const { propsValue, auth } = context
    const queryParams: Record<string, any> = {}

    for (const key in propsValue) {
      const value = propsValue[key as keyof typeof propsValue];
      if (key !== 'auth' && !isNil(value) && !isEmpty(value)) {
        queryParams[key] = value;
      }
    }
    console.log('Query Params:', queryParams);
    const searchResponse = await pipedriveApiCall<{
      success: boolean;
      data: { items: Array<{ item: { id: number; name: string; } }> };
    }>({
      accessToken: auth.access_token,
      apiDomain: auth.data['api_domain'],
      method: HttpMethod.GET,
      resourceUri: '/v2/leads/search',
      query: queryParams,
    });
    if (isNil(searchResponse) || searchResponse.data.items.length === 0) {
      return {
        found: false,
        data: [],
      };
    }

    return {
      found: searchResponse.data.items.length > 0,
      data: searchResponse,
    };
  },
});