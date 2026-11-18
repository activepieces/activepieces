import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetObjectTaskSummaryOutputSchema } from '../../../output-schemas';

export const getObjectTaskSummaryAction = createAction({
  auth: podioAuth,
  name: 'podio_get_object_task_summary',
  outputSchema: podioGetObjectTaskSummaryOutputSchema,
  displayName: 'Get Object Task Summary',
  description: 'Summarizes the open tasks on an item or other object by due date.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Summarizes the tasks linked to one Podio object, chosen by Reference Type and Reference ID: returns the open tasks grouped into overdue, due today and other, each group with its total and up to Limit tasks. Use List Object Tasks for every task on it.',
    idempotent: true,
  },
  props: {
    refType: podioAiProps.text({ required: true, displayName: 'Reference Type', description: 'The type of object, such as "item", "status", "app" or "space".' }),
    refId: podioAiProps.id({ required: true, displayName: 'Reference ID', description: 'The id of the object.' }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of tasks to return in each group. Defaults to 4.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.GET,
      path: `/task/${propsValue.refType}/${propsValue.refId}/summary`,
      query: podioUtils.query({ values: { limit: propsValue.limit } }),
    });
  },
});
