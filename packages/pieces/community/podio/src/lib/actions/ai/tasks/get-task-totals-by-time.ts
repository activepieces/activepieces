import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioCountObjectTasksOutputSchema } from '../../../output-schemas';

export const getTaskTotalsByTimeAction = createAction({
  auth: podioAuth,
  name: 'podio_get_task_totals_by_time',
  outputSchema: podioCountObjectTasksOutputSchema,
  displayName: 'Get Task Totals By Time',
  description: 'Counts the tasks of the connected user that are overdue, due, due today or all.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns how many tasks of the connected user match one time bucket ("overdue", "due", "today" or "all"), optionally only in one workspace. Use Get Task Totals for all buckets at once. The space id comes from List Org Spaces.',
    idempotent: true,
  },
  props: {
    time: podioAiProps.choice({ required: true, displayName: 'Time', description: 'Which tasks to count.', values: ['overdue', 'due', 'today', 'all'] }),
    spaceId: podioAiProps.id({ required: false, displayName: 'Space ID', description: 'Only count tasks in this workspace.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.GET,
      path: `/task/total/${propsValue.time}`,
      query: podioUtils.query({ values: { space_id: propsValue.spaceId } }),
    });
  },
});
