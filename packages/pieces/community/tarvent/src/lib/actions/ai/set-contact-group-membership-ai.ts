import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../../auth';
import { tarventOperations } from '../../common/operations';
import { tarventOutputSchemas } from '../../output-schemas';

export const setContactGroupMembershipAi = createAction({
  auth: tarventAuth,
  name: 'tarvent_set_contact_group_membership_ai',
  classification: 'WRITE',
  displayName: 'Add or Remove Contact From Group (AI)',
  description: 'Adds a contact to, or removes it from, an audience group.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds one Tarvent contact to, or removes it from, one static audience group. Give the audience ID, group ID (from Find Audience Groups), contact ID and action ADD or REMOVE. Not idempotent: Tarvent may reject adding a contact that is already in the group.',
    idempotent: false,
  },
  outputSchema: tarventOutputSchemas.contactGroup,
  props: {
    audienceId: Property.ShortText({ displayName: 'Audience ID', description: 'The Tarvent audience ID (from Find Audience).', required: true }),
    groupId: Property.ShortText({ displayName: 'Group ID', description: 'The audience group ID (from Find Audience Groups).', required: true }),
    contactId: Property.ShortText({ displayName: 'Contact ID', description: 'The Tarvent contact ID (from Find Contact or List Contacts).', required: true }),
    action: Property.StaticDropdown({ displayName: 'Action', description: 'ADD to or REMOVE from the group.', required: true, options: { options: [{ label: 'Add', value: 'ADD' }, { label: 'Remove', value: 'REMOVE' }] } }),
  },
  async run(context) {
    const p = context.propsValue;
    return tarventOperations.setGroupMembership({ auth: context.auth.props, audienceId: p.audienceId, groupId: p.groupId, contactId: p.contactId, add: p.action === 'ADD' });
  },
});
