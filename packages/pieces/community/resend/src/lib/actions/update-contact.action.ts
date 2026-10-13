import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { resendProps } from '../common/props';
import { updateContactOutputSchema } from '../output-schemas';

export const updateContact = createAction({
  name: 'update_contact',
  classification: 'WRITE',
  auth: resendAuth,
  displayName: 'Update Contact',
  outputSchema: updateContactOutputSchema,
  description: 'Update the name or subscription status of a contact in an audience',
  audience: 'both',
  aiMetadata: { description: 'Updates an existing contact\'s first name, last name, or subscribed/unsubscribed status within an audience, identified by audience ID and contact ID. Use this to change details or toggle subscription for a known contact. Idempotent — repeating with the same values leaves the contact in the same state.', idempotent: true },
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

    return await resendClient.sendRequest<{ object: string; id: string }>({ auth: auth.secret_text, method: HttpMethod.PATCH, path: `/audiences/${propsValue.audience_id}/contacts/${propsValue.contact_id}`, body: body });
  },
});
