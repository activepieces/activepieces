import { ActivepiecesError, ApId, ErrorCode, isNil } from '@activepieces/core-utils'
import { PrincipalType, SERVICE_KEY_SECURITY_OPENAPI, WorkerGroupScope } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { flowRepo } from '../../flows/flow/flow.repo'
import { projectService } from '../../project/project-service'
import { machineService } from '../machine/machine-service'
import { flowWorkerGroupService } from './flow-worker-group.service'
import { platformWorkerGroupService } from './platform-worker-group.service'
import { projectWorkerGroupService } from './project-worker-group.service'

export const workerGroupController: FastifyPluginAsyncZod = async (app) => {
    app.get('/', ListWorkerGroupsRequestOptions, async (request) => {
        await assertWorkerGroupsEnabled(request.principal.platform.id, request.log)
        return machineService(request.log).listWorkerGroups()
    })

    app.get('/flows', ListWorkerGroupFlowsRequestOptions, async (request) => {
        await assertWorkerGroupsEnabled(request.principal.platform.id, request.log)
        return flowWorkerGroupService(request.log).listGroupFlows({
            platformId: request.principal.platform.id,
            workerGroupId: request.query.workerGroupId,
        })
    })

    app.post('/projects/:id', UpdateProjectWorkerGroupRequestOptions, async (request, reply) => {
        const platformId = request.principal.platform.id
        await assertWorkerGroupsEnabled(platformId, request.log)
        await projectWorkerGroupService(request.log).assignProjectToGroup({
            projectId: request.params.id,
            platformId,
            workerGroupId: request.body.workerGroupId,
        })
        return reply.status(StatusCodes.OK).send()
    })

    app.post('/flows/:id', UpdateFlowWorkerGroupRequestOptions, async (request, reply) => {
        const flow = await flowRepo().findOneBy({ id: request.params.id })
        const platformId = isNil(flow) ? null : await projectService(request.log).getPlatformId(flow.projectId)
        if (isNil(flow) || platformId !== request.principal.platform.id) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: request.params.id,
                    entityType: 'flow',
                },
            })
        }
        await assertWorkerGroupsEnabled(platformId, request.log)
        await flowWorkerGroupService(request.log).assignFlowToGroup({
            flowId: flow.id,
            projectId: flow.projectId,
            platformId,
            workerGroupId: request.body.workerGroupId,
        })
        return reply.status(StatusCodes.OK).send()
    })
}

async function assertWorkerGroupsEnabled(platformId: string, log: FastifyBaseLogger): Promise<void> {
    const workerGroupsEnabled = await platformWorkerGroupService(log).isWorkerGroupsEnabled({ platformId })
    if (!workerGroupsEnabled) {
        throw new ActivepiecesError({
            code: ErrorCode.FEATURE_DISABLED,
            params: {
                message: 'Worker groups are not enabled for this platform',
            },
        })
    }
}

const WorkerGroupAssignmentBody = z.object({
    workerGroupId: z.string().min(1).nullable(),
})

const ListWorkerGroupsRequestOptions = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER, PrincipalType.SERVICE]),
    },
    schema: {
        tags: ['worker-groups'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'List worker groups and their capacity',
        response: {
            [StatusCodes.OK]: z.object({
                groups: z.array(z.object({
                    label: z.string(),
                    slots: z.number(),
                    scope: z.nativeEnum(WorkerGroupScope),
                })),
                sharedSlots: z.number(),
            }),
        },
    },
}

const ListWorkerGroupFlowsRequestOptions = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER, PrincipalType.SERVICE]),
    },
    schema: {
        tags: ['worker-groups'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'List the flows assigned to a worker group',
        querystring: z.object({
            workerGroupId: z.string().min(1),
        }),
        response: {
            [StatusCodes.OK]: z.object({
                flows: z.array(z.object({
                    id: z.string(),
                    projectId: z.string(),
                    displayName: z.string(),
                })),
                total: z.number(),
            }),
        },
    },
}

const UpdateProjectWorkerGroupRequestOptions = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER, PrincipalType.SERVICE]),
    },
    schema: {
        tags: ['worker-groups'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Assign a project to a worker group',
        params: z.object({
            id: ApId,
        }),
        body: WorkerGroupAssignmentBody,
    },
}

const UpdateFlowWorkerGroupRequestOptions = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER, PrincipalType.SERVICE]),
    },
    schema: {
        tags: ['worker-groups'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Assign a flow to a worker group',
        params: z.object({
            id: ApId,
        }),
        body: WorkerGroupAssignmentBody,
    },
}
