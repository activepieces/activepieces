import type { Trigger } from './trigger/trigger';
import { Action, ActionRunner, IAction } from './action/action';
import { EventPayload, ParseEventResponse } from '@activepieces/shared';
import { PieceBase, PieceMetadata } from './piece-metadata';
import { PieceAuthProperty, PiecePropertyMap } from './property';

type AddActionParams<Props extends PiecePropertyMap, AuthPropValue> = {
  name: string
  displayName: string
  description: string
  props: Props
  run: ActionRunner<Props, AuthPropValue>
  sampleData?: unknown
}

type PieceAuthPropValue<T extends PieceAuthProperty> = T extends { required: true } ? T['valueSchema'] : T['valueSchema'] | undefined

export class Piece<AuthProp extends PieceAuthProperty> implements Omit<PieceBase, "version" | "name"> {
  private readonly _actions: Record<string, Action>;
  private readonly _triggers: Record<string, Trigger>;

  constructor(
    public readonly displayName: string,
    public readonly logoUrl: string,
    public readonly authors: string[],
    public readonly events: {
      parseAndReply: (ctx: {payload: EventPayload}) => ParseEventResponse;
      verify: (ctx: { webhookSecret: string, payload: EventPayload, appWebhookUrl: string }) => boolean;
    } | undefined,
    actions: Action[],
    triggers: Trigger[],
    public readonly auth: AuthProp,
    public readonly minimumSupportedRelease?: string,
    public readonly maximumSupportedRelease?: string,
    public readonly description: string = ''
  ) {
    this._actions = Object.fromEntries(
      actions.map((action) => [action.name, action])
    );

    this._triggers = Object.fromEntries(
      triggers.map((trigger) => [trigger.name, trigger])
    );
  }

  getAction(actionName: string): Action | undefined {
    if (!(actionName in this._actions)) {
      return undefined;
    }
    return this._actions[actionName];
  }

  getTrigger(triggerName: string): Trigger | undefined {
    if (!(triggerName in this._triggers)) {
      return undefined;
    }
    return this._triggers[triggerName];
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
    };
  }

  actions(){
    return this._actions;
  }

  triggers(){
    return this._triggers;
  }

  addAction<Props extends PiecePropertyMap> (params: AddActionParams<Props, PieceAuthPropValue<AuthProp>>) {
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
}

export const createPiece = <AuthProp extends PieceAuthProperty>(request: {
  displayName: string;
  logoUrl: string;
  authors?: string[],
  actions: Action[];
  triggers: Trigger[];
  description?: string;
  events?: {
    parseAndReply: (ctx: {payload: EventPayload}) => ParseEventResponse;
    verify: (ctx: { webhookSecret: string, payload: EventPayload, appWebhookUrl: string }) => boolean;
  }
  minimumSupportedRelease?: string;
  maximumSupportedRelease?: string;
  auth: AuthProp;
}): Piece<AuthProp> =>
  new Piece(
    request.displayName,
    request.logoUrl,
    request.authors ?? [],
    request.events,
    request.actions,
    request.triggers,
    request.auth,
    request.minimumSupportedRelease,
    request.maximumSupportedRelease,
    request.description
  );
