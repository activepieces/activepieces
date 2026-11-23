import { Property } from '@activepieces/pieces-framework';
import { wrikeAuth } from '../common/auth';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { wrikeWebhook } from '../common/webhook';

export const newFolder = createTrigger({
  name: 'new_folder',
  displayName: 'New Folder',
  description: 'Fires when a new folder (or project) is created in Wrike.',
  aiMetadata: {
    description: 'Fires when a new folder or project is created in Wrike, registered via a webhook on the FolderCreated event; can be scoped to a single parent folder so it only fires for folders created underneath it.',
  },
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
    const webhookId = await wrikeWebhook.register({
      auth: context.auth,
      webhookUrl: context.webhookUrl,
      eventType: 'FolderCreated',
      folderId: context.propsValue.parentFolderId || undefined,
    });
    await context.store.put('webhook_id', webhookId);
  },

  onDisable: async (context) => {
    const webhookId = await context.store.get<string>('webhook_id');
    if (webhookId) {
      await wrikeWebhook.unregister({ auth: context.auth, webhookId });
      await context.store.delete('webhook_id');
    }
  },

  run: async (context) => {
    return wrikeWebhook.eventsOfType({
      body: context.payload.body,
      eventType: 'FolderCreated',
    });
  },
});
