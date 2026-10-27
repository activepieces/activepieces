import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mailflossAuth } from '../auth';
import { mailflossApi } from '../common/client';

export const verifyEmailAction = createAction({
  auth: mailflossAuth,
  name: 'verify_email',
  classification: 'READ',
  displayName: 'Verify Email',
  description: 'Verify one email address in real time.',
  audience: 'both',
  aiMetadata: {
    description:
      'Verifies a single email address in real time and returns its status (passed, undeliverable, risky or unknown), the reason, role/disposable/free flags and a suggested typo fix when there is one. Use Start Batch Verification for many addresses. Uses one mailfloss credit per call; safe to retry.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address to verify.',
      required: true,
    }),
  },
  async run(context) {
    return mailflossApi.send<Record<string, unknown>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/v1/verify',
      queryParams: { email: context.propsValue.email.trim() },
    });
  },
});
