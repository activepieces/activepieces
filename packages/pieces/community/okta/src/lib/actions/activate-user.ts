import { createAction, Property } from '@activepieces/pieces-framework';
import { oktaAuth, makeOktaRequest, userIdDropdown } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';


export const activateUserAction = createAction({
  auth: oktaAuth,
  name: 'activate_user',
  displayName: 'Activate User',
  description: 'Activate a previously deactivated or pending user',
  audience: 'both',
  aiMetadata: { description: 'Transitions an existing Okta user (identified by user ID) to the ACTIVE lifecycle state, optionally emailing them an activation link. Use to re-enable a deactivated or pending account. Idempotent on end-state — re-running leaves the user active, though it may re-send the activation email if that option is on.', idempotent: true },
  props: {
    userId: userIdDropdown(),
    sendEmail: Property.Checkbox({
      displayName: 'Send Email',
      description: 'Send activation email to user',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const userId = context.propsValue.userId;
    const sendEmail = context.propsValue.sendEmail ? 'true' : 'false';

    const response = await makeOktaRequest(
      context.auth,
      `/users/${userId}/lifecycle/activate?sendEmail=${sendEmail}`,
      HttpMethod.POST
    );

    return response.body;
  },
});