import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { resendAuth } from '../..';

export const createContact = createAction({
  name: 'create_contact',
  auth: resendAuth,
  displayName: 'Create Contact',
  description: 'Add a contact to a Resend audience',
  props: {
    audience_id: Property.ShortText({ displayName: 'Audience ID', required: true }),
    email: Property.ShortText({ displayName: 'Email', required: true }),
    first_name: Property.ShortText({ displayName: 'First Name', required: false }),
    last_name: Property.ShortText({ displayName: 'Last Name', required: false }),
    unsubscribed: Property.Checkbox({ displayName: 'Unsubscribed', required: false, defaultValue: false }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {
      email: propsValue.email,
    };
    if (propsValue.first_name) body['first_name'] = propsValue.first_name;
    if (propsValue.last_name) body['last_name'] = propsValue.last_name;
    if (propsValue.unsubscribed !== undefined) body['unsubscribed'] = propsValue.unsubscribed;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.resend.com/audiences/${propsValue.audience_id}/contacts`,
      headers: { Authorization: `Bearer ${auth}`, 'Content-Type': 'application/json' },
      body,
    });
    return response.body;
  },
});
