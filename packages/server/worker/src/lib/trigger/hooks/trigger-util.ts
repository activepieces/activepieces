import { assertEqual, FlowVersion, PackageType, PiecePackage, PieceTriggerSettings, TriggerType } from '@activepieces/shared'


export const triggerUtils = {
    getTriggerPiece(flowVersion: FlowVersion): PiecePackage {
        assertEqual(flowVersion.trigger.type, TriggerType.PIECE, 'trigger.type', 'PIECE')
        const { trigger } = flowVersion
        const pieceSettings = trigger.settings as PieceTriggerSettings
        const { pieceName, pieceVersion, pieceType, packageType } = pieceSettings
        switch (packageType) {
            case PackageType.ARCHIVE:
                // TODO URGENT fix
                return {
                    packageType,
                    pieceType,
                    pieceName,
                    pieceVersion,
                    archiveId: '',
                    archive: {},
                }
            case PackageType.REGISTRY:
                return {
                    packageType,
                    pieceType,
                    pieceName,
                    pieceVersion,
                }
        }
    },
}
