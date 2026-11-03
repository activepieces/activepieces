import { createAction, Property } from '@activepieces/pieces-framework';
import { proweblookAuth } from '../auth';
import { proweblookApi } from '../common/client';
import { verifyEmailOutputSchema } from '../common/output-schemas';
import { VerifyEmailData } from '../common/types';

export const verifyEmailAction = createAction({
  auth: proweblookAuth,
  name: 'verify_email',
  classification: 'READ',
  audience: 'both',
  displayName: 'Verify Email',
  description:
    'Verify an email address for deliverability, syntax, MX records, and disposable status.',
  outputSchema: verifyEmailOutputSchema,
  aiMetadata: {
    description:
      'Verifies an email address through ProWebLook and returns its deliverability verdict (deliverable, undeliverable, or unknown) and reason. Consumes 1 email credit per lookup.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'Email address to verify (e.g. person@example.com).',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const email = propsValue.email.trim();
    if (!email) {
      throw new Error('Email Address cannot be empty.');
    }

    return await proweblookApi.post<VerifyEmailData>({
      apiKey: auth.secret_text.trim(),
      operation: 'verify_email',
      body: { email },
    });
  },
});
