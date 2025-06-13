
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { attioStoredWebhookId, attioWebhookResponse } from '../common/constants';
import { attioApiService } from '../common/request';
import { attioAuth } from '../../';
import { isNil } from '@activepieces/shared';

const CACHE_KEY = 'attio_updated_record_trigger_store';

export const updatedRecord = createTrigger({
  auth: attioAuth,
  name: 'updatedRecord',
  displayName: 'Updated Record',
  description: 'Triggered whenever a record is updated in attio',
  props: {},
  sampleData: {
    webhook_id: 'd63b5bcd-bd9e-4d39-828b-0eb896954f86',
    events: [
      {
        event_type: 'record.updated',
        id: {
          workspace_id: 'f8c3ed07-325e-42d4-89ad-d830353d54c1',
          object_id: 'd9638d08-b6e4-4cb2-9a6d-093605c0cf5c',
          record_id: 'b1aa3ca8-c317-4aff-8493-4500442b2a24',
          attribute_id: '09b83ceb-dc4f-4d14-be9e-cfaf94fde485',
        },
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
      'record.updated'
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