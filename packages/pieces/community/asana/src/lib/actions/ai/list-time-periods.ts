import { createAction, Property } from '@activepieces/pieces-framework';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaProps, asanaUtils } from '../../common/client';
import { asanaTimePeriodListOutputSchema } from '../../output-schemas';

export const asanaListTimePeriodsAction = createAction({
  auth: asanaAuth,
  name: 'list_time_periods',
  classification: 'SEARCH',
  displayName: 'List Time Periods',
  description: 'List the goal time periods (fiscal years, quarters) of an Asana workspace (Advanced Asana plans and up).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the time periods goals are set against (for example FY26 or Q3 FY26), with display name, period type, start and end dates and parent period. Use the gids to filter List Goals by time period. Start On and End On narrow the list by the dates of the periods. Goals need an Advanced or higher Asana plan. Paginated with next_offset; read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaTimePeriodListOutputSchema,
  props: {
    workspace: Property.ShortText({
      displayName: 'Workspace GID',
      description: 'Gid of the workspace. Obtain it from List Workspaces.',
      required: true,
    }),
    start_on: Property.ShortText({
      displayName: 'Start On',
      description: 'Narrow the list by period start date, YYYY-MM-DD (sent to Asana as start_on).',
      required: false,
    }),
    end_on: Property.ShortText({
      displayName: 'End On',
      description: 'Narrow the list by period end date, YYYY-MM-DD (sent to Asana as end_on).',
      required: false,
    }),
    limit: asanaProps.limit({ noun: 'time periods' }),
    offset: asanaProps.offset(),
  },
  async run(context) {
    const { workspace, start_on, end_on, limit, offset } = context.propsValue;
    return asanaClient.asanaListPage<AsanaRecord>({
      auth: context.auth,
      path: '/time_periods',
      operation: 'List Time Periods',
      query: {
        workspace: workspace.trim(),
        start_on: asanaUtils.hasValue(start_on) ? asanaUtils.assertDate({ value: String(start_on), field: 'Start On' }) : undefined,
        end_on: asanaUtils.hasValue(end_on) ? asanaUtils.assertDate({ value: String(end_on), field: 'End On' }) : undefined,
        opt_fields: ASANA_FIELDS.timePeriod,
      },
      limit,
      offset,
    });
  },
});
