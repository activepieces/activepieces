/**
 * @param {string} pieceName - starts with `@activepieces/piece-`
 * @param {string} pieceVersion - the version of the piece
 * @returns {string} the package alias for the piece, e.g. `@activepieces/piece-activepieces-0.0.1`
 */
export declare const getPackageAliasForPiece: (params: GetPackageAliasForPieceParams) => string;
/**
 * @param {string} alias - e.g. piece-activepieces or @publisher/piece-activepieces or activepieces or @publisher/activepieces
 * @returns {string} the piece name, e.g. activepieces
 */
export declare const getPieceNameFromAlias: (alias: string) => string;
/**
 * @param {string} alias - e.g. `@activepieces/piece-activepieces-0.0.1`
 * @returns {string} the piece name, e.g. `@activepieces/piece-activepieces`
 */
export declare const trimVersionFromAlias: (alias: string) => string;
export declare const extractPieceFromModule: <T>(params: ExtractPieceFromModuleParams) => T;
export declare const getPieceMajorAndMinorVersion: (pieceVersion: string) => string;
type GetPackageAliasForPieceParams = {
    pieceName: string;
    pieceVersion: string;
};
type ExtractPieceFromModuleParams = {
    module: Record<string, unknown>;
    pieceName: string;
    pieceVersion: string;
};
export declare const MAX_KEY_LENGTH_FOR_CORWDIN = 512;
export {};
