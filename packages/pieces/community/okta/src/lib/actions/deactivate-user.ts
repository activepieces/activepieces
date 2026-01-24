import { createAction, Property } from '@activepieces/pieces-framework';
import { oktaAuth, makeOktaRequest, userIdDropdown } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';


export const deactivateUserAction = createAction({
  auth: oktaAuth,
  name: 'deactivate_user',
  displayName: 'Deactivate User',
  description: 'Deactivate (disable) a user in Okta',
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