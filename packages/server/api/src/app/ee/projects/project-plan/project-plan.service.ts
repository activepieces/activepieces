import { ProjectPlanLimits } from '@activepieces/ee-shared'
import {
    apId,
    isNil,
    PiecesFilterType,
    ProjectPlan,
    spreadIfDefined,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../../core/db/repo-factory'
import { ProjectPlanEntity } from './project-plan.entity'

const projectPlanRepo = repoFactory<ProjectPlan>(ProjectPlanEntity)

export const projectLimitsService = (_log: FastifyBaseLogger) => ({
    async upsert(
        planLimits: ProjectPlanLimits,
        projectId: string,
    ): Promise<ProjectPlan> {
        const projectPlan = await this.getOrCreateDefaultPlan(projectId)
        await projectPlanRepo().update(projectPlan.id, {
            ...spreadIfDefined('name', planLimits.nickname),
            ...spreadIfDefined('locked', planLimits.locked),
            ...spreadIfDefined('pieces', planLimits.pieces),
            ...spreadIfDefined('piecesFilterType', planLimits.piecesFilterType),
        })
        return projectPlanRepo().findOneByOrFail({ projectId })
    },

    async getOrCreateDefaultPlan(projectId: string): Promise<ProjectPlan> {
        const existingPlan = await projectPlanRepo().findOneBy({ projectId })

        if (!isNil(existingPlan)) {
            return existingPlan
        }

        await projectPlanRepo().upsert({
            id: apId(),
            projectId,
            pieces: [],
            piecesFilterType: PiecesFilterType.NONE,
            locked: false,
            name: 'free',
        }, ['projectId'])

        return projectPlanRepo().findOneByOrFail({ projectId })
    },

})


