import { createAction } from '@activepieces/pieces-framework';
import { microsoft365PeopleAuth } from '../common/auth';
import { microsoft365PeopleCommon } from '../common/common';

export const deleteContact = createAction({
  auth: microsoft365PeopleAuth,
  name: 'deleteContact',
  displayName: 'Delete a Contact',
  description: 'Permanently remove a contact.',
  audience: 'both',
  aiMetadata: { description: 'Permanently deletes a single contact from the authenticated user\'s Microsoft 365 People (Outlook) address book, identified by its contact ID. Use when removing a person record. The deletion is irreversible; repeating it for the same ID has no further effect since the contact no longer exists.', idempotent: false },
  props: {
    contactId: microsoft365PeopleCommon.contactDropdown(),
  },
  async run(context) {
    const { contactId } = context.propsValue;
    if (!contactId) {
      throw new Error('Contact ID is required.');
    }

    return await microsoft365PeopleCommon.deleteContact({
      auth: context.auth,
      contactId,
    });
  },
});
