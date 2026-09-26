import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { AsanaRecord, asanaClient, asanaUtils } from '../../common/client';
import { asanaMembershipOutputSchema } from '../../output-schemas';

const ACCESS_LEVEL_OPTIONS = [
  { label: 'Admin', value: 'admin' },
  { label: 'Editor', value: 'editor' },
  { label: 'Commenter', value: 'commenter' },
  { label: 'Viewer', value: 'viewer' },
  { label: 'User (custom fields only)', value: 'user' },
];

export const asanaCreateMembershipAction = createAction({
  auth: asanaAuth,
  name: 'create_membership',
  classification: 'WRITE',
  displayName: 'Create Membership',
  description: 'Share a project, goal, portfolio or custom field with a user or team.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds a user or a team as a member of a project (also goals, portfolios and custom fields on paid plans) with a chosen access level, and returns the new membership. Projects accept admin, editor or commenter; goals viewer, commenter, editor or admin; portfolios admin, editor or viewer; custom fields admin, editor or user. Use Add Project Members to add several users at the default level. Not idempotent: a repeat may fail or create a second record.',
    idempotent: false,
  },
  outputSchema: asanaMembershipOutputSchema,
  props: {
    parent: Property.ShortText({
      displayName: 'Parent GID',
      description: 'Gid of the project (or goal, portfolio, custom field or custom type) to share. Obtain a project gid from List Projects.',
      required: true,
    }),
    member: Property.ShortText({
      displayName: 'Member GID',
      description: 'Gid of the user or team to add. Obtain a team gid from List Teams, or a user gid from Get Current User or Search Workspace Objects.',
      required: true,
    }),
    access_level: Property.StaticDropdown({
      displayName: 'Access Level',
      description: 'Access to grant; valid values depend on the parent type. Leave empty for the parent\'s default.',
      required: false,
      options: { disabled: false, options: ACCESS_LEVEL_OPTIONS },
    }),
  },
  async run(context) {
    const { parent, member, access_level } = context.propsValue;
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/memberships',
      operation: 'Create Membership',
      data: {
        parent: parent.trim(),
        member: member.trim(),
        ...(asanaUtils.hasValue(access_level) ? { access_level } : {}),
      },
    });
  },
});
