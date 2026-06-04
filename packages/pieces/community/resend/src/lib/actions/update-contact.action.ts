import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendProps } from '../common/props';

export const updateContact = createAction({
  name: 'update_contact',
  auth: resendAuth,
  displayName: 'Update Contact',
  description: 'Update the name or subscription status of a contact in an audience',
  props: {
    audience_id: resendProps.audienceId,
    contact_id: resendProps.contactId,
    first_name: Property.ShortText({ displayName: 'First Name', required: false }),
    last_name: Property.ShortText({ displayName: 'Last Name', required: false }),
    unsubscribed: Property.StaticDropdown({
      displayName: 'Subscription Status',
      required: false,
      options: {
        options: [
          { label: 'Subscribed', value: false },
          { label: 'Unsubscribed', value: true },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {};
    if (propsValue.first_name !== undefined && propsValue.first_name !== '') {
      body['first_name'] = propsValue.first_name;
    }
    if (propsValue.last_name !== undefined && propsValue.last_name !== '') {
      body['last_name'] = propsValue.last_name;
    }
    if (propsValue.unsubscribed !== undefined && propsValue.unsubscribed !== null) {
      body['unsubscribed'] = propsValue.unsubscribed;
    }

    const response = await httpClient.sendRequest<{ object: string; id: string }>({
      method: HttpMethod.PATCH,
      url: `https://api.resend.com/audiences/${propsValue.audience_id}/contacts/${propsValue.contact_id}`,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth.secret_text },
      body,
    });
    return response.body;
  },
});
