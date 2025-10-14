import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { openPhoneAuth } from '../../index';
import {
  openPhoneCommon,
  OpenPhoneWebhookResponse,
  CreateOpenPhoneWebhookRequest,
} from '../common';
import { phoneNumberDropdown } from '../common/props';

export const outgoingCallCompleted = createTrigger({
  auth: openPhoneAuth,
  name: 'outgoing_call_completed',
  displayName: 'Outgoing Call Completed',
  description: 'Fires when an outbound call ends. Useful for call logging.',
  props: {
    phoneNumbers: phoneNumberDropdown,
  },
  sampleData: {
    event: 'call.completed',
    data: {
      id: 'AC123abc',
      phoneNumberId: 'PN123abc',
      userId: 'US123abc',
      direction: 'outgoing',
      status: 'completed',
      participants: ['+15555555555'],
      duration: 120,
      initiatedBy: 'US123abc',
      answeredAt: '2022-01-01T00:00:30Z',
      completedAt: '2022-01-01T00:02:30Z',
      createdAt: '2022-01-01T00:00:00Z',
      updatedAt: '2022-01-01T00:02:30Z',
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const { phoneNumbers } = context.propsValue;
    const auth = context.auth;

    const webhookRequest: CreateOpenPhoneWebhookRequest = {
      url: context.webhookUrl,
      events: ['call.completed'],
      resourceIds: phoneNumbers ? [phoneNumbers as string] : ['*'],
      label: 'Activepieces Outgoing Call Completed Trigger',
      status: 'enabled',
    };

    try {
      const response: OpenPhoneWebhookResponse =
        await openPhoneCommon.makeRequest<OpenPhoneWebhookResponse>(
          HttpMethod.POST,
          '/v1/webhooks/calls',
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
        `/v1/webhooks/calls/${webhookId}`,
        auth
      );
    } catch (error) {
      throw new Error(`Failed to delete webhook: ${error}`);
    }
  },
  async run(context) {
    const payload = context.payload.body as any;
    if (payload?.data && payload.data.direction === 'outgoing') {
      return [payload];
    }
    return [];
  },
});
