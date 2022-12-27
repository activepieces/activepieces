import {PropsValue} from "./property/prop.model";


export interface Context{
    payload?: unknown;
    webhookUrl?: string,
    propsValue: PropsValue,
    store?: Store
}

export type Store = {
    save(key: string): Promise<unknown>;
    get(key: string): Promise<unknown>;
}