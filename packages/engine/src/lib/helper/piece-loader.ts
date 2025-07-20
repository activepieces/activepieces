import { Action, Piece, PiecePropertyMap, Trigger } from '@activepieces/pieces-framework'
import { ActivepiecesError, ErrorCode, ExecutePropsOptions, extractPieceFromModule, getPackageAliasForPiece, isNil } from '@activepieces/shared'


const loadPieceOrThrow = async (
    { pieceName, pieceVersion, piecesSource }:
    { pieceName: string, pieceVersion: string, piecesSource: string },
): Promise<Piece> => {
    const packageName = getPackageAlias({
        pieceName,
        pieceVersion,
        piecesSource,
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
                message: 'Piece not found in the engine',
            },
        })
    }

    return piece
}

const getPieceAndTriggerOrThrow = async (params: {
    pieceName: string
    pieceVersion: string
    triggerName: string
    piecesSource: string
},
): Promise<{ piece: Piece, pieceTrigger: Trigger }> => {
    const { pieceName, pieceVersion, triggerName, piecesSource } = params
    const piece = await loadPieceOrThrow({ pieceName, pieceVersion, piecesSource })
    const trigger = piece.getTrigger(triggerName)

    if (trigger === undefined) {
        throw new Error(`trigger not found, pieceName=${pieceName}, triggerName=${triggerName}`)
    }

    return {
        piece,
        pieceTrigger: trigger,
    }
}

const getPieceAndActionOrThrow = async (params: {
    pieceName: string
    pieceVersion: string
    actionName: string
    piecesSource: string
},
): Promise<{ piece: Piece, pieceAction: Action }> => {
    const { pieceName, pieceVersion, actionName, piecesSource } = params

    const piece = await loadPieceOrThrow({ pieceName, pieceVersion, piecesSource })
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

const getPropOrThrow = async ({ params, piecesSource }: { params: ExecutePropsOptions, piecesSource: string }) => {
    const { piece: piecePackage, actionOrTriggerName, propertyName } = params

    const piece = await loadPieceOrThrow({ pieceName: piecePackage.pieceName, pieceVersion: piecePackage.pieceVersion, piecesSource })

    const actionOrTrigger = piece.getAction(actionOrTriggerName) ?? piece.getTrigger(actionOrTriggerName)

    if (isNil(actionOrTrigger)) {
        throw new ActivepiecesError({
            code: ErrorCode.STEP_NOT_FOUND,
            params: {
                pieceName: piecePackage.pieceName,
                pieceVersion: piecePackage.pieceVersion,
                stepName: actionOrTriggerName,
            },
        })
    }

    const prop = (actionOrTrigger.props  as PiecePropertyMap)[propertyName]

    if (isNil(prop)) {
        throw new ActivepiecesError({
            code: ErrorCode.CONFIG_NOT_FOUND,
            params: {
                pieceName: piecePackage.pieceName,
                pieceVersion: piecePackage.pieceVersion,
                stepName: actionOrTriggerName,
                configName: propertyName,
            },
        })
    }

    return prop
}

const getPackageAlias = ({ pieceName, pieceVersion, piecesSource }: {
    pieceName: string
    piecesSource: string
    pieceVersion: string
}) => {
    if (piecesSource.trim() === 'FILE') {
        return pieceName
    }

    return getPackageAliasForPiece({
        pieceName,
        pieceVersion,
    })
}


export const pieceLoader = {
    loadPieceOrThrow,
    getPieceAndTriggerOrThrow,
    getPieceAndActionOrThrow,
    getPropOrThrow,
}
