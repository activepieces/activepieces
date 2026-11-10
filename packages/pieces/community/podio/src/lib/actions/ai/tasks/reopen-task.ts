import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';

export const reopenTaskAction = createAction({
  auth: podioAuth,
  name: 'podio_reopen_task',
  displayName: 'Reopen Task',
  description: 'Marks a completed task as not completed.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Marks one completed Podio task as active again, undoing Complete Task. The task id comes from List Tasks, List Object Tasks or Create Task.',
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
      path: `/task/${propsValue.taskId}/incomplete`,
      query: podioUtils.query({
        values: { hook: podioUtils.toBool({ value: propsValue.hook }), silent: podioUtils.toBool({ value: propsValue.silent }) },
      }),
    });
  },
});
