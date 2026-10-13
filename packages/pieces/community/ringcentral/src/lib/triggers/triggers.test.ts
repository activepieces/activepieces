import { afterEach, describe, expect, it, vi } from 'vitest';

import { memStore, oauth, stubHttp } from '../common/test-support/http-stub';
import { newInboundSms } from './new-inbound-sms';
import { newTeamMessage } from './new-team-message';
import { newVoicemail } from './new-voicemail';

afterEach(() => vi.restoreAllMocks());

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ctx = (): any => ({
  auth: oauth(),
  store: memStore(),
  webhookUrl: 'https://example.com/webhook/abc',
  payload: { headers: {}, body: {} },
});

/** The event filters a trigger actually asks RingCentral to subscribe to. */
async function filtersFor(trigger: { onEnable: (c: unknown) => Promise<unknown> }) {
  const stub = stubHttp();
  stub.route('/subscription', { id: 'sub-1' });
  await trigger.onEnable(ctx());
  return (stub.find('/subscription')?.body as { eventFilters?: string[] })?.eventFilters;
}

describe('subscribed event filters', () => {
  it('subscribes the inbound text trigger to type=SMS only, which already covers MMS', async () => {
    // Guards against "widening" this to type=MMS. There is no MMS message type: RingCentral delivers
    // an inbound picture message through this same filter with type: 'SMS' plus an MmsAttachment
    // part, and an unrecognised type can fail createSubscription outright, breaking the trigger
    // rather than widening it.
    // https://developers.ringcentral.com/guide/messaging/sms/receiving-sms-mms
    expect(await filtersFor(newInboundSms)).toEqual([
      '/restapi/v1.0/account/~/extension/~/message-store/instant?type=SMS',
    ]);
  });

  it('subscribes voicemail to its own dedicated filter, not message-store/instant', async () => {
    // message-store/instant is documented for inbound SMS only, so ?type=VoiceMail either fails
    // validation on enable or enables and never delivers.
    // https://developers.ringcentral.com/guide/notifications/event-filters/voicemail-message
    expect(await filtersFor(newVoicemail)).toEqual([
      '/restapi/v1.0/account/~/extension/~/voicemail',
    ]);
  });

  it('subscribes team messaging to the glip posts feed', async () => {
    expect(await filtersFor(newTeamMessage)).toEqual(['/restapi/v1.0/glip/posts']);
  });
});

describe('inbound text filtering', () => {
  it('keeps an inbound picture message, which arrives as type SMS with an MmsAttachment', async () => {
    const store = memStore();
    await store.put('ringcentral_new_inbound_sms_subscription_id', 'sub-1');
    const result = await newInboundSms.run({
      store,
      payload: {
        headers: {},
        body: {
          subscriptionId: 'sub-1',
          body: {
            id: 5,
            direction: 'Inbound',
            type: 'SMS',
            attachments: [{ id: 222, type: 'MmsAttachment', contentType: 'image/jpeg' }],
          },
        },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    expect(result).toHaveLength(1);
  });

  it('drops what this extension sent itself', async () => {
    const store = memStore();
    await store.put('ringcentral_new_inbound_sms_subscription_id', 'sub-1');
    const result = await newInboundSms.run({
      store,
      payload: {
        headers: {},
        body: { subscriptionId: 'sub-1', body: { id: 6, direction: 'Outbound', type: 'SMS' } },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    expect(result).toEqual([]);
  });
});
