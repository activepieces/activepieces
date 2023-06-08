import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { promaProps } from '../common/props';
import { removeWebhookUrl, storeWebhookUrl } from '../common/data';

export const dataRowUpdated = createTrigger({
  name: 'row_updated',
  displayName: 'Data Row Updated',
  description: 'Triggers when a data row is updated',
  props: {
    api_key: promaProps.api_key,
    // organization_id: promaProps.organization_id(true),
    workspace_id: promaProps.workspace_id(true),
    table_id: promaProps.table_id(true),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    "data": {
      "C3": "There ",
      "URL": "google.com",
      "Index": "9",
      "ROWID": "9417000001636645",
      "Members": []
    },
    "updated": {
      "Index": {
        "to": "9",
        "from": "8"
      }
    }
  },
  async onEnable(context) {
    const api_key = context.propsValue.api_key;
    const resp = await storeWebhookUrl({
      api_key,
      trigger_type: 'tableRowUpdated',
      // organization_id: context.propsValue.organization_id || '',
      table_id: context.propsValue.table_id || '',
      webhook_url: context.webhookUrl,
    });
    await context.store?.put<{ ROWID: string }>('_row_updated_trigger', {
      ROWID: resp.ROWID,
    });
  },
  async onDisable(context) {
    const response = await context.store?.get<{ ROWID: string }>(
      '_row_updated_trigger'
    );
    if (response !== null && response !== undefined) {
      await removeWebhookUrl({ id: response.ROWID, api_key: context.propsValue.api_key });
    }
  },
  async run(context) {
    const body = context.payload.body;
    return [body];
  },
});
