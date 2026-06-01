import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { mailerooAuth } from '../auth';

export const verifyEmail = createAction({
  auth: mailerooAuth,
  name: 'verifyEmail',
  displayName: 'Verify Email',
  description: 'Verifies an email address.',
  props: {
    content: Property.ShortText({
      displayName: 'Email',
      description: 'Email to verify',
      required: true,
    }),
  },
  async run(context) {
    const result = await httpClient.sendRequest({
      url: 'https://verify.maileroo.net/check',
      method: HttpMethod.POST,
      body: {
        email_address: context.propsValue.content,
      },
      headers: {
        'X-API-Key': context.auth.props.apiKey,
        'Content-Type': 'application/json',
      },
    });

    return result.body;
  },
});
