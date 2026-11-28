import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxGetTaskAssignmentOutputSchema } from '../../../output-schemas';

const RESOLUTION_STATES = ['completed', 'incomplete', 'approved', 'rejected'];

export const updateTaskAssignmentAction = createAction({
  auth: boxAuth,
  name: 'box_update_task_assignment',
  outputSchema: boxGetTaskAssignmentOutputSchema,
  displayName: 'Update Task Assignment',
  description: 'Resolves or comments on a Box task assignment.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sets the resolution state of a task assignment and/or adds the assignee\'s message; only the assignee can do this. "review" tasks take incomplete, approved or rejected; "complete" tasks take incomplete or completed. Get the ID from List Task Assignments.',
    idempotent: true,
  },
  props: {
    taskAssignmentId: boxAiProps.taskAssignmentId({ required: true }),
    resolutionState: Property.StaticDropdown({
      displayName: 'Resolution State',
      description: '"completed", "incomplete", "approved" or "rejected".',
      required: false,
      options: { options: RESOLUTION_STATES.map((value) => ({ label: value, value })) },
    }),
    message: Property.LongText({ displayName: 'Message', description: 'The assignee\'s note, e.g. "Looks good to me".', required: false }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.resolutionState !== undefined && !RESOLUTION_STATES.includes(propsValue.resolutionState)) {
      throw new Error(`Resolution State must be one of: ${RESOLUTION_STATES.join(', ')}.`);
    }
    const body = {
      ...(propsValue.resolutionState !== undefined ? { resolution_state: propsValue.resolutionState } : {}),
      ...(propsValue.message !== undefined ? { message: propsValue.message } : {}),
    };
    if (Object.keys(body).length === 0) {
      throw new Error('Give Resolution State or Message.');
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.PUT,
      path: `/task_assignments/${encodeURIComponent(propsValue.taskAssignmentId)}`,
      body,
    });
  },
});
