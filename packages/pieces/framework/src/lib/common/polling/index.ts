import { Store, } from "../../framework";

interface TimebasedPolling<INPUT> {
    strategy: DedupeStrategy.TIMEBASED;
    items: (
        { propsValue }: { propsValue: INPUT },
    ) => Promise<{
        epochMilliSeconds: number;
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
                const lastEpochMilliSeconds = (await store.get<number>("lastPoll"))!;
                const items = await polling.items({ propsValue });
                const newLastEpochMilliSeconds = items.reduce((acc, item) => Math.max(acc, item.epochMilliSeconds), lastEpochMilliSeconds);
                await store.put("lastPoll", newLastEpochMilliSeconds);
                return items.filter(f => f.epochMilliSeconds > lastEpochMilliSeconds).map((item) => item.data);
            }
            case DedupeStrategy.LAST_ITEM: {
                const lastItemId = (await store.get<unknown>("lastItem"));
                const items = await polling.items({ propsValue });
                const newLastItem = items?.[0]?.id;
                if(!newLastItem) {
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
            case DedupeStrategy.LAST_ITEM:
                return (await polling.items({ propsValue }));
        }
    }
}