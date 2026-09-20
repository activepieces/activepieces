import { createAction, Property } from '@activepieces/pieces-framework';
import { neuralvergeAuth } from '../auth';
import { neuralvergeClient } from '../common/client';

export const verifyEmailAction = createAction({
  auth: neuralvergeAuth,
  name: 'verify_email',
  classification: 'READ',
  displayName: 'Verify Email',
  description: 'Check whether an email address is deliverable (valid, risky or invalid). Cost: 1 point (1 point = $0.001).',
  audience: 'both',
  aiMetadata: {
    description: 'Check email deliverability: valid, risky or invalid, plus catch-all flag, mail provider and confidence. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address to verify, for example jane.doe@example.com.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return neuralvergeClient.post({
      apiKey: auth.secret_text,
      endpoint: 'run-email-validation',
      body: {
        email: propsValue.email,
      },
    });
  },
});
