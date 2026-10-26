import { isNil, Store } from '@activepieces/pieces-framework';
import { makeClient } from '.';
import { FormValue } from './client';
import { flowluPolling, PollSource } from './polling';

export function flowluPollingHooks({
  source,
  filters,
}: {
  source: PollSource;
  filters: (propsValue: Record<string, unknown>) => Record<string, FormValue>;
}) {
  return {
    async onEnable(context: HookContext): Promise<void> {
      const checkpoint = await flowluPolling.latestId({
        client: makeClient(context.auth),
        source,
      });
      if (
        context.isRepublish &&
        !isNil(await context.store.get(flowluPolling.storeKey))
      ) {
        return;
      }
      await context.store.put(flowluPolling.storeKey, checkpoint);
    },
    async onDisable(context: HookContext): Promise<void> {
      if (context.isRepublish) {
        return;
      }
      await context.store.delete(flowluPolling.storeKey);
    },
    async test(context: HookContext): Promise<unknown[]> {
      return flowluPolling.latest({
        client: makeClient(context.auth),
        source,
        filters: filters(context.propsValue),
      });
    },
    async run(context: HookContext): Promise<unknown[]> {
      const client = makeClient(context.auth);
      const stored = await context.store.get<number>(flowluPolling.storeKey);
      if (typeof stored !== 'number') {
        const checkpoint = await flowluPolling.latestId({ client, source });
        await context.store.put(flowluPolling.storeKey, checkpoint);
        return [];
      }
      const result = await flowluPolling.newSince({
        client,
        source,
        filters: filters(context.propsValue),
        checkpoint: stored,
      });
      if (result.checkpoint !== stored) {
        await context.store.put(flowluPolling.storeKey, result.checkpoint);
      }
      return result.items;
    },
  };
}

type HookContext = {
  auth: Parameters<typeof makeClient>[0];
  propsValue: Record<string, unknown>;
  store: Store;
  isRepublish?: boolean;
};
