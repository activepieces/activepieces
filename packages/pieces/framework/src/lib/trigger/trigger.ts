import { z } from 'zod';
import { OnStartContext, TestOrRunHookContext, TriggerHookContext } from '../context';
import { OutputDisplayHints } from '../output-display-hints';
import { TriggerBase } from '../piece-metadata';
import { InputPropertyMap } from '../property';
import { ExtractPieceAuthPropertyTypeForMethods, PieceAuthProperty } from '../property/authentication';
import { isNil, TriggerStrategy, TriggerTestStrategy, WebhookHandshakeConfiguration, WebhookHandshakeStrategy } from '@activepieces/shared';
export { TriggerStrategy }

export const DEDUPE_KEY_PROPERTY = '_dedupe_key'



export enum WebhookRenewStrategy {
  CRON = 'CRON',
  NONE = 'NONE',
}

type OnStartRunner<PieceAuth extends PieceAuthProperty | undefined, TriggerProps extends InputPropertyMap> = (ctx: OnStartContext<PieceAuth, TriggerProps>) => Promise<unknown | void>



export const WebhookRenewConfiguration = z.union([
  z.object({
    strategy: z.literal(WebhookRenewStrategy.CRON),
    cronExpression: z.string(),
  }),
  z.object({
    strategy: z.literal(WebhookRenewStrategy.NONE),
  }),
])
export type WebhookRenewConfiguration = z.infer<typeof WebhookRenewConfiguration>

export interface WebhookResponse {
  status: number,
  body?: unknown,
  headers?: Record<string, string>
}

type BaseTriggerParams<
  PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined,
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
  onEnable: (context: TriggerHookContext<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, TriggerProps, TS>) => Promise<void>
  onDisable: (context: TriggerHookContext<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, TriggerProps, TS>) => Promise<void>
  run: (context: TestOrRunHookContext<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, TriggerProps, TS>) => Promise<unknown[]>
  test?: (context: TestOrRunHookContext<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, TriggerProps, TS>) => Promise<unknown[]>,
  onStart?: OnStartRunner<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, TriggerProps>,
  sampleData: unknown,
  outputDisplayHints?: OutputDisplayHints,
}

type WebhookTriggerParams<
PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined,
TriggerProps extends InputPropertyMap,
TS extends TriggerStrategy,
> = BaseTriggerParams<PieceAuth, TriggerProps, TS> & {
  handshakeConfiguration?: WebhookHandshakeConfiguration
  onHandshake?: (context: TriggerHookContext<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, TriggerProps, TS>) => Promise<WebhookResponse>,
  renewConfiguration?: WebhookRenewConfiguration
  onRenew?(context: TriggerHookContext<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, TriggerProps, TS>): Promise<void>,
}

type CreateTriggerParams<
  PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined,
  TriggerProps extends InputPropertyMap,
  TS extends TriggerStrategy,
> = TS extends TriggerStrategy.WEBHOOK
    ? WebhookTriggerParams<PieceAuth, TriggerProps, TS>
    : BaseTriggerParams<PieceAuth, TriggerProps, TS>

export class ITrigger<
  TS extends TriggerStrategy,
  PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined,
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
    public readonly onHandshake: (ctx: TriggerHookContext<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, TriggerProps, TS>) => Promise<WebhookResponse>,
    public readonly renewConfiguration: WebhookRenewConfiguration,
    public readonly onRenew: (ctx: TriggerHookContext<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, TriggerProps, TS>) => Promise<void>,
    public readonly onEnable: (ctx: TriggerHookContext<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, TriggerProps, TS>) => Promise<void>,
    public readonly onDisable: (ctx: TriggerHookContext<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, TriggerProps, TS>) => Promise<void>,
    public readonly onStart: OnStartRunner<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, TriggerProps>,
    public readonly run: (ctx: TestOrRunHookContext<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, TriggerProps, TS>) => Promise<unknown[]>,
    public readonly test: (ctx: TestOrRunHookContext<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>, TriggerProps, TS>) => Promise<unknown[]>,
    public readonly sampleData: unknown,
    public readonly testStrategy: TriggerTestStrategy,
    public readonly outputDisplayHints?: OutputDisplayHints,
  ) { }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Trigger<
  PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined = any,
  TriggerProps extends InputPropertyMap = any,
  S extends TriggerStrategy = any,
