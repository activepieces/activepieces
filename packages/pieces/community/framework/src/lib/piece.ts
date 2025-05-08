import { Trigger } from './trigger/trigger';
import { Action } from './action/action';
import {
  EventPayload,
  LocalesEnum,
  ParseEventResponse,
  PieceCategory,
} from '@activepieces/shared';
import { PieceBase, PieceMetadata} from './piece-metadata';
import { PieceAuthProperty } from './property/authentication';

export class Piece<PieceAuth extends PieceAuthProperty = PieceAuthProperty>
  implements Omit<PieceBase, 'version' | 'name'>
{
  private readonly _actions: Record<string, Action> = {};
  private readonly _triggers: Record<string, Trigger> = {};

  constructor(
    public readonly displayName: string,
    public readonly logoUrl: string,
    public readonly authors: string[],
    public readonly events: PieceEventProcessors | undefined,
    actions: Action<PieceAuth>[],
    triggers: Trigger<PieceAuth>[],
    public readonly categories: PieceCategory[],
    public readonly auth?: PieceAuth,
    public readonly minimumSupportedRelease?: string,
    public readonly maximumSupportedRelease?: string,
    public readonly description = '',
    public readonly i18n?: Partial<Record<LocalesEnum, Record<string, string>>>,
  ) {
    actions.forEach((action) => (this._actions[action.name] = action));
    triggers.forEach((trigger) => (this._triggers[trigger.name] = trigger));
  }

  metadata(): BackwardCompatiblePieceMetadata {
    return {
      displayName: this.displayName,
      logoUrl: this.logoUrl,
      actions: this._actions,
      triggers: this._triggers,
      categories: this.categories,
      description: this.description,
      authors: this.authors,
      auth: this.auth,
      minimumSupportedRelease: this.minimumSupportedRelease,
      maximumSupportedRelease: this.maximumSupportedRelease,
      i18n: this.i18n,
    };
  }

  getAction(actionName: string): Action | undefined {
    return this._actions[actionName];
  }

  getTrigger(triggerName: string): Trigger | undefined {
    return this._triggers[triggerName];
  }

  actions() {
    return this._actions;
  }

  triggers() {
    return this._triggers;
  }
}

export const createPiece = <PieceAuth extends PieceAuthProperty>(
  params: CreatePieceParams<PieceAuth>
) => {
  return new Piece(
    params.displayName,
    params.logoUrl,
    params.authors ?? [],
    params.events,
    params.actions,
    params.triggers,
    params.categories ?? [],
    params.auth ?? undefined,
    params.minimumSupportedRelease,
    params.maximumSupportedRelease,
    params.description,
    params.i18n,
  );
};

type CreatePieceParams<
  PieceAuth extends PieceAuthProperty = PieceAuthProperty
> = {
  displayName: string;
  logoUrl: string;
  authors: string[];
  description?: string;
  auth: PieceAuth | undefined;
  events?: PieceEventProcessors;
  minimumSupportedRelease?: string;
  maximumSupportedRelease?: string;
  actions: Action<PieceAuth>[];
  triggers: Trigger<PieceAuth>[];
  categories?: PieceCategory[];
  i18n?: Partial<Record<LocalesEnum, Record<string, string>>>;
};

type PieceEventProcessors = {
  parseAndReply: (ctx: { payload: EventPayload }) => ParseEventResponse;
  verify: (ctx: {
    webhookSecret: string | Record<string, string>;
    payload: EventPayload;
    appWebhookUrl: string;
  }) => boolean;
};

type BackwardCompatiblePieceMetadata = Omit<PieceMetadata, 'name' | 'version' | 'authors' | 'i18n'> & {
  authors?: PieceMetadata['authors']
  i18n?: PieceMetadata['i18n']
}

