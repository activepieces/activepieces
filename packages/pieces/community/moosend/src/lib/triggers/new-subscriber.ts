import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { moosendAuth } from '../../index';
import { moosendRequest, MoosendSubscriber } from '../common/client';

interface PollingState {
  lastSeenEmails: string[];
  lastCheckedAt: string;
}

export const newSubscriber = createTrigger({
  name: 'new_subscriber',
  displayName: 'New Subscriber',
  description: 'Triggers when a new subscriber joins a mailing list.',
  auth: moosendAuth,
  props: {
    mailingListId: Property.ShortText({
      displayName: 'Mailing List ID',
      description: 'The ID of the mailing list to monitor.',
      required: true,
    }),
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    Email: 'subscriber@example.com',
    Name: 'New Subscriber',
    SubscribeType: 1,
    SubscribeDate: '2026-04-19T00:00:00',
    Tags: '',
    CustomFields: [],
  },
  async onEnable(context) {
    await context.store.put<PollingState>('moosend_state', {
      lastSeenEmails: [],
      lastCheckedAt: new Date().toISOString(),
    });
  },
  async onDisable(context) {
    await context.store.delete('moosend_state');
  },
  async run(context) {
    const { mailingListId } = context.propsValue;
    const state = await context.store.get<PollingState>('moosend_state') ?? {
      lastSeenEmails: [],
      lastCheckedAt: new Date(0).toISOString(),
    };

    const result = await moosendRequest<{
      Context: { SubscriberCollection: { Subscribers: MoosendSubscriber[] } };
    }>(context.auth, HttpMethod.GET, `/subscribers/${mailingListId}/members.json`);

    const members = result?.Context?.SubscriberCollection?.Subscribers ?? [];
    const newMembers = members.filter((m) => !state.lastSeenEmails.includes(m.Email));

    if (newMembers.length > 0) {
      await context.store.put<PollingState>('moosend_state', {
        lastSeenEmails: members.map((m) => m.Email),
        lastCheckedAt: new Date().toISOString(),
      });
    }

    return newMembers;
  },
  async test(context) {
    const { mailingListId } = context.propsValue;
    const result = await moosendRequest<{
      Context: { SubscriberCollection: { Subscribers: MoosendSubscriber[] } };
    }>(context.auth, HttpMethod.GET, `/subscribers/${mailingListId}/members.json`);
    return result?.Context?.SubscriberCollection?.Subscribers?.slice(0, 3) ?? [];
  },
});
