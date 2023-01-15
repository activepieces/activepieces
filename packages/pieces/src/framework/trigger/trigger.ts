import {Context} from "../context";
import {PieceProperty, StaticPropsValue} from "../property/property";

export enum TriggerStrategy {
    POLLING = 'POLLING',
    WEBHOOK = 'WEBHOOK'
}

class ITrigger<T extends PieceProperty> {
    constructor(
        public readonly name: string,
        public readonly displayName: string,
        public readonly description: string,
        public readonly props: T,
        public readonly type: TriggerStrategy,
        public readonly onEnable: (context: Context<StaticPropsValue<T>>) => Promise<void>,
        public readonly onDisable: (context: Context<StaticPropsValue<T>>) => Promise<void>,
        public readonly run: (context: Context<StaticPropsValue<T>>) => Promise<unknown[]>
    ) {
    }
}


export type Trigger = ITrigger<any>;

export function createTrigger<T extends PieceProperty>(request: {
    name: string;
    displayName: string;
    description: string;
    props: T;
    type: TriggerStrategy,
    onEnable: (context: Context<StaticPropsValue<T>>) => Promise<void>;
onDisable: (context: Context<StaticPropsValue<T>>) => Promise<void>;
    run: (context: Context<StaticPropsValue<T>>) => Promise<unknown[]>;
}): Trigger {
    return new ITrigger<T>(
        request.name,
        request.displayName,
        request.description,
        request.props,
        request.type,
        request.onEnable,
        request.onDisable,
        request.run
    );
}
