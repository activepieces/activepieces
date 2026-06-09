import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { mailerooAuth } from '../auth';

export const verifyEmail = createAction({
  auth: mailerooAuth,
  name: 'verifyEmail',
  displayName: 'Verify Email',
  description: 'Verifies an email address.',
  audience: 'both',
  aiMetadata: {
    description: 'Checks the validity and deliverability of a single email address via Maileroo verification service. Use it to validate an address before sending or to clean a contact list. Takes one email string as input; it is a read-only lookup that sends no mail, so repeating the call with the same address is safe and idempotent.',
    idempotent: true,
  },
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
