import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { bindTokenStore } from '../common/client';
import { bettermodeAuth } from '../auth';
import { bettermodePolling, Checkpoint } from '../common/polling';
import { bettermodeSchemas } from '../common/schemas';
import { bettermodeFetchers } from './fetchers';
import { SAMPLE_REPLY } from './samples';

export const newReplyTrigger = createTrigger({
  auth: bettermodeAuth,
  name: 'new_reply',
  classification: 'READ',
  displayName: 'New Reply',
  description: 'Triggers when someone replies to a post (comments and answers).',
  aiMetadata: {
    description:
      'Fires once per new reply (comment or answer) on a post, checked on a schedule, oldest first, optionally only in the given spaces. Each check looks at the 25 most recently active posts and their 20 newest direct replies. Replied To Post ID holds the parent post.',
  },
  props: {
    space_ids: Property.Array({
      displayName: 'Space IDs',
      description: 'Only watch replies in these spaces. Leave empty for all spaces.',
      required: false,
    }),
  },
  type: TriggerStrategy.POLLING,
  sampleData: SAMPLE_REPLY,
  outputSchema: bettermodeSchemas.post,
  async onEnable(context) {
    if (context.isRepublish) {
      const existing = await context.store.get<Checkpoint>(bettermodePolling.CHECKPOINT_KEY);
      if (existing !== null && existing !== undefined) {
        return;
      }
    }
    bindTokenStore({ credentials: context.auth.props, store: context.store });
    const page = await bettermodeFetchers.fetchRecentReplies({
      auth: context.auth.props,
      spaceIds: bettermodeFetchers.spaceFilter(context.propsValue.space_ids),
    });
    await context.store.put<Checkpoint>(
      bettermodePolling.CHECKPOINT_KEY,
      bettermodePolling.newestCheckpoint({ items: page.items, fallback: new Date().toISOString() })
    );
  },
  async onDisable() {
    return;
  },
  async test(context) {
    bindTokenStore({ credentials: context.auth.props, store: context.store });
    const page = await bettermodeFetchers.fetchRecentReplies({
      auth: context.auth.props,
      spaceIds: bettermodeFetchers.spaceFilter(context.propsValue.space_ids),
    });
    return page.items.slice(0, 5);
  },
  async run(context) {
    bindTokenStore({ credentials: context.auth.props, store: context.store });
    const checkpoint = await context.store.get<Checkpoint>(bettermodePolling.CHECKPOINT_KEY);
    if (checkpoint === null || checkpoint === undefined) {
      throw new Error('The trigger has no checkpoint yet. Disable and re-enable the trigger.');
    }
    const spaceIds = bettermodeFetchers.spaceFilter(context.propsValue.space_ids);
    const result = await bettermodePolling.collectNewItems({
      checkpoint,
      fetchPage: () => bettermodeFetchers.fetchRecentReplies({ auth: context.auth.props, spaceIds }),
    });
    if (bettermodePolling.checkpointChanged({ before: checkpoint, after: result.checkpoint })) {
      await context.store.put<Checkpoint>(bettermodePolling.CHECKPOINT_KEY, result.checkpoint);
    }
    return result.items;
  },
});
