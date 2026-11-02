import { HttpMethod } from '@activepieces/pieces-common';
import { Property, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatProps } from '../common/props';
import { heartbeatWebhooks } from '../common/webhooks';
import { heartbeatOutputSchemas } from '../common/output-schemas';
import { heartbeatSamples } from '../common/samples';

export const newThreadTrigger = createTrigger({
  auth: heartbeatAuth,
  name: 'heartbeat_new_thread',
  displayName: 'New Thread',
  description: 'Fires when a new thread is posted, in any channel or one channel.',
  classification: 'READ',
  aiMetadata: {
    description: 'Fires once when a thread is posted in a posts channel (any channel, or only the chosen one) and returns the thread with content, author ID, channel ID and link, re-read from Heartbeat.',
  },
  props: {
    channelId: heartbeatProps.id({ displayName: 'Channel ID', description: 'Only threads in this posts channel. Leave empty for all channels. Use List Channels to find the ID.', required: false }),
    includeMovedThreads: Property.Checkbox({
      displayName: 'Include Threads Moved Into the Channel',
      description: 'Also fire when an existing thread is moved into the chosen channel.',
      required: false,
      defaultValue: false,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: heartbeatSamples.thread,
  outputSchema: heartbeatOutputSchemas.thread,
  async onEnable(context) {
    const channelId = heartbeatApi.optionalUuid({ value: context.propsValue.channelId, label: 'Channel ID' });
    if (channelId === undefined && context.propsValue.includeMovedThreads === true) {
      throw new Error('Include Threads Moved Into the Channel needs a Channel ID.');
    }
    await heartbeatWebhooks.enable({
      token: context.auth.secret_text,
      store: context.store,
      webhookUrl: context.webhookUrl,
      action: channelId === undefined
        ? { name: 'THREAD_CREATE' }
        : { name: 'THREAD_CREATE', filter: { channelID: channelId, triggerOnMove: context.propsValue.includeMovedThreads === true } },
    });
  },
  async onDisable(context) {
    await heartbeatWebhooks.disable({ token: context.auth.secret_text, store: context.store });
  },
  async test(context) {
    const token = context.auth.secret_text;
    const channelId = heartbeatApi.optionalUuid({ value: context.propsValue.channelId, label: 'Channel ID' });
    const channelIds = channelId !== undefined
      ? [channelId]
      : heartbeatApi
        .recordList(await heartbeatApi.request<unknown>({ token, method: HttpMethod.GET, path: '/channels', operation: 'list channels' }))
        .filter((channel) => channel['type'] === 'POSTS' && typeof channel['id'] === 'string')
        .map((channel) => String(channel['id']))
        .slice(0, MAX_TEST_CHANNELS);
    for (const id of channelIds) {
      const threads = heartbeatApi.recordList(
        await heartbeatApi.request<unknown>({ token, method: HttpMethod.GET, path: `/channels/${id}/threads`, operation: 'list threads', query: { limit: 5 } }),
      );
      if (threads.length > 0) {
        return threads;
      }
    }
    return [];
  },
  async run(context) {
    const payload = heartbeatWebhooks.payloadOf(context.payload.body);
    const threadId = heartbeatWebhooks.uuidOrNull(payload['id']);
    if (threadId === null) {
      return [];
    }
    const thread = await heartbeatWebhooks.fetchOrNull(() =>
      heartbeatApi.request<Record<string, unknown>>({ token: context.auth.secret_text, method: HttpMethod.GET, path: `/threads/${threadId}`, operation: 'get thread' }),
    );
    if (thread === null) {
      return [];
    }
    const key = `THREAD_CREATE:${threadId}:${String(thread['channelID'] ?? '')}`;
    if (!(await heartbeatWebhooks.isFirstDelivery({ store: context.store, key }))) {
      return [];
    }
    return [thread];
  },
});

const MAX_TEST_CHANNELS = 10;
