import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioClient } from '../../../common/client';
import { podioListTaskLabelsOutputSchema } from '../../../output-schemas';

export const listTaskLabelsAction = createAction({
  auth: podioAuth,
  name: 'podio_list_task_labels',
  outputSchema: podioListTaskLabelsOutputSchema,
  displayName: 'List Task Labels',
  description: 'Lists the task labels of the connected user.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists all task labels of the connected user with their ids, names and colors, for use in Create Task, Update Task and Replace Task Labels.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    const body = await podioClient.request<unknown[]>({ auth, method: HttpMethod.GET, path: '/task/label/' });
    return { labels: body, count: body.length };
  },
});
