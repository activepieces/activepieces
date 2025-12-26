import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { narmiAuth } from '../..';

export const getCsrfToken = createAction({
  name: 'get_csrf_token',
  auth: narmiAuth,
  displayName: 'Get CSRF Token',
  description: 'Get a CSRF token for making authenticated requests',
  props: {
    hasApplicantToken: Property.Checkbox({
      displayName: 'Has Applicant Token',
      description: 'Set to true if you have an applicant_token cookie to get an authenticated CSRF token',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const auth = context.auth as any;
    const baseUrl = auth.baseUrl;
    const { hasApplicantToken } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${baseUrl}/v1/csrf/`,
      headers: {
        'accept': 'application/json',
      },
    });

    return {
      success: true,
      csrfToken: response.headers?.['x-csrftoken'] || '',
      body: response.body,
    };
  },
});
