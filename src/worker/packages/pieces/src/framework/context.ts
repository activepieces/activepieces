

export interface Context<T>{
    payload?: unknown;
    webhookUrl?: string,
    propsValue: T,
    store?: Store
}

export type Store = {
    save<T>(key: string, value: T): Promise<T>;
    get<T>(key: string): Promise<T>;
}