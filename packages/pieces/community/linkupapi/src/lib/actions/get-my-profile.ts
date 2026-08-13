import { createAction } from '@activepieces/pieces-framework';
import { linkupAuth, linkupAction, accountIdProp } from '../common';

export const getMyProfile = createAction({
  auth: linkupAuth,
  name: 'get_my_profile',
  displayName: 'Get My Profile',
  description: 'Retrieve the profile of the connected LinkedIn account.',
  audience: 'both',
  aiMetadata: { description: 'Retrieves the LinkedIn profile of the connected account itself, resolving who the automation is acting as. Use Get Profile Info for anyone else. Requires the account ID from List Accounts. Read-only and idempotent.', idempotent: true },
  props: {
    accountId: accountIdProp,
  },
  async run(context) {
    return linkupAction(
      context.auth.secret_text,
      'profiles',
      'get_me',
      context.propsValue.accountId
    );
  },
});
