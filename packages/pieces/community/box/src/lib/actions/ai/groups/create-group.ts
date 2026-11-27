import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

const LEVELS = ['admins_only', 'admins_and_members', 'all_managed_users'];

export const createGroupAction = createAction({
  auth: boxAuth,
  name: 'box_create_group',
  displayName: 'Create Group',
  description: 'Creates a group in the Box enterprise.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Creates an enterprise group and returns its ID; needs admin rights. Add members with Add User To Group.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', description: 'Unique group name.', required: true }),
    description: Property.LongText({ displayName: 'Description', description: 'Group description.', required: false }),
    invitabilityLevel: Property.StaticDropdown({
      displayName: 'Who Can Invite',
      description: 'Who can invite the group to collaborate: admins_only, admins_and_members or all_managed_users.',
      required: false,
      options: { options: LEVELS.map((value) => ({ label: value, value })) },
    }),
    memberViewabilityLevel: Property.StaticDropdown({
      displayName: 'Who Can See Members',
      description: 'Who can see the member list: admins_only, admins_and_members or all_managed_users.',
      required: false,
      options: { options: LEVELS.map((value) => ({ label: value, value })) },
    }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    for (const level of [propsValue.invitabilityLevel, propsValue.memberViewabilityLevel]) {
      if (level !== undefined && !LEVELS.includes(level)) {
        throw new Error(`Levels must be one of: ${LEVELS.join(', ')}.`);
      }
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/groups',
      query: { fields: propsValue.fields },
      body: {
        name: propsValue.name,
        ...(propsValue.description !== undefined ? { description: propsValue.description } : {}),
        ...(propsValue.invitabilityLevel !== undefined ? { invitability_level: propsValue.invitabilityLevel } : {}),
        ...(propsValue.memberViewabilityLevel !== undefined ? { member_viewability_level: propsValue.memberViewabilityLevel } : {}),
      },
    });
  },
});
