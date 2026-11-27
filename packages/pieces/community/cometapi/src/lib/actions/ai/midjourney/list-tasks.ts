import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiClient } from '../../../common/client';
import { cometapiMidjourneyListTasksOutputSchema } from '../../../output-schemas';

export const midjourneyListTasksAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_midjourney_list_tasks',
  outputSchema: cometapiMidjourneyListTasksOutputSchema,
  displayName: 'Midjourney List Tasks',
  description:
    'Reads the status and results of several Midjourney tasks by ID.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      "Reads several Midjourney tasks in one call by their ids (from the result of any Midjourney submit action), returning each task's status, progress, imageUrl, failReason and buttons. Use Midjourney Get Task for a single task.",
    idempotent: true,
  },
  props: {
    ids: Property.Array({
      displayName: 'Task IDs',
      description: 'Task IDs returned in result by Midjourney submit actions.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.ids.length === 0) {
      throw new Error('Provide at least one Task ID.');
    }
    const tasks = await cometApiClient.request<unknown[]>({
      auth,
      method: HttpMethod.POST,
      host: 'root',
      path: '/mj/task/list-by-condition',
      body: { ids: propsValue.ids },
    });
    return { tasks, count: tasks.length };
  },
});
