import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../auth';
import { makeClient, tarventCommon } from '../common';

export const updateContactGroup = createAction({
  auth: tarventAuth,
  name: 'tarvent_update_contact_group',
  displayName: 'Add/Remove Contact From Audience Group',
  description: 'Adds or removes a contact from an audience group.',
  audience: 'both',
  aiMetadata: { description: 'Adds or removes a Tarvent contact from a specific audience group, with the direction (add vs. remove) chosen by the action input. Use to manage group membership for segmentation. Idempotent: re-running with the same group and direction leaves membership unchanged.', idempotent: true },
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
