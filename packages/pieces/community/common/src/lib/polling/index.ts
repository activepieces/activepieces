import { FilesService, Store } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';


interface TimebasedPolling<AuthValue, PropsValue> {
  strategy: DedupeStrategy.TIMEBASED;
  items: (params: {
    auth: AuthValue;
    store: Store;
    propsValue: PropsValue;
    lastFetchEpochMS: number;
  }) => Promise<
    {
      epochMilliSeconds: number;
      data: unknown;
    }[]
  >;
}

interface LastItemPolling<AuthValue, PropsValue> {
  strategy: DedupeStrategy.LAST_ITEM;
  items: (params: {
    auth: AuthValue;
    store: Store;
    files?: FilesService;
    propsValue: PropsValue;
    lastItemId: unknown;
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

export type Polling<AuthValue, PropsValue> =
  | TimebasedPolling<AuthValue, PropsValue>
  | LastItemPolling<AuthValue, PropsValue>;

export const pollingHelper = {
  async poll<AuthValue, PropsValue>(
    polling: Polling<AuthValue, PropsValue>,
    {
      store,
      auth,
      propsValue,
      maxItemsToPoll,
      files,
    }: {
      store: Store;
      auth: AuthValue;
      propsValue: PropsValue;
      files: FilesService;
      maxItemsToPoll?: number;
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
        });
        const newLastEpochMilliSeconds = items.reduce(
          (acc, item) => Math.max(acc, item.epochMilliSeconds),
          lastEpochMilliSeconds
        );
        await store.put('lastPoll', newLastEpochMilliSeconds);
        return items
          .filter((f) => f.epochMilliSeconds > lastEpochMilliSeconds)
          .map((item) => item.data);
      }
      case DedupeStrategy.LAST_ITEM: {
        const lastItemId = await store.get<unknown>('lastItem');
        const items = await polling.items({
          store,
          auth,
          propsValue,
          lastItemId,
          files,
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
  async onEnable<AuthValue, PropsValue>(
    polling: Polling<AuthValue, PropsValue>,
    {
      store,
      auth,
      propsValue,
    }: { store: Store; auth: AuthValue; propsValue: PropsValue }
  ): Promise<void> {
    switch (polling.strategy) {
      case DedupeStrategy.TIMEBASED: {
        await store.put('lastPoll', Date.now());
        break;
      }
      case DedupeStrategy.LAST_ITEM: {
        const items = await polling.items({
          store,
          auth,
          propsValue,
          lastItemId: null,
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
  async onDisable<AuthValue, PropsValue>(
    polling: Polling<AuthValue, PropsValue>,
    _params: { store: Store; auth: AuthValue; propsValue: PropsValue }
  ): Promise<void> {
    switch (polling.strategy) {
      case DedupeStrategy.TIMEBASED:
      case DedupeStrategy.LAST_ITEM:
        return;
    }
  },
  async test<AuthValue, PropsValue>(
    polling: Polling<AuthValue, PropsValue>,
    {
      auth,
      propsValue,
      store,
      files,
    }: { store: Store; auth: AuthValue; propsValue: PropsValue, files: FilesService }
  ): Promise<unknown[]> {
    let items = [];
    switch (polling.strategy) {
      case DedupeStrategy.TIMEBASED: {
        items = await polling.items({
          store,
          auth,
          propsValue,
          lastFetchEpochMS: 0,
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
        });
        break;
      }
    }
    return getFirstFiveOrAll(items.map((item) => item.data));
  },
};

function getFirstFiveOrAll(array: unknown[]) {
  if (array.length <= 5) {
    return array;
  } else {
    return array.slice(0, 5);
  }
}
