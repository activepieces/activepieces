import { ActivepiecesError, ErrorCode } from '@activepieces/core-utils'
import {
    AssignWorkerGroupFlowsRequest,
    AssignWorkerGroupProjectsRequest,
    ListWorkerGroupFlowsRequest,
    ListWorkerGroupProjectsRequest,
    MoveAllWorkerGroupRequest,
    PrincipalType,
    SERVICE_KEY_SECURITY_OPENAPI,
    WorkerGroupFlowAssignmentPage,
    WorkerGroupMoveResult,
    WorkerGroupProjectAssignmentPage,
    WorkerGroupScope,
    WorkerGroupsOverview,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { machineService } from '../machine/machine-service'
import { flowWorkerGroupService } from './flow-worker-group.service'
import { platformWorkerGroupService } from './platform-worker-group.service'
import { workerGroupAssignmentService } from './worker-group-assignment.service'

export const workerGroupController: FastifyPluginAsyncZod = async (app) => {
    app.get('/', ListWorkerGroupsRequestOptions, async (request) => {
        await assertWorkerGroupsEnabled(request.principal.platform.id, request.log)
        return machineService(request.log).listWorkerGroups()
    })

    app.get('/overview', OverviewRequestOptions, async (request) => {
        await assertWorkerGroupsEnabled(request.principal.platform.id, request.log)
        return workerGroupAssignmentService(request.log).overview({ platformId: request.principal.platform.id })
    })

    app.get('/assignments/projects', ListAssignedProjectsRequestOptions, async (request) => {
        await assertWorkerGroupsEnabled(request.principal.platform.id, request.log)
        return workerGroupAssignmentService(request.log).listProjects({ platformId: request.principal.platform.id, request: request.query })
    })

    app.get('/assignments/flows', ListAssignedFlowsRequestOptions, async (request) => {
        await assertWorkerGroupsEnabled(request.principal.platform.id, request.log)
        return workerGroupAssignmentService(request.log).listFlows({ platformId: request.principal.platform.id, request: request.query })
    })

    app.post('/assignments/projects', AssignProjectsRequestOptions, async (request) => {
        await assertWorkerGroupsEnabled(request.principal.platform.id, request.log)
        return workerGroupAssignmentService(request.log).assignProjects({
            platformId: request.principal.platform.id,
            projectIds: request.body.projects,
            workerGroupId: request.body.workerGroupId,
        })
    })

    app.post('/assignments/flows', AssignFlowsRequestOptions, async (request) => {
        await assertWorkerGroupsEnabled(request.principal.platform.id, request.log)
        return workerGroupAssignmentService(request.log).assignFlows({
            platformId: request.principal.platform.id,
            flowIds: request.body.flows,
            workerGroupId: request.body.workerGroupId,
        })
    })

    app.post('/assignments/move-all', MoveAllRequestOptions, async (request) => {
        await assertWorkerGroupsEnabled(request.principal.platform.id, request.log)
        return workerGroupAssignmentService(request.log).moveAll({
            platformId: request.principal.platform.id,
            from: request.body.from,
            to: request.body.to,
            scope: request.body.scope,
        })
    })

    app.get('/flows', ListWorkerGroupFlowsRequestOptions, async (request) => {
        await assertWorkerGroupsEnabled(request.principal.platform.id, request.log)
        return flowWorkerGroupService(request.log).listGroupFlows({
            platformId: request.principal.platform.id,
            workerGroupId: request.query.workerGroupId,
        })
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
                    scope: z.enum(WorkerGroupScope),
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

const adminOnly = {
    security: securityAccess.platformAdminOnly([PrincipalType.USER, PrincipalType.SERVICE]),
}

const OverviewRequestOptions = {
    config: adminOnly,
    schema: {
        tags: ['worker-groups'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Worker groups with their health and how many projects and flows run on each',
        response: { [StatusCodes.OK]: WorkerGroupsOverview },
    },
}

const ListAssignedProjectsRequestOptions = {
    config: adminOnly,
    schema: {
        tags: ['worker-groups'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'List the projects that run on a worker group, one page at a time',
        querystring: ListWorkerGroupProjectsRequest,
        response: { [StatusCodes.OK]: WorkerGroupProjectAssignmentPage },
    },
}

const ListAssignedFlowsRequestOptions = {
    config: adminOnly,
    schema: {
        tags: ['worker-groups'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'List the flows pinned to a worker group, or the flows of one project, one page at a time',
        querystring: ListWorkerGroupFlowsRequest,
        response: { [StatusCodes.OK]: WorkerGroupFlowAssignmentPage },
    },
}

const AssignProjectsRequestOptions = {
    config: adminOnly,
    schema: {
        tags: ['worker-groups'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Move projects to a worker group; waiting runs move with them',
        body: AssignWorkerGroupProjectsRequest,
        response: { [StatusCodes.OK]: WorkerGroupMoveResult },
    },
}

const AssignFlowsRequestOptions = {
    config: adminOnly,
    schema: {
        tags: ['worker-groups'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Move flows to a worker group; waiting runs move with them',
        body: AssignWorkerGroupFlowsRequest,
        response: { [StatusCodes.OK]: WorkerGroupMoveResult },
    },
}

const MoveAllRequestOptions = {
    config: adminOnly,
    schema: {
        tags: ['worker-groups'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Move every project or every pinned flow off a worker group; waiting runs move with them',
        body: MoveAllWorkerGroupRequest,
        response: { [StatusCodes.OK]: WorkerGroupMoveResult },
    },
}
