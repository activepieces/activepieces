import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';

export const updateTaskDueAction = createAction({
  auth: podioAuth,
  name: 'podio_update_task_due',
  displayName: 'Update Task Due',
  description: 'Changes the due date and time of a task.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes when one Podio task is due: give Due On as a UTC date and time, or Due Date with an optional Due Time in the user\'s local time; set at least one. The task id comes from List Tasks, List Object Tasks or Create Task.',
    idempotent: true,
  },
  props: {
    taskId: podioAiProps.id({ required: true, displayName: 'Task ID', description: 'The id of the task.' }),
    dueOn: podioAiProps.text({ required: false, displayName: 'Due On (UTC)', description: 'The due date and time in UTC, as "YYYY-MM-DD HH:MM:SS".' }),
    dueDate: podioAiProps.text({ required: false, displayName: 'Due Date', description: 'The due date in local time, as "YYYY-MM-DD".' }),
    dueTime: podioAiProps.text({ required: false, displayName: 'Due Time', description: 'The due time in local time, as "HH:MM:SS".' }),
    hook: podioAiProps.hook({ required: false }),
    silent: podioAiProps.silent({ required: false }),
  },
  async run({ auth, propsValue }) {
    const { taskId, dueOn, dueDate, dueTime } = propsValue;
    if (!dueOn && !dueDate && !dueTime) {
      throw new Error('Set at least one of Due On, Due Date or Due Time.');
    }
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.PUT,
      path: `/task/${taskId}/due`,
      query: podioUtils.query({
        values: { hook: podioUtils.toBool({ value: propsValue.hook }), silent: podioUtils.toBool({ value: propsValue.silent }) },
      }),
      body: podioUtils.body({ values: { due_on: dueOn || undefined, due_date: dueDate || undefined, due_time: dueTime || undefined } }),
    });
  },
});
