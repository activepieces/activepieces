import { Static } from '@sinclair/typebox';
import { OnStartContext, TestOrRunHookContext, TriggerHookContext } from '../context';
import { TriggerBase } from '../piece-metadata';
import { InputPropertyMap } from '../property';
import { ExtractPieceAuthPropertyTypeForMethods, PieceAuthProperty } from '../property/authentication';
import { TriggerStrategy, TriggerTestStrategy, WebhookHandshakeConfiguration } from '@activepieces/shared';
export { TriggerStrategy };
export declare const DEDUPE_KEY_PROPERTY = "_dedupe_key";
export declare enum WebhookRenewStrategy {
    CRON = "CRON",
    NONE = "NONE"
}
type OnStartRunner<PieceAuth extends PieceAuthProperty | undefined, TriggerProps extends InputPropertyMap> = (ctx: OnStartContext<PieceAuth, TriggerProps>) => Promise<unknown | void>;
export declare const WebhookRenewConfiguration: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
    strategy: import("@sinclair/typebox").TLiteral<WebhookRenewStrategy.CRON>;
    cronExpression: import("@sinclair/typebox").TString;
}>, import("@sinclair/typebox").TObject<{
    strategy: import("@sinclair/typebox").TLiteral<WebhookRenewStrategy.NONE>;
}>]>;
export type WebhookRenewConfiguration = Static<typeof WebhookRenewConfiguration>;
export interface WebhookResponse {
    status: number;
    body?: any;
    headers?: Record<string, string>;
}
type BaseTriggerParams<PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined, TriggerProps extends InputPropertyMap, TS extends TriggerStrategy> = {
    name: string;
    displayName: string;
    description: string;
    requireAuth?: boolean;
    auth?: PieceAuth;
    props: TriggerProps;
    type: TS;
    onEnable: (context: TriggerHookContext<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, TriggerProps, TS>) => Promise<void>;
    onDisable: (context: TriggerHookContext<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, TriggerProps, TS>) => Promise<void>;
    run: (context: TestOrRunHookContext<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, TriggerProps, TS>) => Promise<unknown[]>;
    test?: (context: TestOrRunHookContext<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, TriggerProps, TS>) => Promise<unknown[]>;
    onStart?: OnStartRunner<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, TriggerProps>;
    sampleData: unknown;
};
type WebhookTriggerParams<PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined, TriggerProps extends InputPropertyMap, TS extends TriggerStrategy> = BaseTriggerParams<PieceAuth, TriggerProps, TS> & {
    handshakeConfiguration?: WebhookHandshakeConfiguration;
    onHandshake?: (context: TriggerHookContext<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, TriggerProps, TS>) => Promise<WebhookResponse>;
    renewConfiguration?: WebhookRenewConfiguration;
    onRenew?(context: TriggerHookContext<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, TriggerProps, TS>): Promise<void>;
};
type CreateTriggerParams<PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined, TriggerProps extends InputPropertyMap, TS extends TriggerStrategy> = TS extends TriggerStrategy.WEBHOOK ? WebhookTriggerParams<PieceAuth, TriggerProps, TS> : BaseTriggerParams<PieceAuth, TriggerProps, TS>;
export declare class ITrigger<TS extends TriggerStrategy, PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined, TriggerProps extends InputPropertyMap> implements TriggerBase {
    readonly name: string;
    readonly displayName: string;
    readonly description: string;
    readonly requireAuth: boolean;
    readonly props: TriggerProps;
    readonly type: TS;
    readonly handshakeConfiguration: WebhookHandshakeConfiguration;
    readonly onHandshake: (ctx: TriggerHookContext<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, TriggerProps, TS>) => Promise<WebhookResponse>;
    readonly renewConfiguration: WebhookRenewConfiguration;
    readonly onRenew: (ctx: TriggerHookContext<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, TriggerProps, TS>) => Promise<void>;
    readonly onEnable: (ctx: TriggerHookContext<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, TriggerProps, TS>) => Promise<void>;
    readonly onDisable: (ctx: TriggerHookContext<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, TriggerProps, TS>) => Promise<void>;
    readonly onStart: OnStartRunner<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, TriggerProps>;
    readonly run: (ctx: TestOrRunHookContext<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, TriggerProps, TS>) => Promise<unknown[]>;
    readonly test: (ctx: TestOrRunHookContext<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, TriggerProps, TS>) => Promise<unknown[]>;
    readonly sampleData: unknown;
    readonly testStrategy: TriggerTestStrategy;
    constructor(name: string, displayName: string, description: string, requireAuth: boolean, props: TriggerProps, type: TS, handshakeConfiguration: WebhookHandshakeConfiguration, onHandshake: (ctx: TriggerHookContext<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, TriggerProps, TS>) => Promise<WebhookResponse>, renewConfiguration: WebhookRenewConfiguration, onRenew: (ctx: TriggerHookContext<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, TriggerProps, TS>) => Promise<void>, onEnable: (ctx: TriggerHookContext<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, TriggerProps, TS>) => Promise<void>, onDisable: (ctx: TriggerHookContext<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, TriggerProps, TS>) => Promise<void>, onStart: OnStartRunner<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, TriggerProps>, run: (ctx: TestOrRunHookContext<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, TriggerProps, TS>) => Promise<unknown[]>, test: (ctx: TestOrRunHookContext<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, TriggerProps, TS>) => Promise<unknown[]>, sampleData: unknown, testStrategy: TriggerTestStrategy);
}
export type Trigger<PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined = any, TriggerProps extends InputPropertyMap = any, S extends TriggerStrategy = any> = ITrigger<S, PieceAuth, TriggerProps>;
export declare const createTrigger: <TS extends TriggerStrategy, PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined, TriggerProps extends InputPropertyMap>(params: CreateTriggerParams<PieceAuth, TriggerProps, TS>) => ITrigger<TriggerStrategy.WEBHOOK, PieceAuth, TriggerProps> | ITrigger<TriggerStrategy.POLLING, PieceAuth, TriggerProps> | ITrigger<TriggerStrategy.APP_WEBHOOK, PieceAuth, TriggerProps>;
