import type { Trigger } from './trigger/trigger';
import { Action } from './action/action';
import { PieceBase, PieceMetadata } from '@activepieces/shared';

export class Piece implements PieceBase {
  private readonly _actions: Map<string, Action>;
  private readonly _triggers: Map<string, Trigger>;

  constructor(
    public readonly name: string,
    public readonly displayName: string,
    public readonly logoUrl: string,
    public readonly authors: string[],
    public readonly version: string,
    actions: Action[],
    triggers: Trigger[],
    public readonly description: string = ''
  ) {
    this._actions = new Map(
      actions.map((action) => [action.name, action])
    );

    this._triggers = new Map(
      triggers.map((trigger) => [trigger.name, trigger])
    );
  }

  getAction(actionName: string): Action | undefined {
    if (!(this._actions.has(actionName))) {
      return undefined;
    }
    return this._actions.get(actionName);
  }

  getTrigger(triggerName: string): Trigger | undefined {
    if (!(this._triggers.has(triggerName))) {
      return undefined;
    }
    return this._triggers.get(triggerName);
  }

  metadata(): PieceMetadata {
    return {
      name: this.name,
      displayName: this.displayName,
      logoUrl: this.logoUrl,
      actions: this._actions,
      triggers: this._triggers,
      description: this.description,
      version: this.version,
    };
  }
}

export const createPiece = (request: {
  name: string;
  displayName: string;
  logoUrl: string;
  authors?: string[],
  actions: Action[];
  triggers: Trigger[];
  description?: string;
  version: string;
}): Piece =>
  new Piece(
    request.name,
    request.displayName,
    request.logoUrl,
    request.authors ?? [],
    request.version,
    request.actions,
    request.triggers,
    request.description
  );
