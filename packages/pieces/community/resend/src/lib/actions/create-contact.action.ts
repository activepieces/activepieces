import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { resendAuth } from '../..';

export const createContact = createAction({
  name: 'create_contact',
  auth: resendAuth,
  displayName: 'Create Contact',
  description: 'Add a contact to a Resend audience',
  props: {
    audience_id: Property.ShortText({
      displayName: 'Audience ID',
      description:
        'The ID of the audience to add the contact to. Find it under Audiences in your Resend dashboard.',
      required: true,
    }),
    email: Property.ShortText({ displayName: 'Email', required: true }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    unsubscribed: Property.Checkbox({
      displayName: 'Unsubscribed',
      description:
        'If true, the contact will be unsubscribed from all broadcasts',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {
      email: propsValue.email,
    };
    if (propsValue.first_name) body['first_name'] = propsValue.first_name;
    if (propsValue.last_name) body['last_name'] = propsValue.last_name;
    if (propsValue.unsubscribed !== undefined) {
      body['unsubscribed'] = propsValue.unsubscribed;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.resend.com/audiences/${propsValue.audience_id}/contacts`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.secret_text,
      },
      body,
    });
    return response.body;
  },
});
