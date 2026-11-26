import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { emailitAuth } from '../auth';
import { emailitClient } from '../common/client';
import { emailitSchemas } from '../common/output-schemas';
import { emailitValues } from '../common/values';

export const verifyEmailAddressAction = createAction({
  auth: emailitAuth,
  name: 'verify_email_address',
  displayName: 'Verify Email Address',
  description: 'Check whether an address is valid and safe to send to. Costs 5 credits per check.',
  audience: 'both',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Checks one email address with Emailit and returns result (safe, invalid, disposable, disabled, inbox_full, role, unknown), risk, a 0-100 score, individual checks and a did_you_mean typo suggestion. Fast mode checks syntax, domain and MX; full mode also asks the mailbox server. Each call is charged 5 credits, even for invalid input. Needs a Full Access key.',
    idempotent: false,
  },
  outputSchema: emailitSchemas.verification,
  propertyGroups: [{ key: 'check', display: 'section', label: 'Address', icon: 'inbox', props: ['email', 'mode'] }],
  props: {
    email: Property.ShortText({ displayName: 'Email', placeholder: 'ada@example.com', required: true }),
    mode: Property.StaticDropdown<'fast' | 'full'>({
      displayName: 'Check Type',
      description: 'Full also checks that the mailbox exists.',
      required: false,
      defaultValue: 'fast',
      options: { disabled: false, options: [{ label: 'Fast', value: 'fast' }, { label: 'Full', value: 'full' }] },
    }),
  },
  async run({ auth, propsValue }) {
    const body = await emailitClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/email-verifications',
      body: { email: emailitValues.requiredText({ value: propsValue.email, label: 'Email' }), mode: propsValue.mode ?? 'fast' },
      redactBody: true,
    });
    if (emailitClient.isRecord(body) && emailitClient.isRecord(body['data'])) return body['data'];
    return body;
  },
});
