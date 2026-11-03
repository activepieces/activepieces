import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../auth';
import { tarventCommon } from '../common';
import { tarventOperations } from '../common/operations';
import { tarventOutputSchemas } from '../output-schemas';

export const updateContactGroup = createAction({
  auth: tarventAuth,
  name: 'tarvent_update_contact_group',
  classification: 'WRITE',
  displayName: 'Add/Remove Contact From Audience Group',
  description: 'Adds or removes a contact from an audience group.',
  audience: 'human',
  aiMetadata: {
    description:
      'Adds one Tarvent contact to, or removes it from, one audience group (by audience ID, group ID and contact ID). Use to manage group membership for segmentation. Returns the contact ID, group ID and action. Not marked idempotent: Tarvent may reject adding a contact that is already in the group.',
    idempotent: false,
  },
  outputSchema: tarventOutputSchemas.contactGroup,
  props: {
    audienceId: tarventCommon.audienceId(true, 'Audience the contact and group belong to.'),
    groupId: tarventCommon.audienceGroupId(true, 'Group to add the contact to or remove it from.'),
    contactId: tarventCommon.contactId,
    action: Property.StaticDropdown({
      displayName: 'Add or remove',
      description: 'Select whether to add or remove the contact from the group.',
      required: true,
      options: {
        options: [
          { label: 'Add', value: 'Add' },
          { label: 'Remove', value: 'Remove' },
        ],
      },
    }),
  },
  async run(context) {
    return tarventOperations.setGroupMembership({ auth: context.auth.props, audienceId: context.propsValue.audienceId, groupId: context.propsValue.groupId, contactId: context.propsValue.contactId, add: context.propsValue.action === 'Add' });
  },
});
