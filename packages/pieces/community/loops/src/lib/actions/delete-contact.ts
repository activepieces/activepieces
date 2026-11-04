import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { loopsAuth } from '../auth';
import { loopsClient } from '../common/client';
import { loopsSchemas } from '../common/schemas';

export const deleteContact = createAction({
  name: 'delete_contact',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Contact',
  description: 'Permanently deletes a contact from Loops by their email address or user ID.',
  audience: 'both',
  outputSchema: loopsSchemas.successWithMessage,
  aiMetadata: {
    description:
      'Permanently deletes one Loops contact, identified by exactly one of email or userId (fill one, leave the other empty). Cannot be undone. Not idempotent: deleting a contact that no longer exists fails with 404.',
    idempotent: false,
  },
  auth: loopsAuth,
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the contact to delete. Fill this or User ID, not both.',
      required: false,
    }),
    userId: Property.ShortText({
      displayName: 'User ID',
      description: 'Your internal user ID of the contact to delete. Fill this or Email, not both.',
      required: false,
    }),
  },
  async run(context) {
    const email = (context.propsValue.email ?? '').trim();
    const userId = (context.propsValue.userId ?? '').trim();
    if ((email && userId) || (!email && !userId)) {
      throw new Error('Provide exactly one of Email or User ID.');
    }
    return loopsClient.request<Record<string, unknown>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/contacts/delete',
      body: email ? { email } : { userId },
    });
  },
});
