import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { promaProps } from '../common/props';
import { removeWebhookUrl, storeWebhookUrl } from '../common/data';

export const newRowAdded = createTrigger({
  name: 'new_row',
  displayName: 'Row Added',
  description: 'Triggers when a new row is added',
  props: {
    api_key: promaProps.api_key,
    // organization_id: promaProps.organization_id(true),
    workspace_id: promaProps.workspace_id(true),
    table_id: promaProps.table_id(true),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData:
  {
    "data": {
      "C3": "There ",
      "URL": "google.com",
      "Index": "9",
      "ROWID": "9417000001636645",
      "Members": []
    }
  },
  async onEnable(context) {
    const api_key = context.propsValue.api_key;
    const resp = await storeWebhookUrl({
      api_key,
      trigger_type: 'tableRowAdded',
      // organization_id: context.propsValue.organization_id || '',
      table_id: context.propsValue.table_id || '',
      webhook_url: context.webhookUrl,
    });
    await context.store?.put<{ ROWID: string }>('_new_row_trigger', {
      ROWID: resp.ROWID,
    });
  },
  async onDisable(context) {
    const api_key = context.propsValue.api_key;
    const response = await context.store?.get<{ ROWID: string }>(
      '_new_row_trigger'
    );
    if (response !== null && response !== undefined) {
      await removeWebhookUrl({ id: response.ROWID, api_key });
    }
  },
  async run(context) {
    const body = context.payload.body;
    return [body];
  },
});
