import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { fountainAuth } from '../../';
import { getAuthHeaders, getApiUrl } from '../common/auth';
import { getLocationsDropdown, getUsersDropdown } from '../common/dropdowns';

export const fountainListOpenings = createAction({
  name: 'list_openings',
  auth: fountainAuth,
  displayName: 'List All Opening Details',
  description: 'List job openings with optional filters',
  props: {
    active: Property.Checkbox({
      displayName: 'Active Only',
      description: 'Filter to only active openings',
      required: false,
    }),
    location_id: Property.Dropdown({  
      displayName: 'Location',
      description: 'Filter openings by location',
      required: false,
      refreshers: [],
      auth: fountainAuth,
      options: async ({ auth }) => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Connect account first' };
        return { disabled: false, options: await getLocationsDropdown(auth) };
      },
    }),
    is_hiring_funnel: Property.Checkbox({
      displayName: 'Hiring Funnels Only',
      description: 'Filter to only hiring funnels',
      required: false,
    }),
    is_sourcing_funnel: Property.Checkbox({
      displayName: 'Sourcing Funnels Only',
      description: 'Filter to only sourcing funnels',
      required: false,
    }),
    is_private: Property.Checkbox({
      displayName: 'Private Only',
      description: 'Filter to only private openings',
      required: false,
    }),
    owner_id: Property.Dropdown({
      displayName: 'Owner',
      description: 'Filter openings by owner',
      required: false,
      refreshers: [],
      auth: fountainAuth,
        options: async ({ auth }) => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Connect account first' };
        return { disabled: false, options: await getUsersDropdown(auth) };
      },
    }),
    per_page: Property.Number({
      displayName: 'Results Per Page',
      description: 'Number of results per page (default: 25)',
      required: false,
      defaultValue: 25,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'Cursor for pagination',
      required: false,
    }),
  },
  async run(context) {
    const queryParams: Record<string, any> = {};

    if (context.propsValue['active'] !== undefined) queryParams['active'] = context.propsValue['active'];
    if (context.propsValue['location_id']) queryParams['location_id'] = context.propsValue['location_id'];
    if (context.propsValue['is_hiring_funnel'] !== undefined) queryParams['is_hiring_funnel'] = context.propsValue['is_hiring_funnel'];
    if (context.propsValue['is_sourcing_funnel'] !== undefined) queryParams['is_sourcing_funnel'] = context.propsValue['is_sourcing_funnel'];
    if (context.propsValue['is_private'] !== undefined) queryParams['is_private'] = context.propsValue['is_private'];
    if (context.propsValue['owner_id']) queryParams['owner_id'] = context.propsValue['owner_id'];
    if (context.propsValue['per_page']) queryParams['per_page'] = context.propsValue['per_page'];
    if (context.propsValue['cursor']) queryParams['cursor'] = context.propsValue['cursor'];

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: getApiUrl(context.auth, '/funnels'),
      headers: getAuthHeaders(context.auth),
      queryParams,
    });

    return response.body;
  },
});
