import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { promaProps } from '../common/props';
import { removeWebhookUrl, storeWebhookUrl } from '../common/data';
import { promaAuth } from '../..';

export const buttonTrigger = createTrigger({
  name: 'button_triggered',
  displayName: 'Button Clicked',
  description: 'Triggers when a button data type is clicked',
  auth: promaAuth,
  props: {
    workspace_id: promaProps.workspace_id(true),
    table_id: promaProps.table_id(true),
    column_id: promaProps.column_id(true, 'Button Column', 'button'),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    data: {
      C3: 'There ',
      URL: 'google.com',
      Index: '9',
      ROWID: '9417000001636645',
      Members: [],
    },
  },
  async onEnable(context) {
    const api_key = context.auth;
    const resp = await storeWebhookUrl({
      api_key,
      trigger_type: 'buttonClicked',
      table_id: context.propsValue.table_id || '',
      webhook_url: context.webhookUrl,
      column_id: context.propsValue.column_id,
    });
    await context.store?.put<{ ROWID: string }>('_button_trigger', {
      ROWID: resp.ROWID,
    });
  },
  async onDisable(context) {
    const api_key = context.auth;
    const response = await context.store?.get<{ ROWID: string }>(
      '_button_trigger'
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
