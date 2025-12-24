import { I18nForPiece, PieceMetadataModel, PieceMetadataModelSummary } from "./piece-metadata";
import { LocalesEnum } from "@activepieces/shared";
export declare const pieceTranslation: {
    translatePiece: <T extends PieceMetadataModelSummary | PieceMetadataModel>(piece: T, locale?: LocalesEnum) => T;
    /**Gets the piece metadata regardles of piece location (node_modules or dist), wasn't included inside piece.metadata() for backwards compatibility issues (if an old ap version installs a new piece it would fail)*/
    initializeI18n: (pieceOutputPath: string) => Promise<I18nForPiece | undefined>;
    pathsToValuesToTranslate: string[];
};
