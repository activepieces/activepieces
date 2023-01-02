

export interface Context<T>{
    payload?: any;
    webhookUrl?: string,
    propsValue: T,
    store?: Store
}

export interface Store {
    save<T> (key: string, value: T): Promise<T>;
    get<T>(key: string): Promise<T | null>;
}