import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';

export const updateTaskReferenceAction = createAction({
  auth: podioAuth,
  name: 'podio_update_task_reference',
  displayName: 'Update Task Reference',
  description: 'Links a task to an item or other object.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Links one Podio task to an object chosen by Reference Type and Reference ID, replacing its current link. Use Remove Task Reference to detach it. The task id comes from List Tasks, List Object Tasks or Create Task.',
    idempotent: true,
  },
  props: {
    taskId: podioAiProps.id({ required: true, displayName: 'Task ID', description: 'The id of the task.' }),
    refType: podioAiProps.text({ required: true, displayName: 'Reference Type', description: 'The type of object, such as "item", "status", "app" or "space".' }),
    refId: podioAiProps.id({ required: true, displayName: 'Reference ID', description: 'The id of the object.' }),
    hook: podioAiProps.hook({ required: false }),
    silent: podioAiProps.silent({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.PUT,
      path: `/task/${propsValue.taskId}/ref`,
      query: podioUtils.query({
        values: { hook: podioUtils.toBool({ value: propsValue.hook }), silent: podioUtils.toBool({ value: propsValue.silent }) },
      }),
      body: { ref_type: propsValue.refType, ref_id: Number(propsValue.refId) },
    });
  },
});
