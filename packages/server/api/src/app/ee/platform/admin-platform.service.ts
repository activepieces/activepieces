import {
    ActivepiecesError,
    AdminRetryRunsRequestBody,
    ErrorCode,
    FlowRetryStrategy,
    FlowRun,
    FlowRunStatus,
    isNil,
    Platform,
    Project,
    ProjectId,
    RunEnvironment,
    UserId,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { In, IsNull } from 'typeorm'
import { flowRunRepo, flowRunService } from '../../flows/flow-run/flow-run-service'
import { platformService } from '../../platform/platform.service'
import { projectService } from '../../project/project-service'
import { customDomainService } from '../custom-domains/custom-domain.service'
import { licenseKeysService } from '../license-keys/license-keys-service'
import { projectRepo } from '../project-role/project-role.service'

export const adminPlatformService = (log: FastifyBaseLogger) => ({
    async add({
        userId,
        projectId,
        name,
        domain,
    }: AdminAddPlatformParams): Promise<Platform> {
        const project = await getProjectOrThrow(projectId)

        const platform = await platformService.create({
            ownerId: userId,
            name,
        })

        await projectService.addProjectToPlatform({
            projectId: project.id,
            platformId: platform.id,
        })

        await platformService.update({
            id: platform.id,
            customDomainsEnabled: true,
        })

        const customDomain = await customDomainService.create({
            domain,
            platformId: platform.id,
        })

        await licenseKeysService(log).requestTrial({
            email: `mo+trial${name}@activepieces.com`,
            companyName: name,
            goal: 'Manual Trial',
        })

        await customDomainService.verifyDomain({
            id: customDomain.id,
            platformId: customDomain.platformId,
        })
        return platform
    },

    retryRuns: async ({
        createdAfter,
        createdBefore,
    }: AdminRetryRunsRequestBody): Promise<void> => {
        const strategy = FlowRetryStrategy.FROM_FAILED_STEP
        //Get all flow runs that failed, regardless of the project or platform
        const projects = await projectRepo().find({
            where: {
                deleted: IsNull(),
            },
        })

   
        let query = flowRunRepo().createQueryBuilder('flow_run').where({
            environment: RunEnvironment.PRODUCTION,
            status: In([FlowRunStatus.FAILED, FlowRunStatus.INTERNAL_ERROR, FlowRunStatus.TIMEOUT]),
            projectId: In(projects.map((project) => project.id)),
        })
        if (!createdAfter || !createdBefore) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'createdAfter and createdBefore are required',
                },
            })
        }
        query = query.andWhere('flow_run.created >= :createdAfter', {
            createdAfter,
        })
        query = query.andWhere('flow_run.created <= :createdBefore', {
            createdBefore,
        })
    
        const flowRuns = await query.getMany()
        const flowRunsByProject = flowRuns.reduce((acc, flowRun) => {
            acc[flowRun.projectId] = acc[flowRun.projectId] || []
            acc[flowRun.projectId].push(flowRun)
            return acc
        }, {} as Record<ProjectId, FlowRun[]>)
        for (const projectId in flowRunsByProject) {
            const flowRuns = flowRunsByProject[projectId]
            await flowRunService(log).bulkRetry({
                projectId,
                flowRunIds: flowRuns.map((flowRun) => flowRun.id),
                strategy,
            })
        }

      

    },

})

type AdminAddPlatformParams = {
    userId: UserId
    projectId: ProjectId
    name: string
    domain: string
}

const getProjectOrThrow = async (projectId: ProjectId): Promise<Project> => {
    const project = await projectService.getOne(projectId)

    if (isNil(project)) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: {
                entityId: projectId,
                entityType: 'project',
            },
        })
    }

    return project
}