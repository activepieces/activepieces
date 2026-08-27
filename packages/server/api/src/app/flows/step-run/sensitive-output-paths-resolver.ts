import { isNil, unique } from '@activepieces/core-utils'
import { collectSensitiveOutputPaths, ProjectId, Step } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { pieceMetadataService } from '../../pieces/metadata/piece-metadata-service'
import { projectService } from '../../project/project-service'
import { getPieceComponentInfoForStep } from './piece-component-info'

export const sensitiveOutputPathsResolver = (log: FastifyBaseLogger) => ({
    async resolveForStep({ projectId, step, sampleData }: ResolveForStepParams): Promise<string[] | undefined> {
        const storedPaths = step.settings.sampleData?.sensitiveOutputPaths
        const storedPieceVersion = step.settings.sampleData?.sensitiveOutputPathsPieceVersion
        const pieceInfo = getPieceComponentInfoForStep(step)
        if (isNil(pieceInfo) || pieceInfo.pieceVersion === storedPieceVersion) {
            return storedPaths
        }
        const platformId = await projectService(log).getPlatformId(projectId)
        const piece = await pieceMetadataService(log).get({
            name: pieceInfo.pieceName,
            version: pieceInfo.pieceVersion,
            projectId,
            platformId,
        })
        const component = piece
            ? (pieceInfo.componentType === 'action' ? piece.actions[pieceInfo.componentName] : piece.triggers[pieceInfo.componentName])
            : undefined
        if (isNil(component)) {
            log.warn({ piece: { name: pieceInfo.pieceName, version: pieceInfo.pieceVersion } }, '[sensitiveOutputPathsResolver] Failed to resolve current piece schema; serving previously captured redaction only')
            return storedPaths
        }
        const livePaths = collectSensitiveOutputPaths(component.outputSchema, sampleData)
        const merged = unique([...(storedPaths ?? []), ...(livePaths ?? [])])
        return merged.length > 0 ? merged : undefined
    },
})

type ResolveForStepParams = {
    projectId: ProjectId
    step: Step
    sampleData: unknown
}
