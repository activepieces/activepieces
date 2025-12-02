import { Trigger } from './trigger/trigger';
import { Action } from './action/action';
import {
  EventPayload,
  ParseEventResponse,
  PieceCategory,
} from '@activepieces/shared';
import { PieceBase, PieceMetadata} from './piece-metadata';
import { PieceAuthProperty } from './property/authentication';
import { ServerContext } from './context';
import { ContextVersion, LATEST_CONTEXT_VERSION, MINIMUM_SUPPORTED_RELEASE_AFTER_CONTEXT_VERSIONING } from './context/versioning';
import * as semver from 'semver';



export class Piece<PieceAuth extends PieceAuthProperty | undefined = PieceAuthProperty>
  implements Omit<PieceBase, 'version' | 'name'>
{
  private readonly _actions: Record<string, Action<PieceAuth>> = {};
  private readonly _triggers: Record<string, Trigger<PieceAuth>> = {};
  // this method didn't exist in older version
  public getContextInfo: (() => { version: ContextVersion } )| undefined = () => ({ version: LATEST_CONTEXT_VERSION }); 
  constructor(
    public readonly displayName: string,
    public readonly logoUrl: string,
    public readonly authors: string[],
    public readonly events: PieceEventProcessors | undefined,
    actions: Action<PieceAuth>[],
    triggers: Trigger<PieceAuth>[],
    public readonly categories: PieceCategory[],
    public readonly auth?: PieceAuth,
    public readonly minimumSupportedRelease: string = MINIMUM_SUPPORTED_RELEASE_AFTER_CONTEXT_VERSIONING,
    public readonly maximumSupportedRelease?: string,
    public readonly description = '',
  ) {
    if(semver.lt(minimumSupportedRelease, MINIMUM_SUPPORTED_RELEASE_AFTER_CONTEXT_VERSIONING)) {
      this.minimumSupportedRelease = MINIMUM_SUPPORTED_RELEASE_AFTER_CONTEXT_VERSIONING;
    }
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
      contextInfo: this.getContextInfo?.()
    };
  }

  getAction(actionName: string): Action<PieceAuth> | undefined {
    return this._actions[actionName];
  }

  getTrigger(triggerName: string): Trigger<PieceAuth> | undefined {
    return this._triggers[triggerName];
  }

  actions() {
    return this._actions;
  }

  triggers() {
    return this._triggers;
  }
}

export const createPiece = <PieceAuth extends PieceAuthProperty | undefined>(
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
  );
};

type CreatePieceParams<
  PieceAuth extends PieceAuthProperty | undefined
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
};

type PieceEventProcessors = {
  parseAndReply: (ctx: { payload: EventPayload, server: Omit<ServerContext, 'token' | 'apiUrl'> }) => ParseEventResponse;
  verify: (ctx: {
    webhookSecret: string | Record<string, string>;
    payload: EventPayload;
    appWebhookUrl: string;
  }) => boolean;
};

type BackwardCompatiblePieceMetadata = Omit<PieceMetadata, 'name' | 'version' | 'authors' | 'i18n' | 'getContextInfo'> & {
  authors?: PieceMetadata['authors']
  i18n?: PieceMetadata['i18n']
}

