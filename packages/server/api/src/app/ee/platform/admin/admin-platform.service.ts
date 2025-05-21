import {
    ActionType,
    ActivepiecesError,
    AdminRestoreFlowRequestBody,
    AdminRetryRunsRequestBody,
    ErrorCode,
    FlowRetryStrategy,
    FlowRun,
    FlowRunStatus,
    flowStructureUtil,
    isNil,
    Platform,
    Project,
    ProjectId,
    RunEnvironment,
    Step,
    Trigger,
    TriggerType,
    UserId,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { In, IsNull } from 'typeorm'
import { flowService } from '../../../flows/flow/flow.service'
import { flowRunRepo, flowRunService } from '../../../flows/flow-run/flow-run-service'
import { flowVersionRepo, flowVersionService } from '../../../flows/flow-version/flow-version.service'
import { platformService } from '../../../platform/platform.service'
import { projectRepo, projectService } from '../../../project/project-service'
import { customDomainService } from '../../custom-domains/custom-domain.service'
import { licenseKeysService } from '../../license-keys/license-keys-service'

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
            plan: {
                customDomainsEnabled: true,
            },
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

    restoreFlowVersion: async ({
        flowId,
        flowVersionToRestore,
    }: AdminRestoreFlowRequestBody): Promise<void> => {
        const flow = await flowService(log).getOneById(flowId)
        if (isNil(flow) || isNil(flowVersionToRestore)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: flowId,
                    entityType: 'flow',
                },
            })
        }

        // Get the current version of the flow
        const currentVersion = await flowVersionService(log).getFlowVersionOrThrow({
            flowId,
            versionId: undefined,
        })

        // Create a map of step names to their piece versions from the version to restore
        const pieceVersionsMap = new Map<string, string>()
        flowStructureUtil.getAllSteps(flowVersionToRestore.trigger).forEach((step: Step) => {
            if (step.type === ActionType.PIECE || step.type === TriggerType.PIECE) {
                pieceVersionsMap.set(step.name, step.settings.pieceVersion)
            }
        })

        // Traverse the current flow and update piece versions
        const updatedTrigger = flowStructureUtil.transferStep(currentVersion.trigger, (step: Step) => {
            if ((step.type === ActionType.PIECE || step.type === TriggerType.PIECE) && pieceVersionsMap.has(step.name)) {
                const pieceVersion = pieceVersionsMap.get(step.name)
                if (!pieceVersion) {
                    return step
                }
                return {
                    ...step,
                    settings: {
                        ...step.settings,
                        pieceVersion,
                    },
                }
            }
            return step
        }) as Trigger

        // Update the flow version
        await flowVersionRepo().update({
            id: flowVersionToRestore.id,
        }, {
            trigger: updatedTrigger as any,
        })
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