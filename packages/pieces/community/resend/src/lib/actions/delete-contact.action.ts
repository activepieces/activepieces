import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { resendProps } from '../common/props';
import { deleteContactOutputSchema } from '../output-schemas';

export const deleteContact = createAction({
  name: 'delete_contact',
  classification: 'DESTRUCTIVE',
  auth: resendAuth,
  displayName: 'Delete Contact',
  outputSchema: deleteContactOutputSchema,
  description: 'Remove a contact from an audience',
  audience: 'both',
  aiMetadata: { description: 'Permanently removes a contact from a Resend audience, identified by audience ID and contact ID. Use this to delete a subscriber from a list. Effectively idempotent — once removed, repeating the call has no further effect.', idempotent: true },
  props: {
    audience_id: resendProps.audienceId,
    contact_id: resendProps.contactId,
  },
  async run({ auth, propsValue }) {
    const response = await resendClient.sendRequest<{
      object: string;
      contact: string;
      deleted: boolean;
    }>({ auth: auth.secret_text, method: HttpMethod.DELETE, path: `/audiences/${propsValue.audience_id}/contacts/${propsValue.contact_id}` });
    return response;
  },
});
