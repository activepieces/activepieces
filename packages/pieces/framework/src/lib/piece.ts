import { ITrigger, type Trigger, type TriggerStrategy } from './trigger/trigger'
import { Action, ActionRunner, IAction } from './action/action'
import { EventPayload, ParseEventResponse } from '@activepieces/shared'
import { PieceBase, PieceMetadata } from './piece-metadata'
import { DynamicDropdownOptions, DynamicDropdownOptionsContext, PieceAuthProperty, PiecePropertyMap } from './property'
import { TriggerHookContext } from './context'

type CreateParams<AuthProp> = {
  displayName: string
  logoUrl: string
  authors?: string[]
  description?: string
  events?: PieceEventProcessors
  minimumSupportedRelease?: string
  maximumSupportedRelease?: string
  auth: AuthProp
}

type AddActionParams<AuthProp extends PieceAuthProperty, Props extends PiecePropertyMap> = {
  name: string
  displayName: string
  description: string
  props: Props
  run: ActionRunner<AuthProp, Props>
  sampleData?: unknown
}

type AddTriggerParams<
  TS extends TriggerStrategy,
  AuthProp extends PieceAuthProperty,
  Props extends PiecePropertyMap,
> = {
    name: string
    displayName: string
    description: string
    props: Props
    type: TS
    onEnable: (context: TriggerHookContext<TS, AuthProp, Props>) => Promise<void>
    onDisable: (context: TriggerHookContext<TS, AuthProp, Props>) => Promise<void>
    run: (context: TriggerHookContext<TS, AuthProp, Props>) => Promise<unknown[]>
    test?: (context: TriggerHookContext<TS, AuthProp, Props>) => Promise<unknown[]>
    sampleData: unknown
}

type PieceEventProcessors = {
  parseAndReply: (ctx: { payload: EventPayload }) => ParseEventResponse
  verify: (ctx: { webhookSecret: string, payload: EventPayload, appWebhookUrl: string }) => boolean
}

export class Piece<AuthProp extends PieceAuthProperty = PieceAuthProperty> implements Omit<PieceBase, "version" | "name"> {
  private readonly _actions: Record<string, Action> = {}
  private readonly _triggers: Record<string, Trigger> = {}

  private constructor(
    public readonly displayName: string,
    public readonly logoUrl: string,
    public readonly authors: string[],
    public readonly events: PieceEventProcessors | undefined,
    public readonly auth: AuthProp,
    public readonly minimumSupportedRelease?: string,
    public readonly maximumSupportedRelease?: string,
    public readonly description: string = '',
  ) {}

  static create<AuthProp extends PieceAuthProperty>(params: CreateParams<AuthProp>) {
    return new Piece(
      params.displayName,
      params.logoUrl,
      params.authors ?? [],
      params.events,
      params.auth,
      params.minimumSupportedRelease,
      params.maximumSupportedRelease,
      params.description,
    )
  }

  addAction<Props extends PiecePropertyMap>(params: AddActionParams<AuthProp, Props>) {
    const { name, displayName, description, props, run, sampleData } = params

    const action = new IAction(
      name,
      displayName,
      description,
      props,
      run,
      sampleData,
    )

    this._actions[action.name] = action
  }

  addTrigger<TS extends TriggerStrategy, Props extends PiecePropertyMap>(
    params: AddTriggerParams<TS, AuthProp, Props>,
  ) {
    const trigger = new ITrigger(
      params.name,
      params.displayName,
      params.description,
      params.props,
      params.type,
      params.onEnable,
      params.onDisable,
      params.run,
      params.test ?? (() => Promise.resolve([params.sampleData])),
      params.sampleData
    )

    this._triggers[trigger.name] = trigger
  }

  metadata(): Omit<PieceMetadata, "name" | "version"> {
    return {
      displayName: this.displayName,
      logoUrl: this.logoUrl,
      actions: this._actions,
      triggers: this._triggers,
      description: this.description,
      auth: this.auth,
      minimumSupportedRelease: this.minimumSupportedRelease,
      maximumSupportedRelease: this.maximumSupportedRelease,
    }
  }

  getAction(actionName: string): Action | undefined {
    return this._actions[actionName]
  }

  getTrigger(triggerName: string): Trigger | undefined {
    return this._triggers[triggerName]
  }

  actions() {
    return this._actions
  }

  triggers() {
    return this._triggers
  }
}
