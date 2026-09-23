import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wavixAuth } from '../common/auth';
import { wavixApiCall } from '../common/client';

export const verify2faCode = createAction({
  auth: wavixAuth,
  name: 'verify_2fa_code',
  classification: 'WRITE',
  displayName: 'Verify 2FA Code',
  description: 'Validate a one-time code the end user entered.',
  audience: 'both',
  aiMetadata: {
    description:
      'Validates the code the end user submitted against a 2FA session and returns whether it is valid. Each session allows a limited number of attempts; once exhausted the session must be recreated.',
    idempotent: false,
  },
  props: {
    sessionId: Property.ShortText({
      displayName: 'Session ID',
      description: 'The session_id returned by "Send 2FA Code".',
      required: true,
    }),
    code: Property.ShortText({
      displayName: 'Code',
      description: 'The one-time code the end user entered.',
      required: true,
    }),
  },
  async run(context) {
    const { sessionId, code } = context.propsValue;

    return await wavixApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      resourcePath: `/v1/two-fa/verification/${sessionId}/check`,
      body: { code },
    });
  },
});
