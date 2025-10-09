import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { openPhoneAuth } from '../../index';
import {
  openPhoneCommon,
  OpenPhoneMessageWebhookResponse,
  CreateOpenPhoneMessageWebhookRequest,
} from '../common';
import { phoneNumberDropdown } from '../common/props';

export const incomingMessageReceived = createTrigger({
  auth: openPhoneAuth,
  name: 'incoming_message_received',
  displayName: 'Incoming Message Received',
  description: 'Fires when a new SMS/MMS message is received.',
  props: {
    phoneNumbers: phoneNumberDropdown,
  },
  sampleData: {
    event: 'message.received',
    data: {
      id: 'AC123abc',
      to: ['+15551234567'],
      from: '+15555555555',
      text: 'Hello, this is an incoming message',
      phoneNumberId: 'PN123abc',
      direction: 'incoming',
      userId: 'US123abc',
      status: 'received',
      createdAt: '2022-01-01T00:00:00Z',
      updatedAt: '2022-01-01T00:00:00Z',
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const { phoneNumbers } = context.propsValue;
    const auth = context.auth;

    const webhookRequest: CreateOpenPhoneMessageWebhookRequest = {
      url: context.webhookUrl,
      events: ['message.received'],
      resourceIds: phoneNumbers ? [phoneNumbers as string] : ['*'],
      label: 'Activepieces Incoming Message Received Trigger',
      status: 'enabled',
    };

    try {
      const response: OpenPhoneMessageWebhookResponse =
        await openPhoneCommon.makeRequest<OpenPhoneMessageWebhookResponse>(
          HttpMethod.POST,
          '/v1/webhooks/messages',
          auth,
          webhookRequest
        );

      await context.store.put('webhookId', response.data.id);
    } catch (error) {
      throw new Error(`Failed to create webhook: ${error}`);
    }
  },
  async onDisable(context) {
    const auth = context.auth;
    const webhookId = await context.store.get('webhookId');

    if (!webhookId) {
      return;
    }

    try {
      await openPhoneCommon.makeRequest(
        HttpMethod.DELETE,
        `/v1/webhooks/messages/${webhookId}`,
        auth
      );
    } catch (error) {
      throw new Error(`Failed to delete webhook: ${error}`);
    }
  },
  async run(context) {
    const payload = context.payload.body as any;
    if (payload?.data && payload.data.direction === 'incoming') {
      return [payload];
    }
    return [];
  },
});
