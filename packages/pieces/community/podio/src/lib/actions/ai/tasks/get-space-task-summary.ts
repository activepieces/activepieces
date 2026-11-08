import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetSpaceTaskSummaryOutputSchema } from '../../../output-schemas';

export const getSpaceTaskSummaryAction = createAction({
  auth: podioAuth,
  name: 'podio_get_space_task_summary',
  outputSchema: podioGetSpaceTaskSummaryOutputSchema,
  displayName: 'Get Space Task Summary',
  description: 'Summarizes the open tasks in a workspace by due date.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Summarizes the tasks in one Podio workspace: returns the open tasks grouped into overdue, due today and other, each group with its total and up to Limit tasks. The space id comes from List Org Spaces.',
    idempotent: true,
  },
  props: {
    spaceId: podioAiProps.id({ required: true, displayName: 'Space ID', description: 'The id of the workspace.' }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of tasks to return in each group. Defaults to 4.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.GET,
      path: `/task/space/${propsValue.spaceId}/summary`,
      query: podioUtils.query({ values: { limit: propsValue.limit } }),
    });
  },
});
