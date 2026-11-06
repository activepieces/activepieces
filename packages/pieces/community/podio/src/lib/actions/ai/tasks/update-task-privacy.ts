import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';

export const updateTaskPrivacyAction = createAction({
  auth: podioAuth,
  name: 'podio_update_task_privacy',
  displayName: 'Update Task Privacy',
  description: 'Makes a task private or visible to the workspace.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sets whether one Podio task is private, visible only to its creator and responsible user, or visible to everyone who can see its workspace. The task id comes from List Tasks, List Object Tasks or Create Task.',
    idempotent: true,
  },
  props: {
    taskId: podioAiProps.id({ required: true, displayName: 'Task ID', description: 'The id of the task.' }),
    private: podioAiProps.bool({ required: true, displayName: 'Private', description: '"true" makes the task private, "false" makes it visible.' }),
    hook: podioAiProps.hook({ required: false }),
    silent: podioAiProps.silent({ required: false }),
  },
  async run({ auth, propsValue }) {
    const isPrivate = podioUtils.toBool({ value: propsValue.private });
    if (isPrivate === undefined) {
      throw new Error('Private must be "true" or "false".');
    }
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.PUT,
      path: `/task/${propsValue.taskId}/private`,
      query: podioUtils.query({
        values: { hook: podioUtils.toBool({ value: propsValue.hook }), silent: podioUtils.toBool({ value: propsValue.silent }) },
      }),
      body: { private: isPrivate },
    });
  },
});
