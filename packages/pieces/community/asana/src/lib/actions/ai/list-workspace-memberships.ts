import { createAction, Property } from '@activepieces/pieces-framework';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaProps, asanaUtils } from '../../common/client';
import { asanaWorkspaceMembershipListOutputSchema } from '../../output-schemas';

export const asanaListWorkspaceMembershipsAction = createAction({
  auth: asanaAuth,
  name: 'list_workspace_memberships',
  classification: 'SEARCH',
  displayName: 'List Workspace Memberships',
  description: 'List who belongs to an Asana workspace and with what role.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists workspace memberships: each user with is_active, is_admin, is_guest and is_view_only flags. Filter by one user to check whether they are an admin or a guest before workspace or team changes. Use List Users when only names and emails are needed. Paginated with next_offset; read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaWorkspaceMembershipListOutputSchema,
  props: {
    workspace: Property.ShortText({
      displayName: 'Workspace GID',
      description: 'Gid of the workspace or organization. Obtain it from List Workspaces.',
      required: true,
    }),
    user: Property.ShortText({
      displayName: 'User',
      description: 'Only return the membership of this user: "me", an email address or a user gid. Leave empty to list everyone.',
      required: false,
    }),
    limit: asanaProps.limit({ noun: 'memberships' }),
    offset: asanaProps.offset(),
  },
  async run(context) {
    const { workspace, user, limit, offset } = context.propsValue;
    return asanaClient.asanaListPage<AsanaRecord>({
      auth: context.auth,
      path: `/workspaces/${asanaUtils.pathSegment(workspace)}/workspace_memberships`,
      operation: 'List Workspace Memberships',
      query: {
        user: asanaUtils.hasValue(user) ? String(user).trim() : undefined,
        opt_fields: ASANA_FIELDS.workspaceMembership,
      },
      limit,
      offset,
    });
  },
});
