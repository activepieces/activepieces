import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wavixAuth } from '../common/auth';
import { wavixApiCall } from '../common/client';
import { numberDropdown } from '../common/props';

const STORE_KEY = 'previous_sms_relay_url';

export const newInboundSms = createTrigger({
  auth: wavixAuth,
  name: 'new_inbound_sms',
  classification: 'READ',
  displayName: 'New Inbound SMS',
  description: 'Fires when the selected Wavix number receives an SMS.',
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
    // Capture the original relay URL once (empty = none) so disable can restore it.
    const alreadyStored = await context.store.get<string>(STORE_KEY);
    if (alreadyStored === null) {
      const current = await wavixApiCall<{ sms_relay_url?: string | null }>({
        apiKey: context.auth.secret_text,
        method: HttpMethod.GET,
        resourcePath: `/v1/numbers/${numberId}`,
      });
      await context.store.put<string>(STORE_KEY, current.sms_relay_url ?? '');
    }
    await wavixApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.PATCH,
      resourcePath: `/v1/numbers/${numberId}`,
      body: { sms_relay_url: context.webhookUrl },
    });
  },
  async onDisable(context) {
    const numberId = context.propsValue.number;
    // Not captured => onEnable never registered; leave the number alone.
    const previous = await context.store.get<string>(STORE_KEY);
    if (previous === null) {
      return;
    }
    try {
      await wavixApiCall({
        apiKey: context.auth.secret_text,
        method: HttpMethod.PATCH,
        resourcePath: '/v1/numbers',
        body: { ids: [numberId], sms_relay_url: previous || null },
      });
      await context.store.delete(STORE_KEY);
    } catch {
      // Best-effort cleanup: keep STORE_KEY so a later retry can restore.
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
