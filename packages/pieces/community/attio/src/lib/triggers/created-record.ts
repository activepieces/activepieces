
import { attioAuth } from '../../';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { attioStoredWebhookId, attioWebhookResponse } from '../common/constants';
import { attioApiService } from '../common/request';
import { isNil } from '@activepieces/shared';

const CACHE_KEY = 'attio_created_record_trigger_store';

export const createdRecord = createTrigger({
  auth: attioAuth,
  name: 'createdRecord',
  displayName: 'Created Record',
  description: 'Triggered whenever a record is',
  props: {},
  sampleData: {
    webhook_id: '2af496e5-9745-4264-9506-8361a148c623',
    events: [
      {
        event_type: 'record.created',
        id: {
          workspace_id: 'f8c3ed07-325e-42d4-89ad-d830353d54c1',
          object_id: 'd9638d08-b6e4-4cb2-9a6d-093605c0cf5c',
          record_id: 'b1aa3ca8-c317-4aff-8493-4500442b2a24',
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
      'record.created'
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