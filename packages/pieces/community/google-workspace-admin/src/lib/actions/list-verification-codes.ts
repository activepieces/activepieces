import { createAction } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { googleAdminProps } from '../common/props';
import { securityHelpers } from '../common/security';

export const listVerificationCodes = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'list_verification_codes',
  classification: 'SEARCH',
  displayName: 'List Backup Verification Codes',
  description: "Lists a user's unused 2-Step Verification backup codes.",
  audience: 'both',
  aiMetadata: {
    description:
      "List a user's current unused 2-Step Verification backup codes. Returns nothing if none were generated. Read-only and safe to retry.",
    idempotent: true,
  },
  props: {
    user: googleAdminProps.user({ required: true }),
  },
  async run({ auth, propsValue }) {
    return securityHelpers.listVerificationCodes({ auth, user: propsValue.user });
  },
});
