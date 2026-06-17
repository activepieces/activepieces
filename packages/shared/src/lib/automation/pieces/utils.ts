import { assertNotNullOrUndefined } from '../../core/common'
import { ActivepiecesError, ErrorCode } from '../../core/common/activepieces-error'

/**
 * @param {string} pieceName - starts with `@activepieces/piece-`
 * @param {string} pieceVersion - the version of the piece
 * @returns {string} the package alias for the piece, e.g. `@activepieces/piece-activepieces-0.0.1`
 */
export const getPackageAliasForPiece = (params: GetPackageAliasForPieceParams): string => {
    const { pieceName, pieceVersion } = params
    return `${pieceName}-${pieceVersion}`
}

/**
 * @param {string} alias - e.g. piece-activepieces or @publisher/piece-activepieces or activepieces or @publisher/activepieces 
 * @returns {string} the piece name, e.g. activepieces
 */
export const getPieceNameFromAlias = (alias: string): string => {
    const fullPieceName =  alias.startsWith('@') ? alias.split('/').pop() : alias
    assertNotNullOrUndefined(fullPieceName, 'Full piece name')
    if (fullPieceName.startsWith('piece-')) {
        return fullPieceName.split('-').slice(1).join('-')
    }
    return fullPieceName
}

/**
 * @param {string} alias - e.g. `@activepieces/piece-activepieces-0.0.1`
 * @returns {string} the piece name, e.g. `@activepieces/piece-activepieces`
 */
export const trimVersionFromAlias = (alias: string): string => {
    return alias.split('-').slice(0, -1).join('-')
}



export const extractPieceFromModule = <T>(params: ExtractPieceFromModuleParams): T => {
    const { module, pieceName, pieceVersion } = params
    const exports = Object.values(module)
    const constructors = []
    for (const e of exports) {
        if (e !== null && e !== undefined && e.constructor.name === 'Piece') {
            return e as T
        }
        constructors.push(e?.constructor?.name)
    }

    throw new ActivepiecesError({
        code: ErrorCode.ENTITY_NOT_FOUND,
        params: {
            entityType: 'piece',
            entityId: pieceName,
            message: `Failed to extract piece from module (version: ${pieceVersion}), found constructors: ${constructors.join(', ')}`,
            extra: { pieceName, pieceVersion },
        },
    })
}

export { getPieceMajorAndMinorVersion } from './version-utils'

type GetPackageAliasForPieceParams = {
    pieceName: string
    pieceVersion: string
}

type ExtractPieceFromModuleParams = {
    module: Record<string, unknown>
    pieceName: string
    pieceVersion: string
}
export const MAX_KEY_LENGTH_FOR_CORWDIN = 512
