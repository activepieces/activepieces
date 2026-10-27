import { createAction } from '@activepieces/pieces-framework';
import { arteemisAuth } from '../auth';
import { arteemisApi } from '../common/client';
import { contactIdProp, listDropdown } from '../common/props';

export const addContactToList = createAction({
  auth: arteemisAuth,
  name: 'add_contact_to_list',
  classification: 'WRITE',
  displayName: 'Add Contact to List',
  description: 'Puts an existing contact in one of your lists. A contact already in the list stays there once.',
  audience: 'both',
  aiMetadata: {
    description:
      'Add an existing Arteemis contact (by contact ID) to one of the workspace\'s person lists. Use Create or Update Contact with a list to add a new person in one step. Safe to retry: a contact already in the list stays there once.',
    idempotent: true,
  },
  props: {
    list_id: listDropdown({ required: true, description: 'The person list the contact joins.' }),
    contact_id: contactIdProp(),
  },
  async run(context) {
    const contactId = context.propsValue.contact_id.trim();
    const listId = context.propsValue.list_id;
    const { data } = await arteemisApi.call<{ added: number; total: number }>({
      apiKey: context.auth.secret_text,
      tool: 'contact_lists_manage',
      body: { operation: 'add_contacts', list_id: listId, contact_ids: [contactId] },
    });
    return { list_id: listId, contact_id: contactId, added: data.added, list_total: data.total };
  },
});
