import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { scruppAuth } from '../auth';
import { scruppApiCall } from '../common';

export const verifyEmailAction = createAction({
  auth: scruppAuth,
  name: 'verify-email',
  displayName: 'Verify Email',
  description: 'Check whether a single email address is deliverable.',
  audience: 'both',
  aiMetadata: {
    description:
      'Verifies one email address and reports whether it is deliverable. Synchronous — unlike the extraction actions it returns immediately rather than creating a job. Use before sending to avoid bounces.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({ displayName: 'Email', required: true }),
  },
  async run(context) {
    return scruppApiCall<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      endpoint: '/email/verify',
      body: { email: context.propsValue.email },
    });
  },
});
