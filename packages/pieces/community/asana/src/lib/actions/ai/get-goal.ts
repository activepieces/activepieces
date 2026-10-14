import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';

export const asanaGetGoalAction = createAction({
  auth: asanaAuth,
  name: 'get_goal',
  classification: 'READ',
  displayName: 'Get Goal',
  description: 'Get the details and progress metric of an Asana goal (Advanced Asana plans and up).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one goal: name, notes, status, dates, owner, team, time period, followers, latest status update and its progress metric (initial, current and target values, unit and progress source). For the subgoals, projects, tasks or portfolios that feed it use List Goal Relationships. Goals need an Advanced or higher Asana plan. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    goal: Property.ShortText({
      displayName: 'Goal GID',
      description: 'Gid of the goal. Obtain it from List Goals.',
      required: true,
    }),
  },
  async run(context) {
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/goals/${asanaUtils.pathSegment(context.propsValue.goal)}`,
      operation: 'Get Goal',
      query: { opt_fields: ASANA_FIELDS.goal },
    });
  },
});
