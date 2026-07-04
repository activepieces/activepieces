import { createAction, Property } from '@activepieces/pieces-framework';
import { mailercheckAuth } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
export const verifyAnEmailAddress = createAction({
  auth: mailercheckAuth,
  name: 'verifyAnEmailAddress',
  displayName: 'Verify an Email Address',
  description: 'Verify a single email address in real-time',
  audience: 'both',
  aiMetadata: { description: 'Validates one email address in real time against MailerCheck and reports its deliverability status (e.g. valid, invalid, risky). Use to check a single address before sending or storing it; pass exactly one email. Read-only lookup that does not change anything, so repeating it for the same address is safe.', idempotent: true },
  props: {
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address to verify',
      required: true,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://app.mailercheck.com/api/check/single',
      body: {
        email: context.propsValue.email,
      },
      headers: {
        Authorization: `Bearer ${context.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
    });

    return response.body;
  },
});
