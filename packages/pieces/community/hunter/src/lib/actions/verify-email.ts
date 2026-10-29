import { createAction, Property } from '@activepieces/pieces-framework';
import { hunterAuth } from '../auth';
import { apiKeyOf, requireText } from '../common/client';
import { hunterOutputSchemas } from '../common/output-schemas';
import { hunterRequests } from '../common/requests';

export const verifyEmailAction = createAction({
  auth: hunterAuth,
  name: 'verify-email',
  classification: 'READ',
  displayName: 'Verify Email',
  description: 'Check email deliverability. Uses 0.5 credit per new email verified.',
  audience: 'both',
  aiMetadata: {
    description:
      'Verifies one email address: status (valid, invalid, accept_all, webmail, disposable, unknown), score and checks (format, MX, SMTP, disposable, webmail, accept-all). Waits up to 60 seconds while Hunter is still checking, then fails asking to retry. Costs 0.5 Hunter credit (unknown results and repeats of the same email in a billing month are free).',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({ displayName: 'Email', required: true, description: 'The email address to verify.' }),
  },
  outputSchema: hunterOutputSchemas.emailVerifier,
  async run(context) {
    const data = await hunterRequests.verifyEmail({ apiKey: apiKeyOf(context.auth), email: requireText({ value: context.propsValue.email, label: 'Email' }) });
    return {
      status: data['status'],
      result: data['result'],
      score: data['score'],
      email: data['email'],
      regexp: data['regexp'],
      gibberish: data['gibberish'],
      disposable: data['disposable'],
      webmail: data['webmail'],
      mx_records: data['mx_records'],
      smtp_server: data['smtp_server'],
      smtp_check: data['smtp_check'],
      accept_all: data['accept_all'],
      block: data['block'],
      sources: data['sources'],
    };
  },
});
