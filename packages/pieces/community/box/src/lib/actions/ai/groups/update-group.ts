import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

const LEVELS = ['admins_only', 'admins_and_members', 'all_managed_users'];
const CLEARABLE = ['description'];

export const updateGroupAction = createAction({
  auth: boxAuth,
  name: 'box_update_group',
  displayName: 'Update Group',
  description: 'Changes the details of a Box group.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes a group\'s name, description or visibility levels; only the fields given change. Needs admin rights. Get the ID from List Groups; change members with Add User To Group and Remove User From Group.',
    idempotent: true,
  },
  props: {
    groupId: boxAiProps.groupId({ required: true }),
    name: Property.ShortText({ displayName: 'Name', description: 'New unique group name.', required: false }),
    description: Property.LongText({ displayName: 'Description', description: 'New group description.', required: false }),
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
    provenance: Property.ShortText({
      displayName: 'Provenance',
      description: 'The external source this group syncs from, e.g. "Active Directory" or "Okta". Setting it stops admins editing the name and members in the Box web app.',
      required: false,
    }),
    externalSyncIdentifier: Property.ShortText({
      displayName: 'External Sync Identifier',
      description: 'The group\'s ID in an external system, used for syncing.',
      required: false,
    }),
    clearFields: Property.StaticMultiSelectDropdown({
      displayName: 'Clear Fields',
      description: 'Fields to empty: "description". Do not also give a Description.',
      required: false,
      options: { options: CLEARABLE.map((value) => ({ label: value, value })) },
    }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    for (const level of [propsValue.invitabilityLevel, propsValue.memberViewabilityLevel]) {
      if (level !== undefined && !LEVELS.includes(level)) {
        throw new Error(`Levels must be one of: ${LEVELS.join(', ')}.`);
      }
    }
    const clear = propsValue.clearFields ?? [];
    if (clear.some((field) => !CLEARABLE.includes(field))) {
      throw new Error(`Clear Fields must be from: ${CLEARABLE.join(', ')}.`);
    }
    if (clear.includes('description') && propsValue.description !== undefined) {
      throw new Error('Give either Description or "description" in Clear Fields, not both.');
    }
    const body = {
      ...(propsValue.name !== undefined ? { name: propsValue.name } : {}),
      ...(propsValue.description !== undefined ? { description: propsValue.description } : {}),
      ...(clear.includes('description') ? { description: '' } : {}),
      ...(propsValue.invitabilityLevel !== undefined ? { invitability_level: propsValue.invitabilityLevel } : {}),
      ...(propsValue.memberViewabilityLevel !== undefined ? { member_viewability_level: propsValue.memberViewabilityLevel } : {}),
      ...(propsValue.provenance !== undefined ? { provenance: propsValue.provenance } : {}),
      ...(propsValue.externalSyncIdentifier !== undefined ? { external_sync_identifier: propsValue.externalSyncIdentifier } : {}),
    };
    if (Object.keys(body).length === 0) {
      throw new Error('Give at least one field to update.');
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.PUT,
      path: `/groups/${encodeURIComponent(propsValue.groupId)}`,
      query: { fields: propsValue.fields },
      body,
    });
  },
});
