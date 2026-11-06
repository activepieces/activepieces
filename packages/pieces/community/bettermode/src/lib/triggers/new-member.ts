import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { bindTokenStore } from '../common/client';
import { bettermodeAuth } from '../auth';
import { bettermodePolling, Checkpoint } from '../common/polling';
import { bettermodeSchemas } from '../common/schemas';
import { bettermodeFetchers } from './fetchers';
import { SAMPLE_MEMBER } from './samples';

export const newMemberTrigger = createTrigger({
  auth: bettermodeAuth,
  name: 'new_member',
  classification: 'READ',
  displayName: 'New Member',
  description: 'Triggers when a new member joins the community.',
  aiMetadata: {
    description: 'Fires once per newly joined community member, checked on a schedule, oldest first. Emails are only included for admin connections.',
  },
  props: {},
  type: TriggerStrategy.POLLING,
  sampleData: SAMPLE_MEMBER,
  outputSchema: bettermodeSchemas.member,
  async onEnable(context) {
    if (context.isRepublish) {
      const existing = await context.store.get<Checkpoint>(bettermodePolling.CHECKPOINT_KEY);
      if (existing !== null && existing !== undefined) {
        return;
      }
    }
    bindTokenStore({ credentials: context.auth.props, store: context.store });
    const page = await bettermodeFetchers.fetchMembersPage({
      auth: context.auth.props,
      cursor: null,
      limit: bettermodeFetchers.pageSize,
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
    const page = await bettermodeFetchers.fetchMembersPage({ auth: context.auth.props, cursor: null, limit: 5 });
    return page.items;
  },
  async run(context) {
    bindTokenStore({ credentials: context.auth.props, store: context.store });
    const checkpoint = await context.store.get<Checkpoint>(bettermodePolling.CHECKPOINT_KEY);
    if (checkpoint === null || checkpoint === undefined) {
      throw new Error('The trigger has no checkpoint yet. Disable and re-enable the trigger.');
    }
    const result = await bettermodePolling.collectNewItems({
      checkpoint,
      fetchPage: (cursor) =>
        bettermodeFetchers.fetchMembersPage({
          auth: context.auth.props,
          cursor,
          limit: bettermodeFetchers.pageSize,
        }),
    });
    if (bettermodePolling.checkpointChanged({ before: checkpoint, after: result.checkpoint })) {
      await context.store.put<Checkpoint>(bettermodePolling.CHECKPOINT_KEY, result.checkpoint);
    }
    return result.items;
  },
});
