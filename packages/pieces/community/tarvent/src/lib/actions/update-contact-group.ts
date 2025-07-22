import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../..';
import { makeClient, tarventCommon } from '../common';

export const updateContactGroup = createAction({
  auth: tarventAuth,
  name: 'tarvent_update_contact_group',
  displayName: 'Add/Remove Contact From Audience Group',
  description: 'Adds or removes a contact from an audience group.',
  props: {
    audienceId: tarventCommon.audienceId(true, ''),
    groupId: tarventCommon.audienceGroupId(true, ''),
    contactId: tarventCommon.contactId,
    action: Property.StaticDropdown({
      displayName: 'Add or remove',
      description: 'Select whether to add or remove the contact from the group.',
      required: true,
      options: {
        options: [
          {
            label: 'Add',

            value: 'Add',
          },
          {
            label: 'Remove',
            value: 'Remove',
          },
        ],
      },
    }),
  },
  async run(context) {
    const { audienceId, groupId, contactId, action } = context.propsValue;

    const client = makeClient(context.auth);
    return await client.addRemoveContactGroup(action, contactId, audienceId, groupId);
  },
});
