import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { DIRECTORY_URL, googleAdminClient } from '../common/client';
import { googleAdminProps } from '../common/props';
import { securityHelpers } from '../common/security';

export const generateVerificationCodes = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'generate_verification_codes',
  classification: 'WRITE',
  displayName: 'Generate Backup Verification Codes',
  description: 'Creates a new set of 2-Step Verification backup codes for a user.',
  audience: 'both',
  aiMetadata: {
    description:
      "Generate a fresh set of 10 2-Step Verification backup codes for a user, replacing any unused ones, and return them. Useful when a user is locked out of 2SV. Each call invalidates the previous codes.",
    idempotent: false,
  },
  props: {
    user: googleAdminProps.user({ required: true }),
  },
  async run({ auth, propsValue }) {
    await googleAdminClient.request({
      auth,
      method: HttpMethod.POST,
      url: `${DIRECTORY_URL}/users/${encodeURIComponent(propsValue.user)}/verificationCodes/generate`,
    });
    return securityHelpers.listVerificationCodes({ auth, user: propsValue.user });
  },
});
