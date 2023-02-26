import { pieces } from '@activepieces/pieces-apps';
import { Piece } from '@activepieces/framework';
import { globals } from '../globals';
import { createContextStore } from '../services/storage.service';

export class PieceExecutor {
  public async exec(
    pieceName: string,
    actionName: string,
    config: Record<string, any>
  ) {
    const piece = this.getPiece(pieceName);

    return await piece.getAction(actionName)!.run({
      store: createContextStore(globals.flowId),
      propsValue: config
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
