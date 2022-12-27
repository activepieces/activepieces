import {PropsValue} from "./property/prop.model";

export class Context {

    constructor(
        public readonly payload: unknown,
        public readonly webhookUrl: string,
        public readonly propsValue: PropsValue,
        public readonly store: Store
    ) {
    }

}

export type Store = {
    save(key: string): Promise<unknown>;
    get(key: string): Promise<unknown>;
}