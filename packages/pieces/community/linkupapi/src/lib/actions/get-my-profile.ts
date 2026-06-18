import { createAction } from '@activepieces/pieces-framework';
import { linkupAuth, linkupAction, accountIdProp } from '../common';

export const getMyProfile = createAction({
  auth: linkupAuth,
  name: 'get_my_profile',
  displayName: 'Get My Profile',
  description: 'Retrieve the profile of the connected LinkedIn account.',
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
