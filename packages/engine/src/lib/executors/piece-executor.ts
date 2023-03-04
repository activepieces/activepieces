import { pieces } from '@activepieces/pieces-apps';
import { Piece } from '@activepieces/framework';
import { globals } from '../globals';
import { createContextStore } from '../services/storage.service';
import { connectionService } from '../services/connections.service';

type PieceExecParams = {
  pieceName: string,
  pieceVersion: string,
  actionName: string,
  config: Record<string, unknown>,
}

export class PieceExecutor {
  public async exec(params: PieceExecParams) {
    const { pieceName, pieceVersion, actionName, config } = params;
    const piece = this.getPiece(pieceName);
    const action = piece.getAction(actionName);
    if(action === undefined) {
      throw new Error(`error=action_not_found action_name=${actionName}`);
    }

    return await action.run({
      store: createContextStore(globals.flowId),
      propsValue: config,
      connections: {
        get: async (key: string) => {
          const connection = await connectionService.obtain(key);
          if (!connection) {
            throw new Error(`error=connection_not_found connection_name=${key}`);
          }
          return connection;
        }
      }
    });
  }

  private getPiece(pieceName: string): Piece {
    const piece = pieces.find((app) => app.name === pieceName);
    if (!piece) {
      throw new Error(`error=piece_not_found piece_name=${pieceName}`);
    }
    return piece;
  }
}
