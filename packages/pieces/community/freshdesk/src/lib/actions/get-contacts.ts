import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { freshdeskAuth } from '../..';

export const getContacts = createAction({
  auth: freshdeskAuth,
  name: 'get_contacts',
  displayName: 'Get Freshdesk Contacts',
  description:
    'Get contact details from Freshdesk for all (optional filtered) contacts.',

  props: {
    filter_type: Property.StaticDropdown({
      displayName: 'Optional Filter',
      description: 'Select one and provide the value.',
      defaultValue: '',
      required: false,
      options: {
        options: [
          {
            label: 'E-mail',
            value: 'email',
          },
          {
            label: 'Mobile',
            value: 'mobile',
          },
          {
            label: 'Phone',
            value: 'phone',
          },
          {
            label: 'Company ID',
            value: 'company_id',
          },
          {
            label: 'Updated Since',
            value: 'updated_since',
          },
        ],
      },
    }),
    filter_value: Property.ShortText({
      displayName: 'Filter value',
      description: 'Provide value if previous option selected!',
      required: false,
      defaultValue: '',
    }),
    filter_status: Property.StaticDropdown({
      displayName: 'Optional Filter Status',
      description:
        'Can filter by state: blocked, deleted, unverified or verified.',
      defaultValue: '',
      required: false,
      options: {
        options: [
          {
            label: 'Blocked',
            value: 'blocked',
          },
          {
            label: 'Deleted',
            value: 'deleted',
          },
          {
            label: 'Unverified',
            value: 'unverified',
          },
          {
            label: 'Verified',
            value: 'verified',
          },
        ],
      },
    }),
    per_page: Property.Number({
      displayName: 'Results to return',
      description:
        'Freshdesk calls this per_page - set to 0 for all, if specified maximum is 100',
      required: true,
      defaultValue: 0,
    }),
  },

  async run(context) {
    const FDapiToken = context.auth.access_token;

    const headers = {
      Authorization: FDapiToken,
      'Content-Type': 'application/json',
    };

    // not needed for gettickets ?${queryParams.toString()}
    const queryParams = new URLSearchParams();
    if (
      context.propsValue.filter_type?.valueOf != null &&
      context.propsValue.filter_value?.valueOf != null
    ) {
      queryParams.append(
        context.propsValue.filter_type?.toString(),
        context.propsValue.filter_value || ''
      );
    }
    if (context.propsValue.filter_status?.valueOf != null) {
      queryParams.append('state', context.propsValue.filter_status || '');
    }
    if (context.propsValue.per_page != 0) {
      queryParams.append(
        'per_page',
        context.propsValue.per_page.toString() || '100'
      );
    }
    // Remove trailing slash from base_url
    const baseUrl = context.auth.base_url.replace(/\/$/, '');
    const url = `${baseUrl}/api/v2/contacts/?${queryParams.toString()}`;
    const httprequestdata = {
      method: HttpMethod.GET,
      url,
      headers,
    };
    const response = await httpClient.sendRequest(httprequestdata);

    if (response.status == 200) {
      return response.body;
    } else {
      return response;
    }
  },
});
