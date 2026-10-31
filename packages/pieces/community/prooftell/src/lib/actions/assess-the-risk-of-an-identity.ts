import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { prooftellAuth } from '../auth';
import { prooftellApi } from '../common';

export const assessIdentityRisk = createAction({
  auth: prooftellAuth,
  name: 'assess_identity_risk',
  classification: 'READ',
  displayName: 'Assess the risk of an identity',
  description:
    'A phone number, an email address and an IP address read together: a 0–100 score, a verdict (allow, review or deny) and its reasons, with each signal\'s result. Charged per signal from your balance; the sandbox is free.',
  audience: 'both',
  aiMetadata: {
    description:
      'Assess an identity with ProofTell from any mix of a phone number, an email address and an IP address: a 0–100 risk score, a verdict of allow, review or deny, the reasons with their points, and each signal\'s own result. Use it over the single lookups when more than one of the three is known. Give at least one of the three. Each signal that answers is charged from the balance; a retry is charged again.',
    idempotent: true,
  },
  props: {
    phone: Property.ShortText({
      displayName: 'Phone number',
      description: 'E.164 preferred, such as +447700900123. A number in national format needs its country.',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email address',
      description: 'Such as jane@example.com. Text that is not an address is scored, not refused.',
      required: false,
    }),
    ip: Property.ShortText({
      displayName: 'IP address',
      description: 'IPv4 or IPv6 of the end user, such as 203.0.113.1.',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'ISO 3166-1 alpha-2 code, such as GB, for a phone number in national format.',
      required: false,
    }),
    reference: Property.ShortText({
      displayName: 'Reference',
      description: 'Your own id for this check, echoed back in the answer.',
      required: false,
    }),
  },
  async run(context) {
    const { phone, email, ip, country, reference } = context.propsValue;
    if (!hasText(phone) && !hasText(email) && !hasText(ip)) {
      throw new Error('Give at least one of a phone number, an email address and an IP address.');
    }
    return prooftellApi.request({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/v1/assess',
      body: { phone, email, ip, country, reference },
    });
  },
});

function hasText(value: string | undefined): boolean {
  return value !== undefined && value.trim() !== '';
}
