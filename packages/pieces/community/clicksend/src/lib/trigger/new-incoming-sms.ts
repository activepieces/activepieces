import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callClickSendApi } from '../common';
import { clicksendAuth } from '../..';
import { isNil } from '@activepieces/shared';

const TRIGGER_KEY = 'new_incoming_sms_trigger';

export const clicksendNewIncomingSms = createTrigger({
  auth: clicksendAuth,
  name: 'new_incoming_sms',
  displayName: 'New Incoming SMS',
  description: 'Triggers when a new SMS message is received.',
  props: {},

  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const username = context.auth.username;
    const password = context.auth.password;

    const response = await callClickSendApi<{
      data: { inbound_rule_id: number };
    }>({
      method: HttpMethod.POST,
      username,
      password,
      path: '/automations/sms/inbound',
      body: {
        dedicated_number: '*',
        rule_name: 'AP Incoming SMS',
        message_search_type: 0,
        message_search_term: null,
        action: 'URL',
        action_address: context.webhookUrl,
        enabled: 1,
        webhook_type: 'json',
      },
    });

    await context.store.put<number>(
      TRIGGER_KEY,
      response.body.data.inbound_rule_id
    );
  },
  async onDisable(context) {
    const username = context.auth.username;
    const password = context.auth.password;
    const webhookId = await context.store.get<number>(TRIGGER_KEY);

    if (!isNil(webhookId)) {
      await callClickSendApi({
        method: HttpMethod.DELETE,
        username,
        password,
        path: `/automations/sms/inbound/${webhookId}`,
      });
    }
  },
  async run(context) {
    return [context.payload.body];
  },
  sampleData: {
    message_id: '12345678',
    status: 'RECEIVED',
    message_timestamp: 1644321600,
    message_time: '2022-02-08 01:00:00',
    message_to: '+1234567890',
    message_from: '+0987654321',
    message_body: 'Hello from ClickSend!',
    message_direction: 'in',
    message_type: 'sms',
    message_parts: 1,
    message_cost: '0.0250',
    from_email: null,
    list_id: null,
    custom_string: null,
    contact_id: null,
    user_id: 12345,
    subaccount_id: null,
    country: 'US',
    carrier: 'Verizon',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
  },
});
