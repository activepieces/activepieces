import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wavixAuth } from '../common/auth';
import { numberDropdown } from '../common/props';
import { wavixWebhook } from '../common/webhook';

export const newInboundSms = createTrigger({
  auth: wavixAuth,
  name: 'new_inbound_sms',
  classification: 'READ',
  displayName: 'New Inbound SMS',
  description:
    'Fires when the selected Wavix number receives an SMS. A number relays inbound SMS to a single destination, so this trigger will not start if the number already has an SMS webhook set — clear it in Wavix first.',
  aiMetadata: {
    description:
      'Fires when an inbound SMS arrives on the selected Wavix number. The payload includes the message id, sender, recipient and text.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {
    number: numberDropdown,
  },
  async onEnable(context) {
    await wavixWebhook.claim({
      request: {
        apiKey: context.auth.secret_text,
        method: HttpMethod.PATCH,
        resourcePath: `/v1/numbers/${context.propsValue.number}`,
        body: { sms_relay_url: context.webhookUrl, expected_sms_relay_url: '' },
      },
      inUseMessage:
        'This Wavix number already has an SMS webhook set. A number can relay inbound SMS to only one destination — clear the SMS webhook in Wavix before enabling this trigger.',
    });
  },
  async onDisable(context) {
    await wavixWebhook.release({
      request: {
        apiKey: context.auth.secret_text,
        method: HttpMethod.PATCH,
        resourcePath: `/v1/numbers/${context.propsValue.number}`,
        body: {
          sms_relay_url: null,
          expected_sms_relay_url: context.webhookUrl,
        },
      },
      failureMessage:
        'Could not clear the SMS webhook on this Wavix number. Clear it manually in Wavix so the number can be reused.',
    });
  },
  async run(context) {
    return [context.payload.body];
  },
  sampleData: {
    message_id: '00000000-0000-0000-0000-000000000000',
    from: '+15555550100',
    to: '+15555550101',
    message_body: {
      text: 'Hi there, this is a sample message',
    },
    received_at: '2022-04-14T13:51:16.096Z',
  },
});
