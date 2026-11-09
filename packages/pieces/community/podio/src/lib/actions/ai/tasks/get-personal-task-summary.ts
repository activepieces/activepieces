import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetPersonalTaskSummaryOutputSchema } from '../../../output-schemas';

export const getPersonalTaskSummaryAction = createAction({
  auth: podioAuth,
  name: 'podio_get_personal_task_summary',
  outputSchema: podioGetPersonalTaskSummaryOutputSchema,
  displayName: 'Get Personal Task Summary',
  description: 'Summarizes the personal tasks of the connected user by due date.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Summarizes the personal tasks of the connected user, those not in any workspace: returns the open tasks grouped into overdue, due today and other, each group with its total and up to Limit tasks.',
    idempotent: true,
  },
  props: {
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of tasks to return in each group. Defaults to 4.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.GET,
      path: '/task/personal/summary',
      query: podioUtils.query({ values: { limit: propsValue.limit } }),
    });
  },
});
