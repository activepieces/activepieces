import { createAction, Property } from '@activepieces/pieces-framework';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaProps, asanaUtils } from '../../common/client';

export const asanaListTimeTrackingEntriesAction = createAction({
  auth: asanaAuth,
  name: 'list_time_tracking_entries',
  classification: 'SEARCH',
  displayName: 'List Time Tracking Entries',
  description: 'List logged time entries for a task, project, portfolio, user or workspace (Advanced Asana plans and up).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists native Asana time tracking entries (minutes logged, date entered, who logged it, attributed project, categories). Filter by task, attributed project, portfolio or user. Asana requires Entered From or Entered To whenever Workspace GID is set, even together with another filter, so to list one user\'s time without a date range set User GID alone. Use it to total time spent on a task or project. Time tracking needs an Advanced or higher Asana plan; lower plans get a paid-plan error. Paginated with next_offset; read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    task: Property.ShortText({
      displayName: 'Task GID',
      description: 'Gid of a task, to list the time logged on it.',
      required: false,
    }),
    attributable_to: Property.ShortText({
      displayName: 'Attributed Project GID',
      description: 'Gid of a project, to list the time attributed to it.',
      required: false,
    }),
    portfolio: Property.ShortText({
      displayName: 'Portfolio GID',
      description: 'Gid of a portfolio, to list the time logged on its work.',
      required: false,
    }),
    user: Property.ShortText({
      displayName: 'User GID',
      description: 'Gid of a user, to list the time they logged.',
      required: false,
    }),
    workspace: Property.ShortText({
      displayName: 'Workspace GID',
      description: 'Gid of the workspace, to list time across it. Requires Entered From or Entered To.',
      required: false,
    }),
    entered_on_start_date: Property.ShortText({
      displayName: 'Entered From',
      description: 'Start of the entry date range, YYYY-MM-DD.',
      required: false,
    }),
    entered_on_end_date: Property.ShortText({
      displayName: 'Entered To',
      description: 'End of the entry date range, YYYY-MM-DD.',
      required: false,
    }),
    limit: asanaProps.limit({ noun: 'entries' }),
    offset: asanaProps.offset(),
  },
  async run(context) {
    const props = context.propsValue;
    const filters = [props.task, props.attributable_to, props.portfolio, props.user, props.workspace];
    if (!filters.some((filter) => asanaUtils.hasValue(filter))) {
      throw new Error('Set at least one of Task GID, Attributed Project GID, Portfolio GID, User GID or Workspace GID.');
    }
    const startDate = asanaUtils.hasValue(props.entered_on_start_date) ? asanaUtils.assertDate({ value: String(props.entered_on_start_date), field: 'Entered From' }) : undefined;
    const endDate = asanaUtils.hasValue(props.entered_on_end_date) ? asanaUtils.assertDate({ value: String(props.entered_on_end_date), field: 'Entered To' }) : undefined;
    if (asanaUtils.hasValue(props.workspace) && startDate === undefined && endDate === undefined) {
      throw new Error('Asana requires Entered From or Entered To whenever Workspace GID is set. Add a date, or leave Workspace GID empty and filter by Task, Attributed Project, Portfolio or User GID alone.');
    }
    return asanaClient.asanaListPage<AsanaRecord>({
      auth: context.auth,
      path: '/time_tracking_entries',
      operation: 'List Time Tracking Entries',
      query: {
        task: trimmed(props.task),
        attributable_to: trimmed(props.attributable_to),
        portfolio: trimmed(props.portfolio),
        user: trimmed(props.user),
        workspace: trimmed(props.workspace),
        entered_on_start_date: startDate,
        entered_on_end_date: endDate,
        opt_fields: ASANA_FIELDS.timeTrackingEntry,
      },
      limit: props.limit,
      offset: props.offset,
    });
  },
});

function trimmed(value: string | undefined | null): string | undefined {
  return asanaUtils.hasValue(value) ? String(value).trim() : undefined;
}
