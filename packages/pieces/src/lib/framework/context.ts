
export interface TriggerContext<T> {
    payload: any;
    webhookUrl: string,
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