import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { prooftellAuth } from '../auth';
import { prooftellApi } from '../common';

export const verifyEmailAddress = createAction({
  auth: prooftellAuth,
  name: 'verify_email_address',
  classification: 'READ',
  displayName: 'Verify an email address',
  description:
    'Whether the address is deliverable, with the reason, the flags (disposable, role, free provider, catch-all) and a suggestion for a typo. Charged per check from your balance; the sandbox is free.',
  audience: 'both',
  aiMetadata: {
    description:
      'Verify one email address with ProofTell: deliverable, undeliverable, risky or unknown, with the reason, the flags and a did-you-mean suggestion. To read an email with a phone or an IP as one risk score, use Assess the risk of an identity instead. Charged when the address was judged (deliverable, undeliverable or risky); unknown, a syntax error and a greylisted mailbox are free; a retry is charged again.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Email address',
      description: 'The address to verify, such as jane@example.com.',
      required: true,
    }),
    timeout: Property.Number({
      displayName: 'Timeout',
      description: 'Milliseconds allowed for the mailbox check, at most 45000. Past it the address comes back unknown, free.',
      required: false,
      min: 1000,
      max: 45000,
    }),
  },
  async run(context) {
    const { email, timeout } = context.propsValue;
    return prooftellApi.request({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/v1/email',
      body: { email, timeout },
    });
  },
});
