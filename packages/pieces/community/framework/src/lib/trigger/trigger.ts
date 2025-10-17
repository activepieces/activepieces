import { Static, Type } from '@sinclair/typebox';
import { OnStartContext, TestOrRunHookContext, TriggerHookContext } from '../context';
import { TriggerBase } from '../piece-metadata';
import { InputPropertyMap } from '../property';
import { PieceAuthProperty } from '../property/authentication';
import { isNil, TriggerStrategy, TriggerTestStrategy, WebhookHandshakeConfiguration, WebhookHandshakeStrategy } from '@activepieces/shared';
export { TriggerStrategy }

export const DEDUPE_KEY_PROPERTY = '_dedupe_key'



export enum WebhookRenewStrategy {
  CRON = 'CRON',
  NONE = 'NONE',
}

type OnStartRunner<PieceAuth extends PieceAuthProperty, TriggerProps extends InputPropertyMap> = (ctx: OnStartContext<PieceAuth, TriggerProps>) => Promise<unknown | void>



export const WebhookRenewConfiguration = Type.Union([
  Type.Object({
    strategy: Type.Literal(WebhookRenewStrategy.CRON),
    cronExpression: Type.String(),
  }),
  Type.Object({
    strategy: Type.Literal(WebhookRenewStrategy.NONE),
  }),
])
export type WebhookRenewConfiguration = Static<typeof WebhookRenewConfiguration>

export interface WebhookResponse {
  status: number,
  body?: any,
  headers?: Record<string, string>
}

type BaseTriggerParams<
  PieceAuth extends PieceAuthProperty,
  TriggerProps extends InputPropertyMap,
  TS extends TriggerStrategy,
> = {
  name: string
  displayName: string
  description: string
  requireAuth?: boolean
  auth?: PieceAuth
  props: TriggerProps
  type: TS
  onEnable: (context: TriggerHookContext<PieceAuth, TriggerProps, TS>) => Promise<void>
  onDisable: (context: TriggerHookContext<PieceAuth, TriggerProps, TS>) => Promise<void>
  run: (context: TestOrRunHookContext<PieceAuth, TriggerProps, TS>) => Promise<unknown[]>
  test?: (context: TestOrRunHookContext<PieceAuth, TriggerProps, TS>) => Promise<unknown[]>,
  onStart?: OnStartRunner<PieceAuth, TriggerProps>,
  sampleData: unknown
}

type WebhookTriggerParams<
PieceAuth extends PieceAuthProperty,
TriggerProps extends InputPropertyMap,
TS extends TriggerStrategy,
> = BaseTriggerParams<PieceAuth, TriggerProps, TS> & {
  handshakeConfiguration?: WebhookHandshakeConfiguration
  onHandshake?: (context: TriggerHookContext<PieceAuth, TriggerProps, TS>) => Promise<WebhookResponse>,
  renewConfiguration?: WebhookRenewConfiguration
  onRenew?(context: TriggerHookContext<PieceAuth, TriggerProps, TS>): Promise<void>,
}

type CreateTriggerParams<
  PieceAuth extends PieceAuthProperty,
  TriggerProps extends InputPropertyMap,
  TS extends TriggerStrategy,
> = TS extends TriggerStrategy.WEBHOOK
    ? WebhookTriggerParams<PieceAuth, TriggerProps, TS>
    : BaseTriggerParams<PieceAuth, TriggerProps, TS>

export class ITrigger<
  TS extends TriggerStrategy,
  PieceAuth extends PieceAuthProperty,
  TriggerProps extends InputPropertyMap,
