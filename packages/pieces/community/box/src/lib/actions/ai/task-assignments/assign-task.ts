import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const assignTaskAction = createAction({
  auth: boxAuth,
  name: 'box_assign_task',
  displayName: 'Assign Task',
  description: 'Assigns a Box task to a user.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Assigns a task to one user, given by User ID or by login email (exactly one), and returns the assignment ID. Get the task ID from Create Task or List File Tasks and user IDs from List Users.',
    idempotent: false,
  },
  props: {
    taskId: boxAiProps.taskId({ required: true }),
    userId: boxAiProps.userId({
      required: false,
      description: 'ID of the user to assign. Give this or User Login, not both.',
    }),
    userLogin: Property.ShortText({
      displayName: 'User Login',
      description: 'Email address the user signs in with. Give this or User ID, not both.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    if (Boolean(propsValue.userId) === Boolean(propsValue.userLogin)) {
      throw new Error('Give exactly one of User ID or User Login.');
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/task_assignments',
      body: {
        task: { id: propsValue.taskId, type: 'task' },
        assign_to: propsValue.userId ? { id: propsValue.userId } : { login: propsValue.userLogin },
      },
    });
  },
});
