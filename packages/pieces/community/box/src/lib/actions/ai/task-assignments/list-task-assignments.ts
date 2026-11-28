import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxListTaskAssignmentsOutputSchema } from '../../../output-schemas';

export const listTaskAssignmentsAction = createAction({
  auth: boxAuth,
  name: 'box_list_task_assignments',
  outputSchema: boxListTaskAssignmentsOutputSchema,
  displayName: 'List Task Assignments',
  description: 'Lists who a Box task is assigned to.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists all assignments of a task with their IDs, assignees and resolution states. Get the task ID from List File Tasks or Create Task.',
    idempotent: true,
  },
  props: {
    taskId: boxAiProps.taskId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/tasks/${encodeURIComponent(propsValue.taskId)}/assignments`,
    });
  },
});
