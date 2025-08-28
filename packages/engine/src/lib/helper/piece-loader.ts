import { Action, getPiecePath, Piece, PiecePropertyMap, Trigger } from '@activepieces/pieces-framework'
import { ActivepiecesError, ErrorCode, ExecutePropsOptions, extractPieceFromModule, getPackageAliasForPiece, isNil } from '@activepieces/shared'


const loadPieceOrThrow = async (
    { pieceName, pieceVersion, pieceSource }:
    { pieceName: string, pieceVersion: string, pieceSource: string },
): Promise<Piece> => {
    const packageName = getPackageAlias({
        pieceName,
        pieceVersion,
        pieceSource,
    })

    const module = await import(await getPiecePath({
        packageName,
        pieceSource,
    }))

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
    pieceSource: string
},
): Promise<{ piece: Piece, pieceTrigger: Trigger }> => {
    const { pieceName, pieceVersion, triggerName, pieceSource } = params
    const piece = await loadPieceOrThrow({ pieceName, pieceVersion, pieceSource })
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
    pieceSource: string
},
): Promise<{ piece: Piece, pieceAction: Action }> => {
    const { pieceName, pieceVersion, actionName, pieceSource } = params

    const piece = await loadPieceOrThrow({ pieceName, pieceVersion, pieceSource })
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

const getPropOrThrow = async ({ params, pieceSource }: { params: ExecutePropsOptions, pieceSource: string }) => {
    const { piece: piecePackage, actionOrTriggerName, propertyName } = params

    const piece = await loadPieceOrThrow({ pieceName: piecePackage.pieceName, pieceVersion: piecePackage.pieceVersion, pieceSource })

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

const getPackageAlias = ({ pieceName, pieceVersion, pieceSource }: {
    pieceName: string
    pieceSource: string
    pieceVersion: string
}) => {
    if (pieceSource.trim() === 'FILE') {
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
    getPackageAlias,
}
