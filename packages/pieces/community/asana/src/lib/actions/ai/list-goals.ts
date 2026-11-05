import { createAction, Property } from '@activepieces/pieces-framework';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaProps, asanaUtils } from '../../common/client';

export const asanaListGoalsAction = createAction({
  auth: asanaAuth,
  name: 'list_goals',
  classification: 'SEARCH',
  displayName: 'List Goals',
  description: 'List Asana goals by workspace, team, time period or supporting work (Advanced Asana plans and up).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists goals with status, dates, owner, team and time period. Scope the list with Workspace GID or Team GID, or find the goals a project, task or portfolio supports; narrow by time period gids from List Time Periods. Use Get Goal for metrics and notes. Goals need an Advanced or higher Asana plan; lower plans get a paid-plan error. Paginated with next_offset; read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    workspace: Property.ShortText({
      displayName: 'Workspace GID',
      description: 'Gid of the workspace whose goals to list. Obtain it from List Workspaces.',
      required: false,
    }),
    team: Property.ShortText({
      displayName: 'Team GID',
      description: 'Gid of a team, to list only that team\'s goals. Obtain it from List Teams.',
      required: false,
    }),
    project: Property.ShortText({
      displayName: 'Supporting Project GID',
      description: 'Gid of a project, to list the goals it supports.',
      required: false,
    }),
    task: Property.ShortText({
      displayName: 'Supporting Task GID',
      description: 'Gid of a task, to list the goals it supports.',
      required: false,
    }),
    portfolio: Property.ShortText({
      displayName: 'Supporting Portfolio GID',
      description: 'Gid of a portfolio, to list the goals it supports.',
      required: false,
    }),
    is_workspace_level: asanaProps.optionalBoolean({
      displayName: 'Workspace-Level Goals',
      description: 'Yes for company-wide (workspace-level) goals only, No for team goals only. Requires Workspace GID. Leave empty for both.',
    }),
    time_periods: Property.Array({
      displayName: 'Time Period GIDs',
      description: 'Only goals in these time periods. Obtain gids from List Time Periods.',
      required: false,
    }),
    limit: asanaProps.limit({ noun: 'goals' }),
    offset: asanaProps.offset(),
  },
  async run(context) {
    const props = context.propsValue;
    const scopes = [props.workspace, props.team, props.project, props.task, props.portfolio];
    if (!scopes.some((scope) => asanaUtils.hasValue(scope))) {
      throw new Error('Set at least one of Workspace GID, Team GID, Supporting Project GID, Supporting Task GID or Supporting Portfolio GID.');
    }
    if (typeof props.is_workspace_level === 'boolean' && !asanaUtils.hasValue(props.workspace)) {
      throw new Error('Workspace-Level Goals needs Workspace GID as well.');
    }
    const timePeriods = asanaUtils.toStringArray(props.time_periods);
    return asanaClient.asanaListPage<AsanaRecord>({
      auth: context.auth,
      path: '/goals',
      operation: 'List Goals',
      query: {
        workspace: trimmed(props.workspace),
        team: trimmed(props.team),
        project: trimmed(props.project),
        task: trimmed(props.task),
        portfolio: trimmed(props.portfolio),
        is_workspace_level: props.is_workspace_level,
        time_periods: timePeriods.length > 0 ? timePeriods.join(',') : undefined,
        opt_fields: ASANA_FIELDS.goalList,
      },
      limit: props.limit,
      offset: props.offset,
    });
  },
});

function trimmed(value: string | undefined | null): string | undefined {
  return asanaUtils.hasValue(value) ? String(value).trim() : undefined;
}