> implements TriggerBase {
  constructor(
    public readonly name: string,
    public readonly displayName: string,
    public readonly description: string,
    public readonly requireAuth: boolean,
    public readonly props: TriggerProps,
    public readonly type: TS,
    public readonly handshakeConfiguration: WebhookHandshakeConfiguration,
    public readonly onHandshake: (ctx: TriggerHookContext<PieceAuth, TriggerProps, TS>) => Promise<WebhookResponse>,
    public readonly renewConfiguration: WebhookRenewConfiguration,
    public readonly onRenew: (ctx: TriggerHookContext<PieceAuth, TriggerProps, TS>) => Promise<void>,
    public readonly onEnable: (ctx: TriggerHookContext<PieceAuth, TriggerProps, TS>) => Promise<void>,
    public readonly onDisable: (ctx: TriggerHookContext<PieceAuth, TriggerProps, TS>) => Promise<void>,
    public readonly onStart: OnStartRunner<PieceAuth, TriggerProps>,
    public readonly run: (ctx: TestOrRunHookContext<PieceAuth, TriggerProps, TS>) => Promise<unknown[]>,
    public readonly test: (ctx: TestOrRunHookContext<PieceAuth, TriggerProps, TS>) => Promise<unknown[]>,
    public readonly sampleData: unknown,
    public readonly testStrategy: TriggerTestStrategy,
  ) { }
}

export type Trigger<
  PieceAuth extends PieceAuthProperty = any,
  TriggerProps extends InputPropertyMap = any,
  S extends TriggerStrategy = TriggerStrategy,
> = ITrigger<S, PieceAuth, TriggerProps>

export const createTrigger = <
  TS extends TriggerStrategy,
  PieceAuth extends PieceAuthProperty,
  TriggerProps extends InputPropertyMap,
>(params: CreateTriggerParams<PieceAuth, TriggerProps, TS>) => {
  // Extract common defaults to reduce duplication
  const commonDefaults = {
    requireAuth: params.requireAuth ?? true,
    onStart: params.onStart ?? (async () => Promise.resolve()),
    test: params.test ?? (() => Promise.resolve([params.sampleData])),
    handshakeNone: { strategy: WebhookHandshakeStrategy.NONE } as const,
    renewNone: { strategy: WebhookRenewStrategy.NONE } as const,
    defaultWebhookResponse: async () => ({ status: 200 }),
    defaultOnRenew: async () => Promise.resolve(),
  }

  switch (params.type) {
    case TriggerStrategy.WEBHOOK:
      return new ITrigger(
        params.name,
        params.displayName,
        params.description,
        commonDefaults.requireAuth,
        params.props,
        params.type,
        params.handshakeConfiguration ?? commonDefaults.handshakeNone,
        params.onHandshake ?? commonDefaults.defaultWebhookResponse,
        params.renewConfiguration ?? commonDefaults.renewNone,
        params.onRenew ?? commonDefaults.defaultOnRenew,
        params.onEnable,
        params.onDisable,
        commonDefaults.onStart,
        params.run,
        commonDefaults.test,
        params.sampleData,
        params.test ? TriggerTestStrategy.TEST_FUNCTION : TriggerTestStrategy.SIMULATION,
      )
    case TriggerStrategy.POLLING:
      return new ITrigger(
        params.name,
        params.displayName,
        params.description,
        commonDefaults.requireAuth,
        params.props,
        params.type,
        commonDefaults.handshakeNone,
        commonDefaults.defaultWebhookResponse,
        commonDefaults.renewNone,
        commonDefaults.defaultOnRenew,
        params.onEnable,
        params.onDisable,
        commonDefaults.onStart,
        params.run,
        commonDefaults.test,
        params.sampleData,
        TriggerTestStrategy.TEST_FUNCTION,
      )
    case TriggerStrategy.APP_WEBHOOK:
      return new ITrigger(
        params.name,
        params.displayName,
        params.description,
        commonDefaults.requireAuth,
        params.props,
        params.type,
        commonDefaults.handshakeNone,
        commonDefaults.defaultWebhookResponse,
        commonDefaults.renewNone,
        commonDefaults.defaultOnRenew,
        params.onEnable,
        params.onDisable,
        commonDefaults.onStart,
        params.run,
        commonDefaults.test,
        params.sampleData,
        (isNil(params.sampleData) && isNil(params.test)) ? TriggerTestStrategy.SIMULATION : TriggerTestStrategy.TEST_FUNCTION,
      )
  }
}
