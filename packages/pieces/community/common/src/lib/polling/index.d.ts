import { AppConnectionValueForAuthProperty, FilesService, Store } from '@activepieces/pieces-framework';
interface TimebasedPolling<AuthValue, PropsValue> {
    strategy: DedupeStrategy.TIMEBASED;
    items: (params: {
        auth: AuthValue;
        store: Store;
        propsValue: PropsValue;
        lastFetchEpochMS: number;
    }) => Promise<{
        epochMilliSeconds: number;
        data: unknown;
    }[]>;
}
interface LastItemPolling<AuthValue extends AppConnectionValueForAuthProperty<any>, PropsValue> {
    strategy: DedupeStrategy.LAST_ITEM;
    items: (params: {
        auth: AuthValue;
        store: Store;
        files?: FilesService;
        propsValue: PropsValue;
        lastItemId: unknown;
    }) => Promise<{
        id: unknown;
        data: unknown;
    }[]>;
}
export declare enum DedupeStrategy {
    TIMEBASED = 0,
    LAST_ITEM = 1
}
export type Polling<AuthValue extends AppConnectionValueForAuthProperty<any>, PropsValue> = TimebasedPolling<AuthValue, PropsValue> | LastItemPolling<AuthValue, PropsValue>;
export declare const pollingHelper: {
    poll<AuthValue extends AppConnectionValueForAuthProperty<any>, PropsValue>(polling: Polling<AuthValue, PropsValue>, { store, auth, propsValue, maxItemsToPoll, files, }: {
        store: Store;
        auth: AuthValue;
        propsValue: PropsValue;
        files: FilesService;
        maxItemsToPoll?: number;
    }): Promise<unknown[]>;
    onEnable<AuthValue extends AppConnectionValueForAuthProperty<any>, PropsValue>(polling: Polling<AuthValue, PropsValue>, { store, auth, propsValue, }: {
        store: Store;
        auth: AuthValue;
        propsValue: PropsValue;
    }): Promise<void>;
    onDisable<AuthValue extends AppConnectionValueForAuthProperty<any>, PropsValue>(polling: Polling<AuthValue, PropsValue>, params: {
        store: Store;
        auth: AuthValue;
        propsValue: PropsValue;
    }): Promise<void>;
    test<AuthValue extends AppConnectionValueForAuthProperty<any>, PropsValue>(polling: Polling<AuthValue, PropsValue>, { auth, propsValue, store, files, }: {
        store: Store;
        auth: AuthValue;
        propsValue: PropsValue;
        files: FilesService;
    }): Promise<unknown[]>;
};
export {};
