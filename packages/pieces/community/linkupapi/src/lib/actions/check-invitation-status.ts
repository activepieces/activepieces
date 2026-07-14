import { createAction, Property } from '@activepieces/pieces-framework';
import { linkupAuth, linkupAction, accountIdProp } from '../common';

export const checkInvitationStatus = createAction({
  auth: linkupAuth,
  name: 'check_invitation_status',
  displayName: 'Check Invitation Status',
  description: 'Check the status of a connection invitation sent to a profile.',
  props: {
    accountId: accountIdProp,
    profileUrl: Property.ShortText({
      displayName: 'Profile URL',
      description: 'LinkedIn profile URL to check',
      required: true,
    }),
  },
  async run(context) {
    const { accountId, profileUrl } = context.propsValue;
    return linkupAction(context.auth.secret_text, 'network', 'check_invitation', accountId, {
      profile_url: profileUrl,
    });
  },
});
