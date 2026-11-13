import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';

export const assignTaskAction = createAction({
  auth: podioAuth,
  name: 'podio_assign_task',
  displayName: 'Assign Task',
  description: 'Makes a user responsible for a task, or removes the responsible user.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sets who is responsible for one Podio task: give Responsible User ID to assign it, or set Unassign to "true" to leave nobody responsible; exactly one of the two. The task id comes from List Tasks, List Object Tasks or Create Task. The user id comes from List Space Members.',
    idempotent: true,
  },
  props: {
    taskId: podioAiProps.id({ required: true, displayName: 'Task ID', description: 'The id of the task.' }),
    responsibleUserId: podioAiProps.id({ required: false, displayName: 'Responsible User ID', description: 'The user id of the person to make responsible.' }),
    unassign: podioAiProps.bool({ required: false, displayName: 'Unassign', description: '"true" leaves nobody responsible. Cannot be combined with Responsible User ID.' }),
    silent: podioAiProps.silent({ required: false }),
  },
  async run({ auth, propsValue }) {
    const { taskId, responsibleUserId, unassign, silent } = propsValue;
    const clear = podioUtils.toBool({ value: unassign }) === true;
    if (clear === Boolean(responsibleUserId)) {
      throw new Error('Set exactly one of Responsible User ID or Unassign "true".');
    }
    if (responsibleUserId && !/^\d+$/.test(responsibleUserId)) {
      throw new Error('Responsible User ID must be a numeric Podio user id.');
    }
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: `/task/${taskId}/assign`,
      query: podioUtils.query({ values: { silent: podioUtils.toBool({ value: silent }) } }),
      body: { responsible: responsibleUserId ? Number(responsibleUserId) : null },
    });
  },
});
