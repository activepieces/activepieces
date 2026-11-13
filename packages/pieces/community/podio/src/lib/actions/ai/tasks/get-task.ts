import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetTaskOutputSchema } from '../../../output-schemas';

export const getTaskAction = createAction({
  auth: podioAuth,
  name: 'podio_get_task',
  outputSchema: podioGetTaskOutputSchema,
  displayName: 'Get Task',
  description: 'Gets one task by its id.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads one Podio task with its status, text, description, due date, responsible user, reference, labels, files, reminder, recurrence and comments. The task id comes from List Tasks, List Object Tasks or Create Task.',
    idempotent: true,
  },
  props: {
    taskId: podioAiProps.id({ required: true, displayName: 'Task ID', description: 'The id of the task.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/task/${propsValue.taskId}` });
  },
});
