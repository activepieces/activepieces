import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { millionVerifierAuth } from '../auth';
import { millionVerifierClient } from '../common/client';
import type { MillionVerifierVerifyResult } from '../common/types';
import { verifyEmailActionOutputSchema } from '../output-schemas';

export const verifyEmail = createAction({
  auth: millionVerifierAuth,
  name: 'verifyEmail',
  classification: 'READ',
  displayName: 'Verify Email',
  description: 'Verify email address using Million Verifier API',
  audience: 'human',
  outputSchema: verifyEmailActionOutputSchema,
  aiMetadata: { description: 'Validates a single email address against the MillionVerifier real-time API, returning its deliverability status (e.g. deliverable, undeliverable, risky). Use to check whether an email is valid and safe to send to before adding it to a list or sending mail. Requires one email address; the call is read-only and idempotent.', idempotent: true },
  props: {
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address to verify',
      required: true,
    }),
    timeout: Property.Number({
      displayName: 'Timeout',
      description: 'Timeout in seconds (default: 10)',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const { email, timeout = 10 } = context.propsValue;
    return await millionVerifierClient.request<MillionVerifierVerifyResult>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/',
      query: { email, timeout: timeout.toString() },
    });
  },
});
