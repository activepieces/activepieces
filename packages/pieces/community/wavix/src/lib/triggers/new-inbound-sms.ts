import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wavixAuth } from '../common/auth';
import { wavixApiCall } from '../common/client';
import { numberDropdown } from '../common/props';
import { claimWebhookSlot, smsEnableLockKey } from '../common/enable-lock';

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
    const numberId = context.propsValue.number;
    await claimWebhookSlot({
      store: context.store,
      key: smsEnableLockKey(numberId),
      webhookUrl: context.webhookUrl,
      occupiedMessage:
        'This Wavix number already has an SMS webhook set. A number can relay inbound SMS to only one destination — clear the SMS webhook in Wavix before enabling this trigger.',
      getCurrentUrl: async () => {
        const current = await wavixApiCall<{ sms_relay_url?: string | null }>({
          apiKey: context.auth.secret_text,
          method: HttpMethod.GET,
          resourcePath: `/v1/numbers/${numberId}`,
        });
        return current.sms_relay_url;
      },
      register: () =>
        wavixApiCall({
          apiKey: context.auth.secret_text,
          method: HttpMethod.PATCH,
          resourcePath: `/v1/numbers/${numberId}`,
          body: { sms_relay_url: context.webhookUrl },
        }),
    });
  },
  async onDisable(context) {
    const numberId = context.propsValue.number;
    try {
      const current = await wavixApiCall<{ sms_relay_url?: string | null }>({
        apiKey: context.auth.secret_text,
        method: HttpMethod.GET,
        resourcePath: `/v1/numbers/${numberId}`,
      });
      if (current.sms_relay_url !== context.webhookUrl) {
        return;
      }
      await wavixApiCall({
        apiKey: context.auth.secret_text,
        method: HttpMethod.PATCH,
        resourcePath: '/v1/numbers',
        body: { ids: [numberId], sms_relay_url: null },
      });
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      throw new Error(
        `Could not clear the SMS webhook on this Wavix number. Clear it manually in Wavix so the number can be reused. (${detail})`
      );
    }
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
