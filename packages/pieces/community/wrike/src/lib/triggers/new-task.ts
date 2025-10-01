import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { AuthenticationType } from '@activepieces/pieces-common';
import { getWrikeApiUrl, wrikeAuth } from '../common/common';
import { Property, createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';

export const newTaskTrigger = createTrigger({
  auth: wrikeAuth,
  name: 'new_task',
  displayName: 'New Task',
  description: 'Fires when a new task is created in Wrike',
  type: TriggerStrategy.POLLING,
  props: {
    folderId: Property.ShortText({
      displayName: 'Folder ID',
      description: 'Optional: Filter tasks by folder ID',
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
      sortField: 'CreatedDate',
      sortOrder: 'Asc',
    };

    if (context.propsValue.folderId) {
      params.folderId = context.propsValue.folderId;
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

    return response.body.data || [];
  },
  async test(context) {
    const apiUrl = await getWrikeApiUrl(context.auth);
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${apiUrl}/tasks`,
      queryParams: { limit: '1', sortField: 'CreatedDate', sortOrder: 'Desc' },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });
    return response.body.data || [];
  },
  sampleData: {},
});