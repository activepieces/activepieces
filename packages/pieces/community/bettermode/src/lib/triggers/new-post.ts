import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { bindTokenStore } from '../common/client';
import { bettermodeAuth } from '../auth';
import { bettermodePolling, Checkpoint } from '../common/polling';
import { bettermodeSchemas } from '../common/schemas';
import { bettermodeFetchers } from './fetchers';
import { SAMPLE_POST } from './samples';

export const newPostTrigger = createTrigger({
  auth: bettermodeAuth,
  name: 'new_post',
  classification: 'READ',
  displayName: 'New Post',
  description: 'Triggers when a new post is published, optionally only in some spaces.',
  aiMetadata: {
    description:
      'Fires once per new top-level post (checked on a schedule), oldest first, optionally only in the given spaces. Replies do not fire this trigger; use New Reply.',
  },
  props: {
    space_ids: Property.Array({
      displayName: 'Space IDs',
      description: 'Only watch these spaces. Leave empty for all spaces the connected member can see.',
      required: false,
    }),
  },
  type: TriggerStrategy.POLLING,
  sampleData: SAMPLE_POST,
  outputSchema: bettermodeSchemas.post,
  async onEnable(context) {
    if (context.isRepublish) {
      const existing = await context.store.get<Checkpoint>(bettermodePolling.CHECKPOINT_KEY);
      if (existing !== null && existing !== undefined) {
        return;
      }
    }
    bindTokenStore({ credentials: context.auth.props, store: context.store });
    const page = await bettermodeFetchers.fetchPostsPage({
      auth: context.auth.props,
      spaceIds: bettermodeFetchers.spaceFilter(context.propsValue.space_ids),
      postTypeIds: [],
      cursor: null,
      limit: bettermodeFetchers.pageSize,
    });
    await context.store.put<Checkpoint>(
      bettermodePolling.CHECKPOINT_KEY,
      bettermodePolling.newestCheckpoint({ items: page.items, fallback: new Date().toISOString(), timeField: 'published_at' })
    );
  },
  async onDisable() {
    return;
  },
  async test(context) {
    bindTokenStore({ credentials: context.auth.props, store: context.store });
    const page = await bettermodeFetchers.fetchPostsPage({
      auth: context.auth.props,
      spaceIds: bettermodeFetchers.spaceFilter(context.propsValue.space_ids),
      postTypeIds: [],
      cursor: null,
      limit: 5,
    });
    return page.items;
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
      fetchPage: (cursor) =>
        bettermodeFetchers.fetchPostsPage({
          auth: context.auth.props,
          spaceIds,
          postTypeIds: [],
          cursor,
          limit: bettermodeFetchers.pageSize,
        }),
      timeField: 'published_at',
    });
    if (bettermodePolling.checkpointChanged({ before: checkpoint, after: result.checkpoint })) {
      await context.store.put<Checkpoint>(bettermodePolling.CHECKPOINT_KEY, result.checkpoint);
    }
    return result.items;
  },
});
