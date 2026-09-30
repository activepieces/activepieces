import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { DIRECTORY_URL, googleAdminClient } from '../common/client';
import { googleAdminProps } from '../common/props';

export const invalidateVerificationCodes = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'invalidate_verification_codes',
  classification: 'DESTRUCTIVE',
  displayName: 'Invalidate Backup Verification Codes',
  description: "Invalidates all of a user's 2-Step Verification backup codes.",
  audience: 'both',
  aiMetadata: {
    description:
      "Invalidate every 2-Step Verification backup code a user has, e.g. after codes were exposed. Safe to retry.",
    idempotent: true,
  },
  props: {
    user: googleAdminProps.user({ required: true }),
  },
  async run({ auth, propsValue }) {
    await googleAdminClient.request({
      auth,
      method: HttpMethod.POST,
      url: `${DIRECTORY_URL}/users/${encodeURIComponent(propsValue.user)}/verificationCodes/invalidate`,
    });
    return { success: true, user: propsValue.user };
  },
});
