import { ActivepiecesError, apId, ErrorCode, isNil, PlatformUsageMetric } from '@activepieces/core-utils'
import { ApEdition, FlowStatus, PiecesFilterType, ProjectPlan } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { EntityManager, In } from 'typeorm'
import { repoFactory } from '../../../core/db/repo-factory'
import { flowService } from '../../../flows/flow/flow.service'
import { system } from '../../../helper/system/system'
import { ProjectPlanEntity } from './project-plan.entity'

const projectPlanRepo = repoFactory<ProjectPlan>(ProjectPlanEntity)
const edition = system.getEdition()

export const projectLimitsService = (_log: FastifyBaseLogger) => ({
    async updateActiveFlowsLimit({ projectId, activeFlowsLimit, entityManager }: UpdateActiveFlowsLimitParams): Promise<ProjectPlan> {
        const projectPlan = await this.getOrCreateDefaultPlan(projectId)
        await projectPlanRepo(entityManager).update(projectPlan.id, {
            activeFlowsLimit,
        })
        return projectPlanRepo().findOneByOrFail({ projectId })
    },

    async checkActiveFlowsExceededLimit({ projectId }: { projectId: string }): Promise<void> {
        if (edition === ApEdition.COMMUNITY) {
            return
        }
        const projectPlan = await projectPlanRepo().findOneBy({ projectId })
        if (isNil(projectPlan) || isNil(projectPlan.activeFlowsLimit)) {
            return
        }
        const activeFlows = await flowService(_log).count({
            projectId,
            status: FlowStatus.ENABLED,
        })
        if (activeFlows >= projectPlan.activeFlowsLimit) {
            throw new ActivepiecesError({
                code: ErrorCode.QUOTA_EXCEEDED,
                params: {
                    metric: PlatformUsageMetric.ACTIVE_FLOWS,
                },
            })
        }
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

type UpdateActiveFlowsLimitParams = {
    projectId: string
    activeFlowsLimit: number | null
    entityManager?: EntityManager
}
