import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { millionVerifierAuth } from '../../auth';
import { millionVerifierClient } from '../../common/client';
import type { MillionVerifierVerifyResult } from '../../common/types';
import { millionverifierVerifyEmailOutputSchema } from '../../output-schemas';

export const verifyEmailAiAction = createAction({
  auth: millionVerifierAuth,
  name: 'millionverifier_verify_email',
  outputSchema: millionverifierVerifyEmailOutputSchema,
  displayName: 'Verify Email',
  description: 'Verifies one email address in real time and returns its deliverability result.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Verifies a single email address in real time and returns its result (ok, catch_all, unknown, disposable, invalid), quality and whether it is a free or role address. Spends one credit per call. For many addresses use Upload Emails for Bulk Verification instead.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address to verify, e.g. "jane@example.com".',
      required: true,
    }),
    timeout: Property.Number({
      displayName: 'Timeout',
      description: 'Seconds to wait for the recipient mail server, between 2 and 60. Defaults to 20.',
      required: false,
    }),
  },
  async run(context) {
    const { email, timeout } = context.propsValue;
    return await millionVerifierClient.requestOrThrow<MillionVerifierVerifyResult>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/',
      query: { email, ...(timeout !== undefined && timeout !== null ? { timeout: String(timeout) } : {}) },
    });
  },
});
