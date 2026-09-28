import { FlowVersion, RequiredActionsCheckResult, requiredActionsUtil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { pieceMetadataService } from '../../../pieces/metadata/piece-metadata-service'
import { platformPlanService } from '../../platform/platform-plan/platform-plan.service'
import { pieceSetService } from './piece-set.service'

export const pieceSetRequiredActions = (log: FastifyBaseLogger) => ({
    async findMissing({ projectId, platformId, flowVersion }: FindMissingParams): Promise<RequiredActionsCheckResult | null> {
        const plan = await platformPlanService(log).getOrCreateForPlatform(platformId)
        if (!plan.managePiecesEnabled) {
            return null
        }
        const { requiredActions } = (await pieceSetService(log).getForProject({ projectId, platformId })).config
        if (Object.keys(requiredActions.actions).length === 0) {
            return null
        }
        const actionExists = await pieceMetadataService(log).checkActionsExist({ actions: requiredActions.actions, platformId })
        const result = requiredActionsUtil.checkRequiredActionsExistInFlowVersion({ requiredActions, flowVersion, actionExists })
        return result.passed ? null : result
    },
})

type FindMissingParams = {
    projectId: string
    platformId: string
    flowVersion: FlowVersion
}
