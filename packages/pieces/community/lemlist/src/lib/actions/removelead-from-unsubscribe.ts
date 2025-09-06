import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';

export const removeLeadFromUnsubscribe = createAction({
  name: 'remove_lead_from_unsubscribe',
  description: 'Removes a lead from the unsubscribe list.',
  displayName: 'Remove Lead From Unsubscribe',
  props: {
    auth: Property.ShortText({
      displayName: 'API Key / Password',
      required: true,
    }),
    leadEmail: Property.ShortText({
      displayName: 'Lead Email',
      required: true,
    }),
  },

  async run({ propsValue }) {
    const { auth, leadEmail } = propsValue;

    await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `https://api.lemlist.com/api/unsubscribes/${leadEmail}`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: '',
        password: auth as string,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return { success: true };
  },
});
