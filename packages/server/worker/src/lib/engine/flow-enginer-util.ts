import { Action, ActionType, assertEqual, CodeAction, EXACT_VERSION_PATTERN, flowHelper, FlowVersion, PackageType, PieceActionSettings, PiecePackage, PieceTriggerSettings, PieceType, Trigger, TriggerType } from '@activepieces/shared'
import { engineApiService } from '../api/server-api.service'
import { CodeArtifact } from './engine-runner'

type ExtractFlowPiecesParams = {
    flowVersion: FlowVersion
    engineToken: string
}

export const pieceEngineUtil = {
    getCodeSteps(flowVersion: FlowVersion): CodeArtifact[] {
        const steps = flowHelper.getAllSteps(flowVersion.trigger)
        return steps.filter((step) => step.type === ActionType.CODE).map((step) => {
            const codeAction = step as CodeAction
            return {
                name: codeAction.name,
                flowVersionId: flowVersion.id,
                flowVersionState: flowVersion.state,
                sourceCode: codeAction.settings.sourceCode,
            }
        })
    },
    async extractFlowPieces({
        flowVersion,
        engineToken,
    }: ExtractFlowPiecesParams): Promise<PiecePackage[]> {
        const steps = flowHelper.getAllSteps(flowVersion.trigger)
        const pieces = steps.filter((step) => step.type === TriggerType.PIECE || step.type === ActionType.PIECE).map((step) => {
            const { packageType, pieceType, pieceName, pieceVersion } = step.settings as PieceTriggerSettings | PieceActionSettings
            return pieceEngineUtil.getExactPieceVersion(engineToken, {
                packageType,
                pieceType,
                pieceName,
                pieceVersion,
            })
        })
        return Promise.all(pieces)
    },
    async getTriggerPiece(engineToken: string, flowVersion: FlowVersion): Promise<PiecePackage> {
        assertEqual(flowVersion.trigger.type, TriggerType.PIECE, 'trigger.type', 'PIECE')
        const { trigger } = flowVersion
        return this.getExactPieceForStep(engineToken, trigger)
    },

    async getExactPieceVersion(engineToken: string, piece: BasicPieceInformation): Promise<PiecePackage> {
        const { pieceName, pieceVersion, pieceType, packageType } = piece

        switch (packageType) {
            case PackageType.ARCHIVE: {
                const pieceMetadata = await engineApiService(engineToken).getPiece(pieceName, {
                    version: pieceVersion,
                })
                return {
                    packageType,
                    pieceType,
                    pieceName,
                    pieceVersion: pieceMetadata.version,
                    archiveId: pieceMetadata.archiveId!,
                    archive: {},
                }
            }
            case PackageType.REGISTRY: {
                const exactVersion = EXACT_VERSION_PATTERN.test(pieceVersion)
                const version = exactVersion ? pieceVersion : (await engineApiService(engineToken).getPiece(pieceName, {
                    version: pieceVersion,
                })).version
                return {
                    packageType,
                    pieceType,
                    pieceName,
                    pieceVersion: version,
                }

            }
        }
    },
    async getExactPieceForStep(engineToken: string, step: Action | Trigger): Promise<PiecePackage> {
        const pieceSettings = step.settings as PieceTriggerSettings | PieceActionSettings
        const { pieceName, pieceVersion, pieceType, packageType } = pieceSettings
        return this.getExactPieceVersion(engineToken, {
            pieceName,
            pieceVersion,
            pieceType,
            packageType,
        })
    },
    async lockPieceInFlowVersion({
        engineToken,
        flowVersion,
        stepName,
    }: {
        engineToken: string
        flowVersion: FlowVersion
        stepName: string
    }): Promise<FlowVersion> {
        return flowHelper.transferFlowAsync(flowVersion, async (step) => {
            if (step.name !== stepName) {
                return step
            }
            if (step.type === TriggerType.PIECE) {
                const piece = await pieceEngineUtil.getExactPieceForStep(engineToken, step)
                return {
                    ...step,
                    settings: {
                        ...step.settings,
                        pieceVersion: piece.pieceVersion,
                    },
                }
            }
            if (step.type === ActionType.PIECE) {
                const piece = await pieceEngineUtil.getExactPieceForStep(engineToken, step)
                return {
                    ...step,
                    settings: {
                        ...step.settings,
                        pieceVersion: piece.pieceVersion,
                    },
                }
            }
            return step
        })
    },
}

export type BasicPieceInformation = {
    pieceName: string
    pieceVersion: string
    pieceType: PieceType
    packageType: PackageType
}