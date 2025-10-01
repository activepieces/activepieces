import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { getWrikeApiUrl, wrikeAuth } from '../common/common';
import { Property, createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';


export const newFolderTrigger = createTrigger({
  auth: wrikeAuth,
  name: 'new_folder',
  displayName: 'New Folder',
  description: 'Fires when a new folder or project is created in Wrike',
  type: TriggerStrategy.POLLING,
  props: {},
  async onEnable(context) {
    await context.store.put('lastPollTime', new Date().toISOString());
  },
  async onDisable(context) {
    await context.store.delete('lastPollTime');
  },
  async run(context) {
    const lastPollTime = await context.store.get('lastPollTime');
    const apiUrl = await getWrikeApiUrl(context.auth);
    
    const params = {
      createdDate: {
        start: lastPollTime || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${apiUrl}/folders`,
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
      url: `${apiUrl}/folders`,
      queryParams: { limit: '1' },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });
    return response.body.data || [];
  },
  sampleData: {},
});
