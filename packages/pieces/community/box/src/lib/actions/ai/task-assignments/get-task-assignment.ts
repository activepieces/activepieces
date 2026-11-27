import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const getTaskAssignmentAction = createAction({
  auth: boxAuth,
  name: 'box_get_task_assignment',
  displayName: 'Get Task Assignment',
  description: 'Gets one assignment of a Box task.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one task assignment by ID: the assignee, its resolution state and message. Get the ID from List Task Assignments or Assign Task.',
    idempotent: true,
  },
  props: {
    taskAssignmentId: boxAiProps.taskAssignmentId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/task_assignments/${encodeURIComponent(propsValue.taskAssignmentId)}`,
    });
  },
});
