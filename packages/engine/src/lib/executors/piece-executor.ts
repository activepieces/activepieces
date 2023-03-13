import { globals } from '../globals';
import { createContextStore } from '../services/storage.service';
import { connectionService } from '../services/connections.service';
import { pieceHelper } from '../helper/piece-helper';

type PieceExecParams = {
  pieceName: string,
  actionName: string,
  config: Record<string, unknown>,
}

export class PieceExecutor {
  public async exec(params: PieceExecParams) {
    const { pieceName, actionName, config } = params;
    const piece = await pieceHelper.loadPiece(pieceName);
    const action = piece?.getAction(actionName);

    if (action === undefined) {
      throw new Error(`error=action_not_found action_name=${actionName}`);
    }

    return await action.run({
      store: createContextStore(globals.flowId),
      propsValue: config,
      connections: {
        get: async (key: string) => {
          try {
            const connection = await connectionService.obtain(key);
            if (!connection) {
              return null;
            }
            return connection;
          } catch (e) {
            return null;
          }
        }
      }
    });
  }
}
