

export interface TriggerHookContext<T> {
    webhookUrl: string,
    propsValue: T,
    store: Store
}

export interface TriggerContext<T> {
    payload: Record<string, never> | {
        body: any,
        headers: Record<string, string>,
        queryParams: Record<string, string>,
    };
    propsValue: T,
    store: Store
}

export interface ActionContext<T> {
    propsValue: T,
    store: Store
}

export interface Store {
    put<T>(key: string, value: T): Promise<T>;
    get<T>(key: string): Promise<T | null>;
}