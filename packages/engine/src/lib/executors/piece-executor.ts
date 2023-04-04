import { globals } from '../globals';
import { createContextStore } from '../services/storage.service';
import { connectionService } from '../services/connections.service';
import { pieceHelper } from '../helper/piece-helper';
import { isNil } from 'lodash';

type PieceExecParams = {
  pieceName: string,
  pieceVersion: string,
  actionName: string,
  config: Record<string, unknown>,
}

export class PieceExecutor {
  public async exec(params: PieceExecParams) {
    const { pieceName, pieceVersion, actionName, config } = params;
    const piece = await pieceHelper.loadPieceOrThrow(pieceName, pieceVersion);
    const action = piece.getAction(actionName);

    if (isNil(action)) {
      throw new Error(`error=action_not_found action_name=${actionName}`);
    }

    return await action.run({
      store: createContextStore('', globals.flowId),
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
