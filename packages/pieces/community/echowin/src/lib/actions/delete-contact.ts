import { createAction, Property } from '@activepieces/pieces-framework';
import { echowinAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const deleteContact = createAction({
  auth: echowinAuth,
  name: 'deleteContact',
  displayName: 'Delete Contact',
  description: 'Delete a contact by ID',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes a contact from the Echowin CRM, identified by its unique contact ID. Use when removing a known contact; obtain the ID from a find/list step first. Idempotent in effect — once the contact is gone, repeating the call leaves it absent.',
    idempotent: true,
  },
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The unique identifier of the contact to delete',
      required: true,
    }),
  },
  async run(context) {
    const { contactId } = context.propsValue;

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.DELETE,
      `/contacts/${contactId}`
    );

    return response.body;
  },
});
