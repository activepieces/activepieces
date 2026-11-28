import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxGetTaskOutputSchema } from '../../../output-schemas';

export const getTaskAction = createAction({
  auth: boxAuth,
  name: 'box_get_task',
  outputSchema: boxGetTaskOutputSchema,
  displayName: 'Get Task',
  description: 'Gets a task on a Box file.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one task by ID: its file, action, message, due date, completion state and assignments. Get the ID from List File Tasks or Create Task.',
    idempotent: true,
  },
  props: {
    taskId: boxAiProps.taskId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/tasks/${encodeURIComponent(propsValue.taskId)}`,
    });
  },
});
