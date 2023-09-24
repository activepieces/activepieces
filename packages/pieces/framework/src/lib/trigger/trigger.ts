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

export type WebhookHandshakeConfiguration = {
  strategy: WebhookHandshakeStrategy,
  paramName?: string
}

export type WebhookResponse = {
  status: number,
  body?: unknown,
  headers?: Record<string, string>
}

type TriggerRunResponse<TriggerRunResponseData> = {
  payload: unknown[]
  data?: TriggerRunResponseData
}

type TriggerRunHook<
  PieceAuth extends PieceAuthProperty,
  TriggerProps extends NonAuthPiecePropertyMap,
  TS extends TriggerStrategy,
  TriggerRunResponseData,
> = (context: TestOrRunHookContext<PieceAuth, TriggerProps, TS>) => Promise<TriggerRunResponse<TriggerRunResponseData>>

type CreateTriggerParams<
  PieceAuth extends PieceAuthProperty,
  TriggerProps extends NonAuthPiecePropertyMap,
  TS extends TriggerStrategy,
  TriggerRunResponseData,
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
  run: TriggerRunHook<PieceAuth, TriggerProps, TS, TriggerRunResponseData>
  test?: TriggerRunHook<PieceAuth, TriggerProps, TS, TriggerRunResponseData>
  requireAuth?: boolean
  sampleData: unknown
}

export class ITrigger<
  TS extends TriggerStrategy,
  PieceAuth extends PieceAuthProperty,
  TriggerProps extends NonAuthPiecePropertyMap,
  TriggerRunResponseData,
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
    public readonly run: TriggerRunHook<PieceAuth, TriggerProps, TS, TriggerRunResponseData>,
    public readonly test: TriggerRunHook<PieceAuth, TriggerProps, TS, TriggerRunResponseData>,
    public sampleData: unknown,
    public readonly requireAuth: boolean = true,
  ) { }
}

export type Trigger<
  PieceAuth extends PieceAuthProperty = any,
  TriggerProps extends NonAuthPiecePropertyMap = any,
  S extends TriggerStrategy = TriggerStrategy,
  TriggerRunResponseData = unknown,
> = ITrigger<S, PieceAuth, TriggerProps, TriggerRunResponseData>

export const createTrigger = <
  TS extends TriggerStrategy,
  PieceAuth extends PieceAuthProperty,
  TriggerProps extends NonAuthPiecePropertyMap,
  TriggerRunResponseData,
>(params: CreateTriggerParams<PieceAuth, TriggerProps, TS, TriggerRunResponseData>) => {
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
    params.test ?? defaultTestHook(params.sampleData),
    params.sampleData,
    params.requireAuth,
  )
}

const defaultTestHook = (sampleData: unknown) => () => Promise.resolve({ payload: [sampleData] });
