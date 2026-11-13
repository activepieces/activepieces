import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetOrganizationTaskSummaryOutputSchema } from '../../../output-schemas';

export const getTaskSummaryAction = createAction({
  auth: podioAuth,
  name: 'podio_get_task_summary',
  outputSchema: podioGetOrganizationTaskSummaryOutputSchema,
  displayName: 'Get Task Summary',
  description: 'Summarizes the open tasks of the connected user by due date.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Summarizes the tasks of the connected user across all workspaces: returns the open tasks grouped into overdue, due today and other, each group with its total and up to Limit tasks. Use List Tasks for a full filtered list.',
    idempotent: true,
  },
  props: {
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of tasks to return in each group. Defaults to 4.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.GET,
      path: '/task/summary',
      query: podioUtils.query({ values: { limit: propsValue.limit } }),
    });
  },
});
