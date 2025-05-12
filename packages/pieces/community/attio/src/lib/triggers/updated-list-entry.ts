
import { attioAuth } from '../../';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { attioStoredWebhookId, attioWebhookResponse } from '../common/constants';
import { attioApiService } from '../common/request';
import { isNil } from '@activepieces/shared';

const CACHE_KEY = 'attio_updated_list_entry_trigger_store';

export const updatedListEntry = createTrigger({
  auth: attioAuth,
  name: 'updatedListEntry',
  displayName: 'Updated List Entry',
  description: 'Triggers when an entry is updated	in attio',
  props: {},
  sampleData: {
    webhook_id: '5df9f1ce-26cc-4e03-aa7a-315edcfad0a7',
    events: [
      {
        event_type: 'list-entry.updated',
        id: {
          workspace_id: 'f8c3ed07-325e-42d4-89ad-d830353d54c1',
          list_id: '173553cd-15b3-4855-8e73-6e7a85845c1a',
          entry_id: '3caa974e-af38-49f7-a531-785f250044fe',
          attribute_id: 'd78ff554-57bc-4cf0-92b5-9cb85a308ce1',
        },
        parent_object_id: 'd9638d08-b6e4-4cb2-9a6d-093605c0cf5c',
        parent_record_id: 'df8c20b1-170c-4a9e-8a84-cdc99f7ec0f3',
        actor: {
          type: 'workspace-member',
          id: 'c3ddb065-2249-45e1-80d5-03491066b6e3',
        },
      },
    ],
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const response = (await attioApiService.createWebhook(
      context.auth,
      context.webhookUrl,
      'list-entry.updated'
    )) as attioWebhookResponse;

    await context.store.put<attioStoredWebhookId>(CACHE_KEY, {
      webhookId: response.id.webhook_id,
    });
  },
  async onDisable(context) {
    const webhook = await context.store.get<attioStoredWebhookId>(CACHE_KEY);
    if (!isNil(webhook) && !isNil(webhook.webhookId)) {
      await attioApiService.deleteWebhook(context.auth, webhook.webhookId);
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});