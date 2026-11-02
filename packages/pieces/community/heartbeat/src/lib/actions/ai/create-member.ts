import { Property, createAction } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../../auth';
import { heartbeatApi } from '../../common/client';
import { heartbeatProps } from '../../common/props';
import { heartbeatUsers } from '../../common/users';
import { heartbeatOutputSchemas } from '../../common/output-schemas';

export const createMemberAction = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_create_member',
  classification: 'WRITE',
  displayName: 'Create Member (by Role ID)',
  description: 'Creates a member with a role ID and optional group IDs.',
  audience: 'ai',
  aiMetadata: {
    description: 'Creates a member in the Heartbeat community from a name, unique email and role ID (get role IDs from List Roles, group IDs from List Groups), optionally with groups, bio, status and social links, and returns the new member. Use Find Member by Email first to avoid duplicates. Not idempotent: a second call with the same email is rejected as a duplicate.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', description: "The member's full name.", required: true }),
    email: Property.ShortText({ displayName: 'Email', description: 'Must be unique in the community.', required: true }),
    roleId: heartbeatProps.id({ displayName: 'Role ID', description: 'Use List Roles to find the ID.', required: true }),
    groupIds: heartbeatProps.ids({ displayName: 'Group IDs', description: 'Groups the member joins. Use List Groups to find IDs.', required: false }),
    bio: Property.LongText({ displayName: 'Bio', required: false }),
    status: Property.ShortText({ displayName: 'Status', required: false }),
    linkedin: Property.ShortText({ displayName: 'LinkedIn URL', description: 'Full URL including https://', required: false }),
    twitter: Property.ShortText({ displayName: 'Twitter URL', description: 'Full URL including https://', required: false }),
    instagram: Property.ShortText({ displayName: 'Instagram URL', description: 'Full URL including https://', required: false }),
    website: Property.ShortText({ displayName: 'Website URL', description: 'Full URL including https://', required: false }),
    createIntroductionThread: Property.Checkbox({
      displayName: 'Post Introduction Thread',
      description: 'When on and a bio is given, posts an introduction thread for the member in the community introductions channel.',
      required: false,
      defaultValue: false,
    }),
  },
  outputSchema: heartbeatOutputSchemas.createdUser,
  async run({ auth, propsValue }) {
    return heartbeatUsers.createUser({
      token: auth.secret_text,
      body: {
        name: heartbeatApi.requiredText({ value: propsValue.name, label: 'Name' }),
        email: heartbeatApi.email({ value: propsValue.email, label: 'Email' }),
        roleID: heartbeatApi.uuid({ value: propsValue.roleId, label: 'Role ID' }),
        groupIDs: heartbeatApi.listOrUndefined(heartbeatApi.uuidList({ value: propsValue.groupIds, label: 'Group IDs' })),
        bio: heartbeatApi.optionalText(propsValue.bio),
        status: heartbeatApi.optionalText(propsValue.status),
        linkedin: heartbeatApi.optionalUrl({ value: propsValue.linkedin, label: 'LinkedIn URL' }),
        twitter: heartbeatApi.optionalUrl({ value: propsValue.twitter, label: 'Twitter URL' }),
        instagram: heartbeatApi.optionalUrl({ value: propsValue.instagram, label: 'Instagram URL' }),
        website: heartbeatApi.optionalUrl({ value: propsValue.website, label: 'Website URL' }),
        createIntroductionThread: propsValue.createIntroductionThread === true,
      },
    });
  },
});
