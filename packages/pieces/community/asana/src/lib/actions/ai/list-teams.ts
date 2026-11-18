import { createAction, Property } from '@activepieces/pieces-framework';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaProps, asanaUtils } from '../../common/client';
import { asanaTeamListOutputSchema } from '../../output-schemas';

export const asanaListTeamsAction = createAction({
  auth: asanaAuth,
  name: 'list_teams',
  classification: 'SEARCH',
  displayName: 'List Teams',
  description: 'List the teams in an Asana organization.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the teams in an organization that the connected user can see. Teams exist only in organizations (company-domain workspaces); a plain workspace returns an error. Use it to find the team gid Create Project needs in an organization. Paginated with next_offset; read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaTeamListOutputSchema,
  props: {
    workspace: Property.ShortText({
      displayName: 'Organization (Workspace) GID',
      description: 'Gid of the organization, for example 1201234567890123. Obtain it from List Workspaces (is_organization must be true).',
      required: true,
    }),
    limit: asanaProps.limit({ noun: 'teams' }),
    offset: asanaProps.offset(),
  },
  async run(context) {
    const { workspace, limit, offset } = context.propsValue;
    return asanaClient.asanaListPage<AsanaRecord>({
      auth: context.auth,
      path: `/workspaces/${asanaUtils.pathSegment(workspace)}/teams`,
      operation: 'List Teams',
      query: { opt_fields: ASANA_FIELDS.team },
      limit,
      offset,
    });
  },
});
