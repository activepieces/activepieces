import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { fountainAuth } from '../../';
import { getAuthHeaders, getApiUrl } from '../common/auth';
import { getFunnelsDropdown, getLocationsDropdown, getStagesForFunnelDropdown } from '../common/dropdowns';

export const fountainListApplicants = createAction({
  name: 'list_applicants',
  auth: fountainAuth,
  displayName: 'List All Applicant Details',
  description: 'List applicants with optional filters',
  props: {
    funnel_id: Property.Dropdown({
      displayName: 'Opening',
      description: 'Filter applicants by opening',
      required: false,
      refreshers: [],
      auth: fountainAuth,
      options: async ({ auth }) => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Connect account first' };
        return { disabled: false, options: await getFunnelsDropdown(auth) };
      },
    }),
    location_id: Property.Dropdown({
      displayName: 'Location',
      description: 'Filter applicants by location',
      required: false,
      refreshers: [],
      auth: fountainAuth,
      options: async ({ auth }) => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Connect account first' };
        return { disabled: false, options: await getLocationsDropdown(auth) };
      },
    }),
    stage_id: Property.Dropdown({
      displayName: 'Stage',
      description: 'Filter applicants by stage',
      required: false,
      refreshers: ['funnel_id'],
      auth: fountainAuth,
      options: async ({ auth, funnel_id }) => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Connect account first' };
        if (!funnel_id) return { disabled: true, options: [], placeholder: 'Select opening first' };
          return { disabled: false, options: await getStagesForFunnelDropdown(auth, funnel_id as string) };
      },
    }),
    stage: Property.ShortText({
      displayName: 'Stage',
      description: 'Filter applicants by stage name',
      required: false,
    }),
    labels: Property.ShortText({
      displayName: 'Labels',
      description: 'Filter applicants by labels',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Filter applicants by phone number',
      required: false,
    }),
    exclude_temporary: Property.Checkbox({
      displayName: 'Exclude Temporary',
      description: 'Whether to exclude temporary/test applicants',
      required: false,
      defaultValue: false,
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
    include_subaccounts: Property.Checkbox({
      displayName: 'Include Sub-accounts',
      description: 'Whether to include applicants from sub-accounts',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const queryParams: Record<string, any> = {};

    if (context.propsValue['funnel_id']) queryParams['funnel_id'] = context.propsValue['funnel_id'];
    if (context.propsValue['location_id']) queryParams['location_id'] = context.propsValue['location_id'];
    if (context.propsValue['stage_id']) queryParams['stage_id'] = context.propsValue['stage_id'];
    if (context.propsValue['stage']) queryParams['stage'] = context.propsValue['stage'];
    if (context.propsValue['labels']) queryParams['labels'] = context.propsValue['labels'];
    if (context.propsValue['phone']) queryParams['phone'] = context.propsValue['phone'];
    if (context.propsValue['exclude_temporary'] !== undefined) queryParams['exclude_temporary'] = context.propsValue['exclude_temporary'];
    if (context.propsValue['per_page']) queryParams['per_page'] = context.propsValue['per_page'];
    if (context.propsValue['cursor']) queryParams['cursor'] = context.propsValue['cursor'];
    if (context.propsValue['include_subaccounts'] !== undefined) queryParams['include_subaccounts'] = context.propsValue['include_subaccounts'];

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: getApiUrl(context.auth, '/applicants'),
      headers: getAuthHeaders(context.auth),
      queryParams,
    });

    return response.body;
  },
});
