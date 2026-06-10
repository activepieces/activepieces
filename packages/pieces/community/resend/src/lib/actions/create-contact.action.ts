import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendProps } from '../common/props';

export const createContact = createAction({
  name: 'create_contact',
  auth: resendAuth,
  displayName: 'Create Contact',
  description: 'Add a contact to a Resend audience',
  audience: 'both',
  aiMetadata: { description: 'Adds a new contact (email plus optional name and subscription status) to a specific Resend audience. Use this to grow a mailing list; requires the target audience ID (use List Audiences to find it). Not idempotent — each call creates a new contact, so guard against re-adding the same email.', idempotent: false },
  props: {
    audience_id: resendProps.audienceId,
    email: Property.ShortText({ displayName: 'Email', required: true }),
    first_name: Property.ShortText({ displayName: 'First Name', required: false }),
    last_name: Property.ShortText({ displayName: 'Last Name', required: false }),
    unsubscribed: Property.Checkbox({
      displayName: 'Unsubscribed',
      description: 'If true, the contact will be unsubscribed from all broadcasts',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = { email: propsValue.email };
    if (propsValue.first_name) body['first_name'] = propsValue.first_name;
    if (propsValue.last_name) body['last_name'] = propsValue.last_name;
    if (propsValue.unsubscribed !== undefined) body['unsubscribed'] = propsValue.unsubscribed;

    const response = await httpClient.sendRequest<{ object: string; id: string }>({
      method: HttpMethod.POST,
      url: `https://api.resend.com/audiences/${propsValue.audience_id}/contacts`,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth.secret_text },
      body,
    });
    return response.body;
  },
});
