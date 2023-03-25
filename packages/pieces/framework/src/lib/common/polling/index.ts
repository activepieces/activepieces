import { Store, } from "../../framework";

interface TimebasedPolling<INPUT> {
    strategy: DedupeStrategy.TIMEBASED;
    items: (
        { propsValue, lastFetchEpochMS }: { propsValue: INPUT, lastFetchEpochMS: number },
    ) => Promise<{
        epochMillSeconds: number;
        data: unknown;
    }[]
    >;
}

interface LastItemPolling<INPUT> {
    strategy: DedupeStrategy.LAST_ITEM;
    items: (
        { propsValue }: { propsValue: INPUT },
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

export type Polling<T> = TimebasedPolling<T> | LastItemPolling<T>;

export const pollingHelper = {
    async poll<INPUT>(polling: Polling<INPUT>, { store, propsValue }: { store: Store, propsValue: INPUT }): Promise<unknown[]> {
        switch (polling.strategy) {
            case DedupeStrategy.TIMEBASED: {
                const lastEpochMillSeconds = (await store.get<number>("lastPoll")) ?? 0;
                const items = await polling.items({ propsValue, lastFetchEpochMS: lastEpochMillSeconds});
                const newLastEpochMillSeconds = items.reduce((acc, item) => Math.max(acc, item.epochMillSeconds), lastEpochMillSeconds);
                await store.put("lastPoll", newLastEpochMillSeconds);
                return items.filter(f => f.epochMillSeconds > lastEpochMillSeconds).map((item) => item.data);
            }
            case DedupeStrategy.LAST_ITEM: {
                const lastItemId = (await store.get<unknown>("lastItem"));
                const items = await polling.items({ propsValue });
                const newLastItem = items?.[0]?.id;
                if (!newLastItem) {
                    return items;
                }
                await store.put("lastItem", newLastItem);
                // get  items until you find the last item
                const lastItemIndex = items.findIndex(f => f.id === lastItemId);
                return items?.slice(0, lastItemIndex).map((item) => item.data) ?? [];
            }
        }
    },
    async onEnable<INPUT>(polling: Polling<INPUT>, { store, propsValue }: { store: Store, propsValue: INPUT }): Promise<void> {
        switch (polling.strategy) {
            case DedupeStrategy.TIMEBASED: {
                await store.put("lastPoll", Date.now());
                break;
            }
            case DedupeStrategy.LAST_ITEM: {
                const items = (await polling.items({ propsValue }));
                await store.put("lastItem", items?.[0]?.id);
                break;
            }
        }
    },
    async onDisable<INPUT>(polling: Polling<INPUT>, { store, propsValue }: { store: Store, propsValue: INPUT }): Promise<void> {
        switch (polling.strategy) {
            case DedupeStrategy.TIMEBASED:
            case DedupeStrategy.LAST_ITEM:
                return;
        }
    },
    async test<INPUT>(polling: Polling<INPUT>, { propsValue }: { store: Store, propsValue: INPUT }): Promise<unknown[]> {
        switch (polling.strategy) {
            case DedupeStrategy.TIMEBASED:
                return (await polling.items({ propsValue , lastFetchEpochMS: 0 }));
            case DedupeStrategy.LAST_ITEM:
                return (await polling.items({ propsValue }));
        }
    }
}