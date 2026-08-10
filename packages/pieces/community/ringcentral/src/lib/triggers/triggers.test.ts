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
  it('covers MMS as well as SMS on the inbound text trigger', async () => {
    // A driver answering "send your POD" replies with a photo, which arrives as MMS. The type
    // parameter takes a single value, so an SMS-only filter silently never fires for those, and the
    // whole document-chase flow looks like the driver never replied.
    expect(await filtersFor(newInboundSms)).toEqual([
      '/restapi/v1.0/account/~/extension/~/message-store/instant?type=SMS',
      '/restapi/v1.0/account/~/extension/~/message-store/instant?type=MMS',
    ]);
  });

  it('keeps voicemail on its own filter, so it is not folded into the text trigger', async () => {
    expect(await filtersFor(newVoicemail)).toEqual([
      '/restapi/v1.0/account/~/extension/~/message-store/instant?type=VoiceMail',
    ]);
  });

  it('subscribes team messaging to the glip posts feed', async () => {
    expect(await filtersFor(newTeamMessage)).toEqual(['/restapi/v1.0/glip/posts']);
  });
});

describe('inbound text filtering', () => {
  it('keeps an inbound MMS', async () => {
    const store = memStore();
    await store.put('ringcentral_new_inbound_sms_subscription_id', 'sub-1');
    const result = await newInboundSms.run({
      store,
      payload: {
        headers: {},
        body: { subscriptionId: 'sub-1', body: { id: 5, direction: 'Inbound', type: 'MMS' } },
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
        body: { subscriptionId: 'sub-1', body: { id: 6, direction: 'Outbound', type: 'MMS' } },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    expect(result).toEqual([]);
  });
});
