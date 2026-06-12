import { createAction, Property } from '@activepieces/pieces-framework';
import { oktaAuth, makeOktaRequest, userIdDropdown } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';


export const deactivateUserAction = createAction({
  auth: oktaAuth,
  name: 'deactivate_user',
  displayName: 'Deactivate User',
  description: 'Deactivate (disable) a user in Okta',
  audience: 'both',
  aiMetadata: { description: 'Transitions an existing Okta user (by user ID) to the DEACTIVATED lifecycle state, disabling their access while preserving the account. Use to offboard or temporarily disable someone. Idempotent on end-state — re-running leaves the user deactivated, though it may re-send the notification email if that option is on.', idempotent: true },
  props: {
    userId: userIdDropdown(),
    sendEmail: Property.Checkbox({
      displayName: 'Send Email',
      description: 'Send deactivation email to user',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const userId = context.propsValue.userId;
    const sendEmail = context.propsValue.sendEmail ? 'true' : 'false';

    const response = await makeOktaRequest(
      context.auth,
      `/users/${userId}/lifecycle/deactivate?sendEmail=${sendEmail}`,
      HttpMethod.POST
    );

    return response.body;
  },
});