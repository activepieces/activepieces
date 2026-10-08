import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';
import { asanaWorkspaceMembershipOutputSchema } from '../../output-schemas';

export const asanaGetWorkspaceMembershipAction = createAction({
  auth: asanaAuth,
  name: 'get_workspace_membership',
  classification: 'READ',
  displayName: 'Get Workspace Membership',
  description: 'Get one Asana workspace membership.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one workspace membership: the user, the workspace and the is_active, is_admin, is_guest and is_view_only flags. Use List Workspace Memberships to find membership gids or to look up a user\'s membership directly. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaWorkspaceMembershipOutputSchema,
  props: {
    workspace_membership: Property.ShortText({
      displayName: 'Workspace Membership GID',
      description: 'Gid of the workspace membership. Obtain it from List Workspace Memberships.',
      required: true,
    }),
  },
  async run(context) {
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/workspace_memberships/${asanaUtils.pathSegment(context.propsValue.workspace_membership)}`,
      operation: 'Get Workspace Membership',
      query: { opt_fields: ASANA_FIELDS.workspaceMembership },
    });
  },
});
