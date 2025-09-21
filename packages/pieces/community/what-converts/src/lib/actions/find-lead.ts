import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  QueryParams,
} from '@activepieces/pieces-common';
import { whatConvertsAuth } from '../common/auth';

const WHATCONVERTS_API_URL = 'https://app.whatconverts.com/api/v1';

export const findLeadAction = createAction({
  auth: whatConvertsAuth,
  name: 'find_lead',
  displayName: 'Find Lead',
  description: 'Find a lead by various criteria.',
  props: {
    email_address: Property.ShortText({
      displayName: 'Email Address',
      description: 'Find a lead by their email address.',
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Find a lead by their E.164 formatted phone number.',
      required: false,
    }),
    lead_type: Property.StaticDropdown({
      displayName: 'Lead Type',
      description: 'Filter leads by their type.',
      required: false,
      options: {
        options: [
          { label: 'Appointment', value: 'appointment' },
          { label: 'Chat', value: 'chat' },
          { label: 'Email', value: 'email' },
          { label: 'Event', value: 'event' },
          { label: 'Other', value: 'other' },
          { label: 'Phone Call', value: 'phone_call' },
          { label: 'Text Message', value: 'text_message' },
          { label: 'Transaction', value: 'transaction' },
          { label: 'Web Form', value: 'web_form' },
        ],
      },
    }),
    lead_source: Property.ShortText({
      displayName: 'Lead Source',
      description: 'Filter by the lead\'s traffic source (e.g., "google").',
      required: false,
    }),
    lead_medium: Property.ShortText({
      displayName: 'Lead Medium',
      description: 'Filter by the lead\'s traffic medium (e.g., "cpc").',
      required: false,
    }),
    profile_id: Property.Number({
      displayName: 'Profile ID',
      description:
        'Required if using an Agency-level API key to specify which profile to search in.',
      required: false,
    }),
    per_page: Property.Number({
      displayName: 'Leads Per Page',
      description: 'The number of leads to return (default 25, max 2500).',
      required: false,
    }),
  },

  async run(context) {
    const { auth, propsValue } = context;

    const searchCriteria = [
      propsValue.email_address,
      propsValue.phone_number,
      propsValue.lead_type,
      propsValue.lead_source,
      propsValue.lead_medium,
    ];
    if (searchCriteria.every((criterion) => !criterion)) {
      throw new Error(
        'Please provide at least one search criteria (Email, Phone, Type, Source, or Medium).'
      );
    }

    const queryParams: QueryParams = {};
    Object.keys(propsValue).forEach((key) => {
      const value = propsValue[key as keyof typeof propsValue];
      if (value !== undefined && value !== null && value !== '') {
        queryParams[key] = value.toString();
      }
    });

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${WHATCONVERTS_API_URL}/leads`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: auth.api_token,
        password: auth.api_secret as string,
      },
      queryParams: queryParams,
    });

    return response.body;
  },
});