> = ITrigger<S, PieceAuth, TriggerProps>

// TODO refactor and extract common logic
export const createTrigger = <
  TS extends TriggerStrategy,
  PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined ,
  TriggerProps extends InputPropertyMap,
>(params: CreateTriggerParams<PieceAuth, TriggerProps, TS>) => {
  switch (params.type) {
    case TriggerStrategy.WEBHOOK:
      return new ITrigger(
        params.name,
        params.displayName,
        params.description,
        params.requireAuth ?? true,
        params.props,
        params.type,
        params.handshakeConfiguration ?? { strategy: WebhookHandshakeStrategy.NONE },
        params.onHandshake ?? (async () => ({ status: 200 })),
        params.renewConfiguration ?? { strategy: WebhookRenewStrategy.NONE },
        params.onRenew ?? (async () => Promise.resolve()),
        params.onEnable,
        params.onDisable,
        params.onStart ?? (async () => Promise.resolve()),
        params.run,
        params.test ?? (() => Promise.resolve([params.sampleData])),
        params.sampleData,
        params.test ? TriggerTestStrategy.TEST_FUNCTION : TriggerTestStrategy.SIMULATION,
        params.outputDisplayHints,
      )
    case TriggerStrategy.POLLING:
      return new ITrigger(
        params.name,
        params.displayName,
        params.description,
        params.requireAuth ?? true,
        params.props,
        params.type,
        { strategy: WebhookHandshakeStrategy.NONE },
        async () => ({ status: 200 }),
        { strategy: WebhookRenewStrategy.NONE },
        (async () => Promise.resolve()),
        params.onEnable,
        params.onDisable,
        params.onStart ?? (async () => Promise.resolve()),
        params.run,
        params.test ?? (() => Promise.resolve([params.sampleData])),
        params.sampleData,
        TriggerTestStrategy.TEST_FUNCTION,
        params.outputDisplayHints,
      )
    case TriggerStrategy.MANUAL:
      return new ITrigger(
        params.name,
        params.displayName,
        params.description,
        params.requireAuth ?? true,
        params.props,
        params.type,
        { strategy: WebhookHandshakeStrategy.NONE },
        async () => ({ status: 200 }),
        { strategy: WebhookRenewStrategy.NONE },
        (async () => Promise.resolve()),
        params.onEnable,
        params.onDisable,
        params.onStart ?? (async () => Promise.resolve()),
        params.run,
        params.test ?? (() => Promise.resolve([params.sampleData])),
        params.sampleData,
        TriggerTestStrategy.TEST_FUNCTION,
        params.outputDisplayHints,
      )
    case TriggerStrategy.APP_WEBHOOK:
      return new ITrigger(
        params.name,
        params.displayName,
        params.description,
        params.requireAuth ?? true,
        params.props,
        params.type,
        { strategy: WebhookHandshakeStrategy.NONE },
        async () => ({ status: 200 }),
        { strategy: WebhookRenewStrategy.NONE },
        (async () => Promise.resolve()),
        params.onEnable,
        params.onDisable,
        params.onStart ?? (async () => Promise.resolve()),
        params.run,
        params.test ?? (() => Promise.resolve([params.sampleData])),
        params.sampleData,
        (isNil(params.sampleData) && isNil(params.test)) ? TriggerTestStrategy.SIMULATION : TriggerTestStrategy.TEST_FUNCTION,
        params.outputDisplayHints,
      )
  }
}
