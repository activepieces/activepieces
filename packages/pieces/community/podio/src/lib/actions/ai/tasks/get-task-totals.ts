import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetTaskTotalsOutputSchema } from '../../../output-schemas';

export const getTaskTotalsAction = createAction({
  auth: podioAuth,
  name: 'podio_get_task_totals',
  outputSchema: podioGetTaskTotalsOutputSchema,
  displayName: 'Get Task Totals',
  description: 'Counts the active tasks of the connected user by due date.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns task counts for the connected user (completed yesterday, overdue, today, tomorrow, upcoming, later), for tasks assigned to them and tasks they reassigned, optionally limited to some workspaces. Space ids come from List Org Spaces.',
    idempotent: true,
  },
  props: {
    space: podioAiProps.text({ required: false, displayName: 'Space IDs', description: 'Only count tasks in these workspaces: one id, or several separated by semicolons.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.GET,
      path: '/task/total/',
      query: podioUtils.query({ values: { space: propsValue.space } }),
    });
  },
});
