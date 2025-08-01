import { PieceMetadataModel } from '@activepieces/pieces-framework'
import { Action, ActionType, assertEqual, CodeAction, EXACT_VERSION_REGEX, flowStructureUtil, FlowVersion, isNil, PackageType, PieceActionSettings, PiecePackage, PieceTriggerSettings, Step, Trigger, TriggerType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { engineApiService } from '../api/server-api.service'
import { CodeArtifact } from '../runner/engine-runner-types'

export const pieceEngineUtil = (log: FastifyBaseLogger) => ({
    getCodeSteps(flowVersion: FlowVersion): CodeArtifact[] {
        const steps = flowStructureUtil.getAllSteps(flowVersion.trigger)
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
    async getTriggerPiece(engineToken: string, flowVersion: FlowVersion): Promise<PiecePackage> {
        assertEqual(flowVersion.trigger.type, TriggerType.PIECE, 'trigger.type', 'PIECE')
        const { trigger } = flowVersion
        return this.getExactPieceForStep(engineToken, trigger)
    },
    async resolveExactVersion(engineToken: string, piece: BasicPieceInformation): Promise<PiecePackage> {
        const pieceMetadata = await engineApiService(engineToken, log).getPiece(piece.pieceName, {
            version: piece.pieceVersion,
        })
        return this.enrichPieceWithArchive(engineToken, pieceMetadata)
    },
    async enrichPieceWithArchive(engineToken: string, pieceMetadata: Pick<PieceMetadataModel, 'name' | 'version' | 'packageType' | 'pieceType' | 'archiveId'>): Promise<PiecePackage> {
        const { name, version } = pieceMetadata
        switch (pieceMetadata.packageType) {
            case PackageType.ARCHIVE: {
                const { archiveId, pieceVersion } = await getPieceVersionAndArchiveId(engineToken, pieceMetadata.archiveId, {
                    pieceName: name,
                    pieceVersion: version,
                }, log)

                const archive = await engineApiService(engineToken, log).getFile(archiveId!)

                return {
                    packageType: pieceMetadata.packageType,
                    pieceType: pieceMetadata.pieceType,
                    pieceName: name,
                    pieceVersion,
                    archiveId: archiveId!,
                    archive,
                }
            }
            case PackageType.REGISTRY: {
                return {
                    packageType: pieceMetadata.packageType,
                    pieceType: pieceMetadata.pieceType,
                    pieceName: name,
                    pieceVersion: pieceMetadata.version,
                }

            }
        }
    },
    async getExactPieceForStep(engineToken: string, step: Action | Trigger): Promise<PiecePackage> {
        const pieceSettings = step.settings as PieceTriggerSettings | PieceActionSettings
        const { pieceName, pieceVersion } = pieceSettings
        return this.resolveExactVersion(engineToken, {
            pieceName,
            pieceVersion,
        })
    },
    async lockSingleStepPieceVersion(params: LockFlowVersionParams): Promise<FlowVersion> {
        const { engineToken, flowVersion } = params
        const allSteps = flowStructureUtil.getAllSteps(flowVersion.trigger)
        const pieceSteps = allSteps.filter(step => step.name === params.stepName && isPieceStep(step))
        const pieces = await Promise.all(pieceSteps.map(step => this.getExactPieceForStep(engineToken, step)))
        const pieceVersions = pieces.reduce((acc, piece, index) => ({
            ...acc,
            [pieceSteps[index].name]: piece.pieceVersion,
        }), {} as Record<string, string>)
        return flowStructureUtil.transferFlow(flowVersion, (step) => {
            if (pieceVersions[step.name]) {
                step.settings.pieceVersion = pieceVersions[step.name]
            }
            return step
        })
    },
})

async function getPieceVersionAndArchiveId(engineToken: string, archiveId: string | undefined, piece: BasicPieceInformation, log: FastifyBaseLogger): Promise<{ pieceVersion: string, archiveId?: string }> {
    const isExactVersion = EXACT_VERSION_REGEX.test(piece.pieceVersion)

    if (!isNil(archiveId) && isExactVersion) {
        return {
            pieceVersion: piece.pieceVersion,
            archiveId,
        }
    }
    const pieceMetadata = await engineApiService(engineToken, log).getPiece(piece.pieceName, {
        version: piece.pieceVersion,
    })
    return {
        pieceVersion: pieceMetadata.version,
        archiveId: pieceMetadata.archiveId!,
    }
}

const isPieceStep = (step: Step): step is Action | Trigger => {
    return step.type === TriggerType.PIECE || step.type === ActionType.PIECE
}

type LockFlowVersionParams = {
    engineToken: string
    flowVersion: FlowVersion
    stepName: string
}

export type BasicPieceInformation = {
    pieceName: string
    pieceVersion: string
}