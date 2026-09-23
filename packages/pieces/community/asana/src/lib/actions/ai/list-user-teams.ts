import { createAction, Property } from '@activepieces/pieces-framework';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaProps, asanaUtils } from '../../common/client';
import { asanaTeamListOutputSchema } from '../../output-schemas';

export const asanaListUserTeamsAction = createAction({
  auth: asanaAuth,
  name: 'list_user_teams',
  classification: 'SEARCH',
  displayName: 'List User Teams',
  description: 'List the teams a user belongs to in an Asana organization.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the teams one user belongs to in an organization. Use "me" for the connected user\'s own teams; use List Teams for every team in the organization. Teams exist only in organizations, so a plain workspace returns an error. Paginated with next_offset; read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaTeamListOutputSchema,
  props: {
    user: Property.ShortText({
      displayName: 'User',
      description: 'User whose teams to list: "me", an email address or a user gid.',
      required: true,
    }),
    organization: Property.ShortText({
      displayName: 'Organization (Workspace) GID',
      description: 'Gid of the organization to list teams in. Obtain it from List Workspaces (is_organization must be true).',
      required: true,
    }),
    limit: asanaProps.limit({ noun: 'teams' }),
    offset: asanaProps.offset(),
  },
  async run(context) {
    const { user, organization, limit, offset } = context.propsValue;
    return asanaClient.asanaListPage<AsanaRecord>({
      auth: context.auth,
      path: `/users/${asanaUtils.pathSegment(user)}/teams`,
      operation: 'List User Teams',
      query: { organization: organization.trim(), opt_fields: ASANA_FIELDS.team },
      limit,
      offset,
    });
  },
});
