import { Property } from '@activepieces/pieces-framework';
import { wrikeAuth } from '../common/auth';
import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
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
      description:
        'Optional: Only trigger for folders created in this specific parent folder',
      required: false,
    }),
  },
  sampleData: {
    folderId: 'IEAAABDMI4AB5FML',
    webhookId: 'IEAAABDMJAAAABA7',
    eventAuthorId: 'KUAAABLG',
    eventType: 'FolderCreated',
    lastUpdatedDate: '2024-09-05T07:49:34Z',
  },

  onEnable: async (context) => {
    const webhookUrl = context.webhookUrl;
    const { parentFolderId } = context.propsValue;

    const webhookData: Record<string, any> = {
      hookUrl: webhookUrl,
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
      throw new Error(
        `Failed to register webhook. Status: ${status}, Body: ${JSON.stringify(
          body
        )}`
      );
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

    if (payload && payload.eventType === 'FolderCreated') {
      return payload;
    }

    return [];
  },
});
