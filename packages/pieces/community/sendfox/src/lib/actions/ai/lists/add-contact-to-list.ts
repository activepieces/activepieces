import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendfoxAuth } from '../../../auth';
import { sendfoxAiProps } from '../../../common/ai-props';
import { sendfoxClient } from '../../../common/client';
import { sendfoxAddContactToListOutputSchema } from '../../../output-schemas';

export const addContactToListAction = createAction({
  auth: sendfoxAuth,
  name: 'sendfox_add_contact_to_list',
  outputSchema: sendfoxAddContactToListOutputSchema,
  displayName: 'Add Contact to List',
  description: 'Add an existing SendFox contact to a list',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds an existing contact to a list by contact ID and list ID. Use it for a contact that already exists; to add a new email, use Create Contact with its lists. Contact IDs come from Create Contact; list IDs from List Lists.',
    idempotent: true,
  },
  props: {
    listId: sendfoxAiProps.listId({ required: true }),
    contactId: sendfoxAiProps.contactId({ required: true }),
  },
  async run(context) {
    const { listId, contactId } = context.propsValue;
    return await sendfoxClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/lists/${encodeURIComponent(listId)}/contacts`,
      body: { contact_id: contactId },
    });
  },
});
