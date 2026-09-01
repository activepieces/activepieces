import { isNil, tryCatch, unique } from '@activepieces/core-utils'
import { collectSensitiveOutputPaths, ProjectId, Step } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { pieceMetadataService } from '../../pieces/metadata/piece-metadata-service'
import { projectService } from '../../project/project-service'
import { getPieceComponentInfoForStep, PieceComponentInfo } from './piece-component-info'

export const sensitiveOutputPathsResolver = (log: FastifyBaseLogger) => ({
    async resolveForStep({ projectId, step, sampleData }: ResolveForStepParams): Promise<string[] | undefined> {
        const storedPaths = step.settings.sampleData?.sensitiveOutputPaths
        const storedPieceVersion = step.settings.sampleData?.sensitiveOutputPathsPieceVersion
        const pieceInfo = getPieceComponentInfoForStep(step)
        if (isNil(pieceInfo) || pieceInfo.pieceVersion === storedPieceVersion || carriesNoSampleData(sampleData)) {
            return storedPaths
        }
        const { data: livePaths, error } = await tryCatch(() => deriveLivePaths({ projectId, pieceInfo, sampleData, log }))
        if (!isNil(error)) {
            log.error({ error, piece: { name: pieceInfo.pieceName, version: pieceInfo.pieceVersion } }, '[sensitiveOutputPathsResolver] Failed to resolve current piece schema; serving previously captured redaction only')
            return storedPaths
        }
        const merged = unique([...(storedPaths ?? []), ...(livePaths ?? [])])
        return merged.length > 0 ? merged : undefined
    },
})

async function deriveLivePaths({ projectId, pieceInfo, sampleData, log }: DeriveLivePathsParams): Promise<string[] | undefined> {
    const platformId = await projectService(log).getPlatformId(projectId)
    const piece = await pieceMetadataService(log).get({
        name: pieceInfo.pieceName,
        version: pieceInfo.pieceVersion,
        projectId,
        platformId,
    })
    if (isNil(piece)) {
        return undefined
    }
    const component = pieceInfo.componentType === 'action'
        ? piece.actions[pieceInfo.componentName]
        : piece.triggers[pieceInfo.componentName]
    if (isNil(component)) {
        return undefined
    }
    return collectSensitiveOutputPaths(component.outputSchema, sampleData)
}

function carriesNoSampleData(sampleData: unknown): boolean {
    if (isNil(sampleData)) {
        return true
    }
    if (Array.isArray(sampleData)) {
        return sampleData.length === 0
    }
    if (typeof sampleData !== 'object' || sampleData === null) {
        return false
    }
    return Object.keys(sampleData).length === 0
}

type ResolveForStepParams = {
    projectId: ProjectId
    step: Step
    sampleData: unknown
}

type DeriveLivePathsParams = {
    projectId: ProjectId
    pieceInfo: PieceComponentInfo
    sampleData: unknown
    log: FastifyBaseLogger
}
