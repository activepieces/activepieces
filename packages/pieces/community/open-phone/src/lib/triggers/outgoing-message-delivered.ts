import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { openPhoneAuth } from '../../index';
import {
  openPhoneCommon,
  OpenPhoneMessageWebhookResponse,
  CreateOpenPhoneMessageWebhookRequest,
} from '../common';
import { phoneNumberDropdown } from '../common/props';

export const outgoingMessageDelivered = createTrigger({
  auth: openPhoneAuth,
  name: 'outgoing_message_delivered',
  displayName: 'Outgoing Message Delivered',
  description:
    'Fires when an outbound message is delivered successfully. Useful for message confirmation workflows.',
  props: {
    phoneNumbers: phoneNumberDropdown,
  },
  sampleData: {
    event: 'message.delivered',
    data: {
      id: 'AC123abc',
      to: ['+15555555555'],
      from: '+15551234567',
      text: 'Hello, this is a test message',
      phoneNumberId: 'PN123abc',
      direction: 'outgoing',
      userId: 'US123abc',
      status: 'delivered',
      createdAt: '2022-01-01T00:00:00Z',
      updatedAt: '2022-01-01T00:00:30Z',
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const { phoneNumbers } = context.propsValue;
    const auth = context.auth;

    const webhookRequest: CreateOpenPhoneMessageWebhookRequest = {
      url: context.webhookUrl,
      events: ['message.delivered'],
      resourceIds: phoneNumbers ? [phoneNumbers as string] : ['*'],
      label: 'Activepieces Outgoing Message Delivered Trigger',
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
    return [context.payload.body];
  },
});
