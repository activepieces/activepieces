import { createAction } from '@activepieces/pieces-framework';
import { microsoft365PeopleAuth } from '../common/auth';
import { microsoft365PeopleCommon } from '../common/common';

export const deleteContact = createAction({
  auth: microsoft365PeopleAuth,
  name: 'deleteContact',
  displayName: 'Delete a Contact',
  description: 'Permanently remove a contact.',
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
