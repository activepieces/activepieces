import {  AppConnectionValue, TriggerStrategy } from "@activepieces/shared";

export type TriggerHookContext<T, S extends TriggerStrategy> =
    S extends TriggerStrategy.APP_WEBHOOK ? {
        webhookUrl: string,
        app: {
            createListeners({ events, identifierValue }: { events: string[], identifierValue: string }): Promise<void>
        },
        propsValue: T,
        store: Store
    } : S extends TriggerStrategy.POLLING ? {
        propsValue: T,
        store: Store
    } : {
        webhookUrl: string,
        propsValue: T,
        store: Store
    };


export interface TriggerContext<T> {
    payload: Record<string, never> | {
        body: any,
        headers: Record<string, string>,
        queryParams: Record<string, string>,
    };
    propsValue: T,
    store: Store,
    connections: ConnectionsManager
}

export interface ActionContext<T> {
    propsValue: T,
    store: Store,
    connections: ConnectionsManager
}

export interface ConnectionsManager {
    get(key: string): Promise<AppConnectionValue | string | null>;
}

export interface Store {
    put<T>(key: string, value: T, scope?: StoreScope): Promise<T>;
    get<T>(key: string, scope?: StoreScope): Promise<T | null>;
}

export enum StoreScope {
    COLLECTION = "COLLECTION",
    FLOW = "FLOW"
}
