import { Trigger } from './trigger/trigger'
import { Action } from './action/action'
import { EventPayload, ParseEventResponse } from '@activepieces/shared'
import { PieceBase, PieceMetadata } from './piece-metadata'
import { PieceAuthProperty } from './property'
import { Datasource } from './datasource/framework/framework'

export class Piece<PieceAuth extends PieceAuthProperty = PieceAuthProperty> implements Omit<PieceBase, "version" | "name"> {
  private readonly _actions: Record<string, Action> = {}
  private readonly _triggers: Record<string, Trigger> = {}
  private readonly _datasources: Record<string, Datasource> = {}

  constructor(
    public readonly displayName: string,
    public readonly logoUrl: string,
    public readonly authors: string[],
    public readonly events: PieceEventProcessors | undefined,
    actions: Action<PieceAuth>[],
    triggers: Trigger<PieceAuth>[],
    datasources: Datasource<PieceAuth>[],
    public readonly auth?: PieceAuth,
    public readonly minimumSupportedRelease?: string,
    public readonly maximumSupportedRelease?: string,
    public readonly description: string = '',
  ) {
    actions.forEach(action => this._actions[action.name] = action)
    triggers.forEach(trigger => this._triggers[trigger.name] = trigger)
    datasources.forEach(datasource => this._datasources[datasource.name] = datasource)
  }

  metadata(): Omit<PieceMetadata, "name" | "version"> {
    return {
      displayName: this.displayName,
      logoUrl: this.logoUrl,
      actions: this._actions,
      triggers: this._triggers,
      datasources: this._datasources,
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

  datasources(){
    return this._datasources;
  }

  triggers() {
    return this._triggers
  }
}

export const createPiece = <PieceAuth extends PieceAuthProperty>(params: CreatePieceParams<PieceAuth>) => {
  return new Piece(
    params.displayName,
    params.logoUrl,
    params.authors ?? [],
    params.events,
    params.actions,
    params.triggers,
    params.datasources ?? [],
    params.auth ?? undefined,
    params.minimumSupportedRelease,
    params.maximumSupportedRelease,
    params.description,
  )
}

type CreatePieceParams<PieceAuth extends PieceAuthProperty = PieceAuthProperty> = {
  displayName: string
  logoUrl: string
  authors?: string[]
  description?: string
  auth: PieceAuth | undefined
  events?: PieceEventProcessors
  minimumSupportedRelease?: string
  maximumSupportedRelease?: string
  actions: Action<PieceAuth>[]
  triggers: Trigger<PieceAuth>[]
  datasources?: Datasource<PieceAuth>[]
}

type PieceEventProcessors = {
  parseAndReply: (ctx: { payload: EventPayload }) => ParseEventResponse
  verify: (ctx: { webhookSecret: string, payload: EventPayload, appWebhookUrl: string }) => boolean
}
