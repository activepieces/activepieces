import { Property } from '@activepieces/pieces-framework';
import { wrikeAuth } from '../common/auth';
import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import {
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { wrikeCommon } from '../common/client';

export const newFolder = createTrigger({
  name: 'new_folder',
  displayName: 'New Folder',
  description: 'Fires when a new folder (or project) is created in Wrike.',
  auth: wrikeAuth,
  type: TriggerStrategy.WEBHOOK,
  props: {
    parentFolderId: Property.ShortText({
      displayName: 'Parent Folder ID',
      description: 'Optional: Only trigger for folders created in this specific parent folder',
      required: false,
    }),
  },
  sampleData: {
    id: 'IEAAAAAQKQ',
    title: 'Sample Folder',
    description: 'This is a sample folder description',
    createdDate: '2024-01-15T10:00:00Z',
    updatedDate: '2024-01-15T10:00:00Z',
    scope: 'WsWorkspace',
    childIds: [],
    parentIds: ['IEAAAAAQKQ'],
    project: null,
  },

  onEnable: async (context) => {
    const webhookUrl = context.webhookUrl;
    const { parentFolderId } = context.propsValue;

    const webhookData: Record<string, any> = {
      hookUrl: webhookUrl,
      hookEvents: ['folder_created'],
      hookName: `ActivePieces New Folder Webhook${parentFolderId ? ` - Parent ${parentFolderId}` : ''}`,
    };

    if (parentFolderId) {
      webhookData['folderId'] = parentFolderId;
    }

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${wrikeCommon.baseUrl}/webhooks`,
      body: webhookData,
      headers: {
        Authorization: `Bearer ${context.auth.access_token}`,
        'Content-Type': 'application/json',
      },
    };

    const { status, body } = await httpClient.sendRequest(request);
    if (status !== 200) {
      throw new Error(`Failed to register webhook. Status: ${status}, Body: ${JSON.stringify(body)}`);
    }

    await context.store.put('webhook_id', body.data[0].id);
  },

  onDisable: async (context) => {
    const webhookId = await context.store.get('webhook_id');

    if (webhookId) {
      const request: HttpRequest = {
        method: HttpMethod.DELETE,
        url: `${wrikeCommon.baseUrl}/webhooks/${webhookId}`,
        headers: {
          Authorization: `Bearer ${context.auth.access_token}`,
        },
      };

      try {
        await httpClient.sendRequest(request);
        await context.store.delete('webhook_id');
      } catch (error) {
        console.warn('Failed to unregister webhook:', error);
      }
    }
  },

  run: async (context) => {
    const payload = context.payload.body as any;

    if (payload && payload.folderId) {
      try {
        const folderDetails = await wrikeCommon.apiCall({
          auth: context.auth,
          method: HttpMethod.GET,
          resourceUri: `/folders/${payload.folderId}`,
        });

        return [folderDetails.body.data[0]];
      } catch (error) {
        console.warn('Failed to fetch folder details:', error);
        return [payload];
      }
    }

    return [payload];
  },
});
