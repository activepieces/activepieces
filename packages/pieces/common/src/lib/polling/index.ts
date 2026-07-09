import { AppConnectionValueForAuthProperty, FilesService, ServerContext, Store } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/core-utils';


interface TimebasedPolling<AuthValue, PropsValue> {
  strategy: DedupeStrategy.TIMEBASED;
  items: (params: {
    auth: AuthValue;
    store: Store;
    propsValue: PropsValue;
    lastFetchEpochMS: number;
    server?: ServerContext;
  }) => Promise<
    {
      epochMilliSeconds: number;
      data: unknown;
    }[]
  >;
}

interface LastItemPolling<AuthValue extends AppConnectionValueForAuthProperty<any>, PropsValue> {
  strategy: DedupeStrategy.LAST_ITEM;
  items: (params: {
    auth: AuthValue;
    store: Store;
    files?: FilesService;
    propsValue: PropsValue;
    lastItemId: unknown;
    server?: ServerContext;
  }) => Promise<
    {
      id: unknown;
      data: unknown;
    }[]
  >;
}

export enum DedupeStrategy {
  TIMEBASED,
  LAST_ITEM,
}

export type Polling<AuthValue extends AppConnectionValueForAuthProperty<any>, PropsValue> =
  | TimebasedPolling<AuthValue, PropsValue>
  | LastItemPolling<AuthValue, PropsValue>;

export const pollingHelper = {
  async poll<AuthValue extends AppConnectionValueForAuthProperty<any>, PropsValue>(
    polling: Polling<AuthValue, PropsValue>,
    {
      store,
      auth,
      propsValue,
      maxItemsToPoll,
      files,
      server,
    }: {
      store: Store;
      auth: AuthValue;
      propsValue: PropsValue;
      files: FilesService;
      maxItemsToPoll?: number;
      server?: ServerContext;
    }
  ): Promise<unknown[]> {
    switch (polling.strategy) {
      case DedupeStrategy.TIMEBASED: {
        const lastEpochMilliSeconds = (await store.get<number>('lastPoll'));
        if (isNil(lastEpochMilliSeconds)) {
          throw new Error("lastPoll doesn't exist in the store.");
        }
        const items = await polling.items({
          store,
          auth,
          propsValue,
          lastFetchEpochMS: lastEpochMilliSeconds,
          server,
        });
        const newLastEpochMilliSeconds = items.reduce(
          (acc, item) => Math.max(acc, item.epochMilliSeconds),
          lastEpochMilliSeconds
        );
        await store.put('lastPoll', newLastEpochMilliSeconds);
        const newItems = items.filter((f) => f.epochMilliSeconds > lastEpochMilliSeconds);
        console.log(`[pollingHelper.poll] TIMEBASED lastPoll=${lastEpochMilliSeconds} (${logTime(lastEpochMilliSeconds)}) -> newLastPoll=${newLastEpochMilliSeconds} (${logTime(newLastEpochMilliSeconds)}) fetched=${items.length} new=${newItems.length}`);
        return newItems.map((item) => item.data);
      }
      case DedupeStrategy.LAST_ITEM: {
        const lastItemId = await store.get<unknown>('lastItem');
        const items = await polling.items({
          store,
          auth,
          propsValue,
          lastItemId,
          files,
          server,
        });

        const lastItemIndex = items.findIndex((f) => f.id === lastItemId);
        let newItems = [];
        if (isNil(lastItemId) || lastItemIndex == -1) {
          newItems = items ?? [];
        } else {
          newItems = items?.slice(0, lastItemIndex) ?? [];
        }
        // Sorted from newest to oldest
        if (!isNil(maxItemsToPoll)) {
          // Get the last polling.maxItemsToPoll items
          newItems = newItems.slice(-maxItemsToPoll);
        }
        const newLastItem = newItems?.[0]?.id;
        if (!isNil(newLastItem)) {
          await store.put('lastItem', newLastItem);
        }
        return newItems.map((item) => item.data);
      }
    }
  },
  async onEnable<AuthValue extends AppConnectionValueForAuthProperty<any>, PropsValue>(
    polling: Polling<AuthValue, PropsValue>,
    {
      store,
      auth,
      propsValue,
      server,
      isRepublish,
    }: { store: Store; auth: AuthValue; propsValue: PropsValue; server?: ServerContext; isRepublish?: boolean }
  ): Promise<void> {
    switch (polling.strategy) {
      case DedupeStrategy.TIMEBASED: {
        const existingLastPoll = await store.get<number>('lastPoll');
        if (isRepublish && !isNil(existingLastPoll)) {
          console.log(`[pollingHelper.onEnable] TIMEBASED isRepublish=true, preserving lastPoll=${existingLastPoll} (${logTime(existingLastPoll)})`);
          break;
        }
        const now = Date.now();
        await store.put('lastPoll', now);
        console.log(`[pollingHelper.onEnable] TIMEBASED isRepublish=${isRepublish ?? false}, existingLastPoll=${existingLastPoll ?? 'none'}, reset lastPoll=${now} (${logTime(now)})`);
        break;
      }
      case DedupeStrategy.LAST_ITEM: {
        if (isRepublish && !isNil(await store.get('lastItem'))) {
          break;
        }
        const items = await polling.items({
          store,
          auth,
          propsValue,
          lastItemId: null,
          server,
        });
        const lastItemId = items?.[0]?.id;
        if (!isNil(lastItemId)) {
          await store.put('lastItem', lastItemId);
        } else {
          await store.delete('lastItem');
        }
        break;
      }
    }
  },
  async onDisable<AuthValue extends AppConnectionValueForAuthProperty<any>, PropsValue>(
    polling: Polling<AuthValue, PropsValue>,
    params: { store: Store; auth: AuthValue; propsValue: PropsValue }
  ): Promise<void> {
    switch (polling.strategy) {
      case DedupeStrategy.TIMEBASED:
      case DedupeStrategy.LAST_ITEM:
        return;
    }
  },
  async test<AuthValue extends AppConnectionValueForAuthProperty<any>, PropsValue>(
    polling: Polling<AuthValue, PropsValue>,
    {
      auth,
      propsValue,
      store,
      files,
      server,
    }: { store: Store; auth: AuthValue; propsValue: PropsValue, files: FilesService; server?: ServerContext }
  ): Promise<unknown[]> {
    let items = [];
    switch (polling.strategy) {
      case DedupeStrategy.TIMEBASED: {
        items = await polling.items({
          store,
          auth,
          propsValue,
          lastFetchEpochMS: 0,
          server,
        });
        break;
      }
      case DedupeStrategy.LAST_ITEM: {
        items = await polling.items({
          store,
          auth,
          propsValue,
          lastItemId: null,
          files,
          server,
        });
        break;
      }
    }
    return getFirstFiveOrAll(items.map((item) => item.data));
  },
};

function logTime(epochMs: number) {
  return new Date(epochMs).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';
}

function getFirstFiveOrAll(array: unknown[]) {
  if (array.length <= 5) {
    return array;
  } else {
    return array.slice(0, 5);
  }
}
