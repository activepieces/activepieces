import { createAction, Property } from '@activepieces/pieces-framework';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaProps, asanaUtils } from '../../common/client';

export const asanaListProjectTemplatesAction = createAction({
  auth: asanaAuth,
  name: 'list_project_templates',
  classification: 'SEARCH',
  displayName: 'List Project Templates',
  description: 'List the custom project templates of an Asana team, or of a plain workspace (paid Asana plans only).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists custom project templates in a workspace or a team, with the date variables (requested_dates) and roles (requested_roles) each one needs. Use it to get the template gid and the date and role gids before Instantiate Project Template. Set Team GID or Workspace GID, not both. In an organization (a company-domain workspace, is_organization=true in List Workspaces) Asana rejects Workspace GID with "Not a valid regular workspace", so use Team GID there (get it from List Teams); Workspace GID only works for plain workspaces. Custom templates need a paid Asana plan. Paginated with next_offset; read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    workspace: Property.ShortText({
      displayName: 'Workspace GID',
      description: 'Gid of a plain (non-organization) workspace whose templates to list. Asana rejects organizations here; use Team GID for them. Set this or Team GID.',
      required: false,
    }),
    team: Property.ShortText({
      displayName: 'Team GID',
      description: 'Gid of the team whose templates to list (preferred; required in organizations). Obtain it from List Teams. Set this or Workspace GID.',
      required: false,
    }),
    limit: asanaProps.limit({ noun: 'templates' }),
    offset: asanaProps.offset(),
  },
  async run(context) {
    const { workspace, team, limit, offset } = context.propsValue;
    asanaUtils.assertNotBoth({ first: workspace, second: team, firstLabel: 'Workspace GID', secondLabel: 'Team GID' });
    if (!asanaUtils.hasValue(workspace) && !asanaUtils.hasValue(team)) {
      throw new Error('Set Workspace GID or Team GID.');
    }
    return asanaClient.asanaListPage<AsanaRecord>({
      auth: context.auth,
      path: '/project_templates',
      operation: 'List Project Templates',
      query: {
        workspace: asanaUtils.hasValue(workspace) ? String(workspace).trim() : undefined,
        team: asanaUtils.hasValue(team) ? String(team).trim() : undefined,
        opt_fields: ASANA_FIELDS.projectTemplate,
      },
      limit,
      offset,
    });
  },
});
