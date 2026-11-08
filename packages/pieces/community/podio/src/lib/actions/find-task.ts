import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { podioClient } from '../common/client';
import { podioProps } from '../common/props';
import { podioAuth } from '../auth';
import { findTaskOutputSchema } from '../output-schemas';

export const findTaskAction = createAction({
  auth: podioAuth,
  name: 'find_task',
  outputSchema: findTaskOutputSchema,
  classification: 'READ',
  displayName: 'Find Task',
  description: 'Retrieve a task by ID for further updates.',
  audience: 'human',
  aiMetadata: { description: 'Fetches a single Podio task by its task id. Use to read a task\'s current details before updating it or to verify it exists; requires the task id. Idempotent — a read that does not modify data.', idempotent: true },
  props: {
    taskId: podioProps.taskId({ required: true }),
  },
  async run(context) {
    const { taskId } = context.propsValue;

    if (!taskId) {
      throw new Error('Task selection is required. Please select a task from the dropdown.');
    }

    return await podioClient.request<unknown>({
      method: HttpMethod.GET,
      auth: context.auth,
      path: `/task/${taskId}`,
    });
  },
});
