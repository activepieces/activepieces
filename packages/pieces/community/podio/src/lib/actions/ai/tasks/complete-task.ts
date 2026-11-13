import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioCompleteTaskOutputSchema } from '../../../output-schemas';

export const completeTaskAction = createAction({
  auth: podioAuth,
  name: 'podio_complete_task',
  outputSchema: podioCompleteTaskOutputSchema,
  displayName: 'Complete Task',
  description: 'Marks a task as completed.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Marks one Podio task as completed; for a recurring task Podio creates the next occurrence and returns its id. Use Reopen Task to undo. The task id comes from List Tasks, List Object Tasks or Create Task.',
    idempotent: true,
  },
  props: {
    taskId: podioAiProps.id({ required: true, displayName: 'Task ID', description: 'The id of the task.' }),
    hook: podioAiProps.hook({ required: false }),
    silent: podioAiProps.silent({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: `/task/${propsValue.taskId}/complete`,
      query: podioUtils.query({
        values: { hook: podioUtils.toBool({ value: propsValue.hook }), silent: podioUtils.toBool({ value: propsValue.silent }) },
      }),
    });
  },
});
