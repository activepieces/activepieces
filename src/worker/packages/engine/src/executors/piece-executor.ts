import {ConfigurationValue} from "pieces/dist/src/framework/config/configuration-value.model";
import {pieces} from "pieces/dist/src/apps";
import {Piece} from "pieces/dist/src/framework/piece";

export class PieceExecutor {
    public async exec(pieceName: string, actionName: string, config: ConfigurationValue) {
        const piece = this.getPiece(pieceName);

        return await piece.runAction(actionName, config);
    }

    private getPiece(pieceName: string): Piece {
        const piece = pieces.find(app => app.name === pieceName);
        if (!piece) {
            throw new Error(`error=piece_not_found piece_name=${pieceName}`);
        }
        return piece;
    }
}
