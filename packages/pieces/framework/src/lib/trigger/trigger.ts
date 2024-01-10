import { TestOrRunHookContext, TriggerHookContext } from '../context';
import { TriggerBase } from '../piece-metadata';
import { NonAuthPiecePropertyMap, PieceAuthProperty } from '../property/property';

export enum TriggerStrategy {
  POLLING = 'POLLING',
  WEBHOOK = 'WEBHOOK',
  APP_WEBHOOK = "APP_WEBHOOK",
}

export enum WebhookHandshakeStrategy {
  NONE = 'NONE',
  HEADER_PRESENT = 'HEADER_PRESENT',
  QUERY_PRESENT = 'QUERY_PRESENT',
  BODY_PARAM_PRESENT = 'BODY_PARAM_PRESENT'
}

export interface WebhookHandshakeConfiguration {
  strategy: WebhookHandshakeStrategy,
  paramName?: string
}

export interface WebhookResponse {
  status: number,
  body?: any,
  headers?: Record<string, string>
}

type CreateTriggerParams<
  PieceAuth extends PieceAuthProperty,
  TriggerProps extends NonAuthPiecePropertyMap,
  TS extends TriggerStrategy,
> = {
  /**
   * A dummy parameter used to infer {@code PieceAuth} type
   */
  name: string
  displayName: string
  description: string
  auth?: PieceAuth
  props: TriggerProps
  type: TS
  handshakeConfiguration?: WebhookHandshakeConfiguration,
  onEnable: (context: TriggerHookContext<PieceAuth, TriggerProps, TS>) => Promise<void>
  onHandshake?: (context: TriggerHookContext<PieceAuth, TriggerProps, TS>) => Promise<WebhookResponse>
  onDisable: (context: TriggerHookContext<PieceAuth, TriggerProps, TS>) => Promise<void>
  run: (context: TestOrRunHookContext<PieceAuth, TriggerProps, TS>) => Promise<unknown[]>
  test?: (context: TestOrRunHookContext<PieceAuth, TriggerProps, TS>) => Promise<unknown[]>
  sampleData: unknown
}

export class ITrigger<
  TS extends TriggerStrategy,
  PieceAuth extends PieceAuthProperty,
  TriggerProps extends NonAuthPiecePropertyMap,
> implements TriggerBase {
  constructor(
    public readonly name: string,
    public readonly displayName: string,
    public readonly description: string,
    public readonly props: TriggerProps,
    public readonly type: TS,
    public readonly handshakeConfiguration: WebhookHandshakeConfiguration,
    public readonly onEnable: (ctx: TriggerHookContext<PieceAuth, TriggerProps, TS>) => Promise<void>,
    public readonly onHandshake: (ctx: TriggerHookContext<PieceAuth, TriggerProps, TS>) => Promise<WebhookResponse>,
    public readonly onDisable: (ctx: TriggerHookContext<PieceAuth, TriggerProps, TS>) => Promise<void>,
    public readonly run: (ctx: TestOrRunHookContext<PieceAuth, TriggerProps, TS>) => Promise<unknown[]>,
    public readonly test: (ctx: TestOrRunHookContext<PieceAuth, TriggerProps, TS>) => Promise<unknown[]>,
    public sampleData: unknown,
  ) { }
}

export type Trigger<
  PieceAuth extends PieceAuthProperty = any,
  TriggerProps extends NonAuthPiecePropertyMap = any,
  S extends TriggerStrategy = TriggerStrategy,
> = ITrigger<S, PieceAuth, TriggerProps>

export const createTrigger = <
  TS extends TriggerStrategy,
  PieceAuth extends PieceAuthProperty,
  TriggerProps extends NonAuthPiecePropertyMap,
>(params: CreateTriggerParams<PieceAuth, TriggerProps, TS>) => {
  return new ITrigger(
    params.name,
    params.displayName,
    params.description,
    params.props,
    params.type,
    params.handshakeConfiguration ?? { strategy: WebhookHandshakeStrategy.NONE },
    params.onEnable,
    params.onHandshake ?? (async () => ({ status: 200 })),
    params.onDisable,
    params.run,
    params.test ?? (() => Promise.resolve([params.sampleData])),
    params.sampleData,
  )
}
