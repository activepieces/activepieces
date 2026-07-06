import { slidespeakAuth } from '../auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { BASE_URL } from '../common/constants';

export const getTaskStatusAction = createAction({
  auth: slidespeakAuth,
  name: 'get-task-status',
  displayName: 'Get Task Status',
  description: 'Gets status of task by id.',
  audience: 'both',
  aiMetadata: { description: 'Looks up the current status and result of an asynchronous SlideSpeak task (such as a presentation generation or document upload job) by its task ID. Use to poll for completion or retrieve the output of a previously started job. Read-only and idempotent.', idempotent: true },
  props: {
    taskId: Property.ShortText({
      displayName: 'Task ID',
      required: true,
    }),
  },
  async run(context) {
    const { taskId } = context.propsValue;
    const apiKey = context.auth;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: BASE_URL + `/task_status/${taskId}`,
      headers: {
        'X-API-key': apiKey.secret_text,
      },
    });

    return response.body;
  },
});
