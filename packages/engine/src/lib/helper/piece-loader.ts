import { Action, Piece } from '@activepieces/pieces-framework'
import { ActivepiecesError, ErrorCode, ExecutePropsOptions, extractPieceFromModule, getPackageAliasForPiece, isNil } from '@activepieces/shared'


const loadPieceOrThrow = async (
    { pieceName, pieceVersion, environment }:
    { pieceName: string, pieceVersion: string, environment: string },
): Promise<Piece> => {
    const packageName = getPackageAlias({
        pieceName,
        pieceVersion,
        environment,
    })

    const module = await import(packageName)
    const piece = extractPieceFromModule<Piece>({
        module,
        pieceName,
        pieceVersion,
    })

    if (isNil(piece)) {
        throw new ActivepiecesError({
            code: ErrorCode.PIECE_NOT_FOUND,
            params: {
                pieceName,
                pieceVersion,
            },
        })
    }

    return piece
}

const getPieceAndActionOrThrow = async (params: {
    pieceName: string
    pieceVersion: string
    actionName: string
    environment: string
},
): Promise<{ piece: Piece, pieceAction: Action }> => {
    const { pieceName, pieceVersion, actionName, environment } = params

    const piece = await loadPieceOrThrow({ pieceName, pieceVersion, environment })
    const pieceAction = piece.getAction(actionName)

    if (isNil(pieceAction)) {
        throw new ActivepiecesError({
            code: ErrorCode.STEP_NOT_FOUND,
            params: {
                pieceName,
                pieceVersion,
                stepName: actionName,
            },
        })
    }

    return {
        piece,
        pieceAction,
    }
}

const getPropOrThrow = async ({ params, environment }: { params: ExecutePropsOptions, environment: string }) => {
    const { piece: piecePackage, stepName, propertyName } = params

    const piece = await loadPieceOrThrow({ pieceName: piecePackage.pieceName, pieceVersion: piecePackage.pieceVersion, environment })

    const action = piece.getAction(stepName) ?? piece.getTrigger(stepName)

    if (isNil(action)) {
        throw new ActivepiecesError({
            code: ErrorCode.STEP_NOT_FOUND,
            params: {
                pieceName: piecePackage.pieceName,
                pieceVersion: piecePackage.pieceVersion,
                stepName,
            },
        })
    }

    const prop = action.props[propertyName]

    if (isNil(prop)) {
        throw new ActivepiecesError({
            code: ErrorCode.CONFIG_NOT_FOUND,
            params: {
                pieceName: piecePackage.pieceName,
                pieceVersion: piecePackage.pieceVersion,
                stepName,
                configName: propertyName,
            },
        })
    }

    return prop
}

const getPackageAlias = ({ pieceName, pieceVersion, environment }: {
    pieceName: string
    environment: string
    pieceVersion: string
}) => {
    if (environment === 'dev') {
        return pieceName
    }

    return getPackageAliasForPiece({
        pieceName,
        pieceVersion,
    })
}


export const pieceLoader = {
    loadPieceOrThrow,
    getPieceAndActionOrThrow,
    getPropOrThrow,
}
