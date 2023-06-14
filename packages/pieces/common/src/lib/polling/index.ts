import { Store } from "@activepieces/pieces-framework";
import { isNil } from "lodash";

interface TimebasedPolling<AuthPropValue, PropsValue> {
    strategy: DedupeStrategy.TIMEBASED;
    items: (
        params: { auth: AuthPropValue, propsValue: PropsValue, lastFetchEpochMS: number },
    ) => Promise<{
        epochMilliSeconds: number;
        data: unknown;
    }[]
    >;
}

interface LastItemPolling<AuthPropValue, PropsValue> {
    strategy: DedupeStrategy.LAST_ITEM;
    items: (
        params: { auth: AuthPropValue, propsValue: PropsValue, lastItemId: unknown },
    ) => Promise<{
        id: unknown;
        data: unknown;
    }[]
    >;
}

export enum DedupeStrategy {
    TIMEBASED,
    LAST_ITEM
}

export type Polling<AuthPropValue, PropsValue> = TimebasedPolling<AuthPropValue, PropsValue> | LastItemPolling<AuthPropValue, PropsValue>

export const pollingHelper = {
    async poll<AuthPropValue, PropsValue>(polling: Polling<AuthPropValue, PropsValue>, { store, auth, propsValue, maxItemsToPoll }: { store: Store, auth: AuthPropValue, propsValue: PropsValue, maxItemsToPoll?: number }): Promise<unknown[]> {
        switch (polling.strategy) {
            case DedupeStrategy.TIMEBASED: {
                const lastEpochMilliSeconds = (await store.get<number>("lastPoll")) ?? 0;
                const items = await polling.items({ auth, propsValue, lastFetchEpochMS: lastEpochMilliSeconds });
                const newLastEpochMilliSeconds = items.reduce((acc, item) => Math.max(acc, item.epochMilliSeconds), lastEpochMilliSeconds);
                await store.put("lastPoll", newLastEpochMilliSeconds);
                return items.filter(f => f.epochMilliSeconds > lastEpochMilliSeconds).map((item) => item.data);
            }
            case DedupeStrategy.LAST_ITEM: {
                const lastItemId = (await store.get<unknown>("lastItem"));
                const items = await polling.items({ auth, propsValue, lastItemId });

                const lastItemIndex = items.findIndex(f => f.id === lastItemId);
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
                    await store.put("lastItem", newLastItem);
                }
                return newItems.map((item) => item.data);
            }
        }
    },
    async onEnable<AuthPropValue, PropsValue>(polling: Polling<AuthPropValue, PropsValue>, { store, auth, propsValue }: { store: Store, auth: AuthPropValue, propsValue: PropsValue }): Promise<void> {
        switch (polling.strategy) {
            case DedupeStrategy.TIMEBASED: {
                await store.put("lastPoll", Date.now());
                break;
            }
            case DedupeStrategy.LAST_ITEM: {
                const items = (await polling.items({ auth, propsValue, lastItemId: null }));
                const lastItemId = items?.[0]?.id;
                if (!isNil(lastItemId)) {
                    await store.put("lastItem", lastItemId);
                } else {
                    await store.delete("lastItem");
                }
                break;
            }
        }
    },
    async onDisable<AuthPropValue, PropsValue>(polling: Polling<AuthPropValue, PropsValue>, params: { store: Store, auth: AuthPropValue, propsValue: PropsValue }): Promise<void> {
        switch (polling.strategy) {
            case DedupeStrategy.TIMEBASED:
            case DedupeStrategy.LAST_ITEM:
                return;
        }
    },
    async test<AuthPropValue, PropsValue>(polling: Polling<AuthPropValue, PropsValue>, { auth, propsValue }: { store: Store, auth: AuthPropValue, propsValue: PropsValue }): Promise<unknown[]> {
        let items = [];
        switch (polling.strategy) {
            case DedupeStrategy.TIMEBASED: {
                items = await polling.items({ auth, propsValue, lastFetchEpochMS: 0 });
                break;
            }
            case DedupeStrategy.LAST_ITEM: {
                items = await polling.items({ auth, propsValue, lastItemId: null });
                break;
            }
        }
        return getFirstFiveOrAll(items.map((item) => item.data));
    }
}

function getFirstFiveOrAll(array: unknown[]) {
    if (array.length <= 5) {
        return array;
    } else {
        return array.slice(0, 5);
    }
}
