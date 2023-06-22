import { Trigger } from './trigger/trigger'
import { Action } from './action/action'
import { EventPayload, ParseEventResponse } from '@activepieces/shared'
import { PieceBase, PieceMetadata } from './piece-metadata'
import { PieceAuthProperty } from './property'

type CreatePieceParams<PieceAuth extends PieceAuthProperty> = {
  displayName: string
  logoUrl: string
  authors?: string[]
  description?: string
  auth: PieceAuth
  events?: PieceEventProcessors
  minimumSupportedRelease?: string
  maximumSupportedRelease?: string
  actions: Action<PieceAuth>[]
  triggers: Trigger<PieceAuth>[]
}

type PieceEventProcessors = {
  parseAndReply: (ctx: { payload: EventPayload }) => ParseEventResponse
  verify: (ctx: { webhookSecret: string, payload: EventPayload, appWebhookUrl: string }) => boolean
}

export class Piece<PieceAuth extends PieceAuthProperty = PieceAuthProperty> implements Omit<PieceBase, "version" | "name"> {
  private readonly _actions: Record<string, Action> = {}
  private readonly _triggers: Record<string, Trigger> = {}

  constructor(
    public readonly displayName: string,
    public readonly logoUrl: string,
    public readonly authors: string[],
    public readonly events: PieceEventProcessors | undefined,
    public readonly auth: PieceAuth,
    actions: Action<PieceAuth>[],
    triggers: Trigger<PieceAuth>[],
    public readonly minimumSupportedRelease?: string,
    public readonly maximumSupportedRelease?: string,
    public readonly description: string = '',
  ) {
    actions.forEach(action => this._actions[action.name] = action)
    triggers.forEach(trigger => this._triggers[trigger.name] = trigger)
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

export const createPiece = <PieceAuth extends PieceAuthProperty>(params: CreatePieceParams<PieceAuth>) => {
  return new Piece(
    params.displayName,
    params.logoUrl,
    params.authors ?? [],
    params.events,
    params.auth,
    params.actions,
    params.triggers,
    params.minimumSupportedRelease,
    params.maximumSupportedRelease,
    params.description,
  )
}
