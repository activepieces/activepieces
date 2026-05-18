import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { neverbounceAuth } from '../common/auth';

export const verifyEmailAddress = createAction({
  auth: neverbounceAuth,
  name: 'verifyEmailAddress',
  displayName: 'Verify Email Address',
  description: 'Verify a single email address using NeverBounce API',
  props: {
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address to verify',
      required: true,
    }),
  },
  async run(context) {
    const queryParams: any = {
      key: context.auth.secret_text,
      email: context.propsValue.email,
    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.neverbounce.com/v4.2/single/check',
      queryParams,
    });

    return response.body;
  },
});