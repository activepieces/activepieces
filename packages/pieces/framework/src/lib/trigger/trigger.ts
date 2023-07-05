import { TriggerHookContext } from '../context';
import { TriggerBase } from '../piece-metadata';
import { PieceAuthProperty, PiecePropertyMap } from '../property/property';

export enum TriggerStrategy {
  POLLING = 'POLLING',
  WEBHOOK = 'WEBHOOK',
  APP_WEBHOOK = "APP_WEBHOOK",
}

type CreateTriggerParams<
  PieceAuth extends PieceAuthProperty,
  TriggerProps extends PiecePropertyMap,
  TS extends TriggerStrategy,
> = {
  /**
   * A dummy parameter used to infer {@code PieceAuth} type
   */
  auth?: PieceAuth
  trigger: {
    name: string
    displayName: string
    description: string
    props: TriggerProps
    type: TS
    onEnable: (context: TriggerHookContext<PieceAuth, TriggerProps, TS>) => Promise<void>
    onDisable: (context: TriggerHookContext<PieceAuth, TriggerProps, TS>) => Promise<void>
    run: (context: TriggerHookContext<PieceAuth, TriggerProps, TS>) => Promise<unknown[]>
    test?: (context: TriggerHookContext<PieceAuth, TriggerProps, TS>) => Promise<unknown[]>
    requireAuth?: boolean
    sampleData: unknown
  }
}

export class ITrigger<
  TS extends TriggerStrategy,
  PieceAuth extends PieceAuthProperty,
  TriggerProps extends PiecePropertyMap,
> implements TriggerBase {
  constructor(
    public readonly name: string,
    public readonly displayName: string,
    public readonly description: string,
    public readonly props: TriggerProps,
    public readonly type: TS,
    public readonly onEnable: (ctx: TriggerHookContext<PieceAuth, TriggerProps, TS>) => Promise<void>,
    public readonly onDisable: (ctx: TriggerHookContext<PieceAuth, TriggerProps, TS>) => Promise<void>,
    public readonly run: (ctx: TriggerHookContext<PieceAuth, TriggerProps, TS>) => Promise<unknown[]>,
    public readonly test: (ctx: TriggerHookContext<PieceAuth, TriggerProps, TS>) => Promise<unknown[]>,
    public sampleData: unknown,
    public readonly requireAuth: boolean = true,
  ) { }
}

export type Trigger<
  PieceAuth extends PieceAuthProperty = any,
  TriggerProps extends PiecePropertyMap = any,
  S extends TriggerStrategy = TriggerStrategy,
> = ITrigger<S, PieceAuth, TriggerProps>

export const createTrigger = <
  TS extends TriggerStrategy,
  PieceAuth extends PieceAuthProperty,
  TriggerProps extends PiecePropertyMap,
>(params: CreateTriggerParams<PieceAuth, TriggerProps, TS>) => {
  return new ITrigger(
    params.trigger.name,
    params.trigger.displayName,
    params.trigger.description,
    params.trigger.props,
    params.trigger.type,
    params.trigger.onEnable,
    params.trigger.onDisable,
    params.trigger.run,
    params.trigger.test ?? (() => Promise.resolve([params.trigger.sampleData])),
    params.trigger.sampleData,
    params.trigger.requireAuth,
  )
}
