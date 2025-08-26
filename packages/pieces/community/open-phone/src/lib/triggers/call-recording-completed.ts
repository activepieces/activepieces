import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { openPhoneAuth } from '../../index';
import {
  openPhoneCommon,
  OpenPhoneWebhookResponse,
  CreateOpenPhoneWebhookRequest,
} from '../common';
import { phoneNumberDropdown } from '../common/props';

export const callRecordingCompleted = createTrigger({
  auth: openPhoneAuth,
  name: 'call_recording_completed',
  displayName: 'Call Recording Completed',
  description:
    'Fires when a call recording finishes. Useful for post-transcription or archival workflows.',
  props: {
    phoneNumbers: phoneNumberDropdown,
  },
  sampleData: {
    event: 'call.recording.completed',
    data: {
      id: 'AC123abc',
      phoneNumberId: 'PN123abc',
      userId: 'US123abc',
      direction: 'incoming',
      status: 'completed',
      participants: ['+15555555555'],
      duration: 120,
      recordingUrl: 'https://example.com/recording.mp3',
      createdAt: '2022-01-01T00:00:00Z',
      completedAt: '2022-01-01T00:02:00Z',
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const { phoneNumbers } = context.propsValue;
    const auth = context.auth;

    const webhookRequest: CreateOpenPhoneWebhookRequest = {
      url: context.webhookUrl,
      events: ['call.recording.completed'],
      resourceIds: phoneNumbers ? [phoneNumbers as string] : ['*'],
      label: 'Activepieces Call Recording Completed Trigger',
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
    return [context.payload.body];
  },
});
