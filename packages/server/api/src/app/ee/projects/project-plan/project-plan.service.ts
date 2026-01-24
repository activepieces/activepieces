import { ProjectPlanLimits } from '@activepieces/ee-shared'
import {
    apId,
    isNil,
    PiecesFilterType,
    ProjectPlan,
    spreadIfDefined,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { In } from 'typeorm'
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

    async getOrCreateDefaultPlansForProjects(projectIds: string[]): Promise<Map<string, ProjectPlan>> {
        if (projectIds.length === 0) return new Map()

        const existingPlans = await projectPlanRepo().findBy({ 
            projectId: In(projectIds),
        })
        const plansMap = new Map<string, ProjectPlan>(existingPlans.map(p => [p.projectId, p]))

        const projectsWithoutPlans = projectIds.filter(id => !plansMap.has(id))
        
        if (projectsWithoutPlans.length > 0) {
            const newPlans = await Promise.all(
                projectsWithoutPlans.map(projectId => this.getOrCreateDefaultPlan(projectId)),
            )
            newPlans.forEach(plan => plansMap.set(plan.projectId, plan))
        }

        return plansMap
    },

})


