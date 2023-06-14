import type { Piece } from '../piece';
import { TriggerHookContext } from '../context';
import { TriggerBase } from '../piece-metadata';
import { PieceAuthProperty, PiecePropertyMap } from '../property/property';

export enum TriggerStrategy {
  POLLING = 'POLLING',
  WEBHOOK = 'WEBHOOK',
  APP_WEBHOOK = "APP_WEBHOOK"
}

export class ITrigger<
  S extends TriggerStrategy,
  AuthProp extends PieceAuthProperty,
  Props extends PiecePropertyMap,
> implements TriggerBase {

  /**
   * Use {@link Piece#addTrigger} to create triggers
   */
  constructor(
    public readonly name: string,
    public readonly displayName: string,
    public readonly description: string,
    public readonly props: Props,
    public readonly type: S,
    public readonly onEnable: (ctx: TriggerHookContext<S, AuthProp, Props>) => Promise<void>,
    public readonly onDisable: (ctx: TriggerHookContext<S, AuthProp, Props>) => Promise<void>,
    public readonly run: (ctx: TriggerHookContext<S, AuthProp, Props>) => Promise<unknown[]>,
    public readonly test: (ctx: TriggerHookContext<S, AuthProp, Props>) => Promise<unknown[]>,
    public sampleData: unknown
  ) {}
}

export type Trigger<
  S extends TriggerStrategy = TriggerStrategy,
  AuthProp extends PieceAuthProperty = any,
  Props extends PiecePropertyMap = any,
> = ITrigger<S, AuthProp, Props>
