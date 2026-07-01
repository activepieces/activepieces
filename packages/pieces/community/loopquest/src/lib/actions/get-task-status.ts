import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { loopquestAuth, baseUrl, LoopQuestAuth } from '../auth';

export const getTaskStatus = createAction({
  auth: loopquestAuth,
  name: 'get_task_status',
  displayName: 'Get Task Status',
  description: "Check a LoopQuest task's status / verdict.",
  props: {
    taskId: Property.ShortText({
      displayName: 'Task ID',
      required: true,
      description: 'The id returned by Create Review Task.',
    }),
  },
  async run(context) {
    const auth = context.auth as LoopQuestAuth;
    const res = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${baseUrl(auth)}/api/v1/tasks/${context.propsValue.taskId}`,
      headers: { authorization: `Bearer ${auth.apiKey}` },
    });
    return res.body;
  },
});
