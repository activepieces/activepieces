import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { getWrikeApiUrl, wrikeAuth } from '../common/common';
import { Property, createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';


export const newSubtaskTrigger = createTrigger({
  auth: wrikeAuth,
  name: 'new_subtask',
  displayName: 'New Subtask Created',
  description: 'Triggers when a subtask is created',
  type: TriggerStrategy.POLLING,
  props: {
    parentTaskId: Property.ShortText({
      displayName: 'Parent Task ID',
      description: 'Optional: Filter subtasks by parent task ID',
      required: false,
    }),
  },
  async onEnable(context) {
    await context.store.put('lastPollTime', new Date().toISOString());
  },
  async onDisable(context) {
    await context.store.delete('lastPollTime');
  },
  async run(context) {
    const lastPollTime = await context.store.get('lastPollTime');
    const apiUrl = await getWrikeApiUrl(context.auth);
    
    const params: any = {
      createdDate: {
        start: lastPollTime || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
      subTasks: true,
    };

    if (context.propsValue.parentTaskId) {
      params.parentId = context.propsValue.parentTaskId;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${apiUrl}/tasks`,
      queryParams: params,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    await context.store.put('lastPollTime', new Date().toISOString());

    return (response.body.data || []).filter((task: any) => task.superTaskIds && task.superTaskIds.length > 0);
  },
  async test(context) {
    const apiUrl = await getWrikeApiUrl(context.auth);
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${apiUrl}/tasks`,
      queryParams: { subTasks: 'true', limit: '1' },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });
    return (response.body.data || []).filter((task: any) => task.superTaskIds && task.superTaskIds.length > 0);
  },
  sampleData: {},
});