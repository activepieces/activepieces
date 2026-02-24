import { ApplicationEventName, GetFlowTemplateRequestQuery, GitPushOperationType } from '@activepieces/ee-shared'
import { ProjectResourceType, securityAccess } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    ApId,
    CountFlowsRequest,
    CreateFlowRequest,
    ErrorCode,
    FlowOperationRequest,
    FlowOperationType,
    FlowStatus,
    flowStructureUtil,
    FlowTrigger,
    GetFlowQueryParamsRequest,
    isNil,
    ListFlowsRequest,
    Permission,
    PlatformUsageMetric,
    PopulatedFlow,
    PrincipalType,
    SeekPage,
    SERVICE_KEY_SECURITY_OPENAPI,
    SharedTemplate,
} from '@activepieces/shared'
import {
    FastifyPluginAsyncTypebox,
    Type,
} from '@fastify/type-provider-typebox'
import dayjs from 'dayjs'
import { StatusCodes } from 'http-status-codes'
import { authenticationUtils } from '../../authentication/authentication-utils'
import { entitiesMustBeOwnedByCurrentProject } from '../../authentication/authorization'
import { assertUserHasPermissionToFlow } from '../../ee/authentication/project-role/rbac-middleware'
import { platformPlanService } from '../../ee/platform/platform-plan/platform-plan.service'
import { gitRepoService } from '../../ee/projects/project-release/git-sync/git-sync.service'
import { applicationEvents } from '../../helper/application-events'
import { userService } from '../../user/user-service'
import { migrateFlowVersionTemplate } from '../flow-version/migrations'
import { FlowEntity } from './flow.entity'
import { flowService } from './flow.service'

const DEFAULT_PAGE_SIZE = 10

export const flowController: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    app.post('/', CreateFlowRequestOptions, async (request, reply) => {
        const newFlow = await flowService(request.log).create({
            projectId: request.projectId,
            request: request.body,
            ownerId: request.principal.type === PrincipalType.SERVICE ? undefined : request.principal.id,
        })

        applicationEvents.sendUserEvent(request, {
            action: ApplicationEventName.FLOW_CREATED,
            data: {
                flow: newFlow,
            },
        })

        return reply.status(StatusCodes.CREATED).send(newFlow)
    })

    app.post('/:id', {
        config: {
            security: securityAccess.project(
                [PrincipalType.USER, PrincipalType.SERVICE], 
                Permission.UPDATE_FLOW_STATUS, {
                    type: ProjectResourceType.TABLE,
                    tableName: FlowEntity,
                }),
        },
        schema: {
            tags: ['flows'],
            description: 'Apply an operation to a flow',
            security: [SERVICE_KEY_SECURITY_OPENAPI],
            body: FlowOperationRequest,
            params: Type.Object({
                id: ApId,
            }),
        },
        preValidation: async (request) => {
            if (request.body?.type === FlowOperationType.IMPORT_FLOW) {
                const migratedFlowTemplate = await migrateFlowVersionTemplate(request.body.request.trigger, request.body.request.schemaVersion)
                request.body.request = {
                    ...request.body.request,
                    trigger: migratedFlowTemplate.trigger,
                    schemaVersion: migratedFlowTemplate.schemaVersion,
                }
            }
        },
    }, async (request) => {
        const userId = await authenticationUtils.extractUserIdFromRequest(request)
        await assertUserHasPermissionToFlow(request.principal, request.projectId, request.body.type, request.log)

        const flow = await flowService(request.log).getOnePopulatedOrThrow({
            id: request.params.id,
            projectId: request.projectId,
        })

        const turnOnFlow = request.body.type === FlowOperationType.CHANGE_STATUS && request.body.request.status === FlowStatus.ENABLED
        const publishDisabledFlow = request.body.type === FlowOperationType.LOCK_AND_PUBLISH && flow.status === FlowStatus.DISABLED
        if (turnOnFlow || publishDisabledFlow) {
            await platformPlanService(request.log).checkActiveFlowsExceededLimit(
                request.principal.platform.id,
                PlatformUsageMetric.ACTIVE_FLOWS,
            )
        }
        await assertThatFlowIsNotBeingUsed(flow, userId)
        const updatedFlow = await flowService(request.log).update({
            id: request.params.id,
            userId: request.principal.type === PrincipalType.SERVICE ? null : userId,
            platformId: request.principal.platform.id,
            projectId: request.projectId,
            operation: cleanOperation(request.body),
        })
        applicationEvents.sendUserEvent(request, {
            action: ApplicationEventName.FLOW_UPDATED,
            data: {
                request: request.body,
                flowVersion: flow.version,
            },
        })
        return updatedFlow
    })

    app.get('/', ListFlowsRequestOptions, async (request) => {
        return flowService(request.log).list({
            projectIds: [request.projectId],
            folderId: request.query.folderId,
            cursorRequest: request.query.cursor ?? null,
            limit: request.query.limit ?? DEFAULT_PAGE_SIZE,
            status: request.query.status,
            name: request.query.name,
            versionState: request.query.versionState,
            externalIds: request.query.externalIds,
            connectionExternalIds: request.query.connectionExternalIds,
            agentExternalIds: request.query.agentExternalIds,
        })
    })

    app.get('/count', CountFlowsRequestOptions, async (request) => {
        return flowService(request.log).count({
            folderId: request.query.folderId,
            projectId: request.projectId,
        })
    })

    app.get('/:id/template', GetFlowTemplateRequestOptions, async (request) => {
        const userMetadata = request.principal.type === PrincipalType.USER ? await userService.getMetaInformation({ id: request.principal.id }) : null
        return flowService(request.log).getTemplate({
            flowId: request.params.id,
            userMetadata,
            projectId: request.projectId,
            versionId: undefined,
        })
    })

    app.get('/:id', GetFlowRequestOptions, async (request) => {
        return flowService(request.log).getOnePopulatedOrThrow({
            id: request.params.id,
            projectId: request.projectId,
            versionId: request.query.versionId,
        })
    })

    app.delete('/:id', DeleteFlowRequestOptions, async (request, reply) => {
        const flow = await flowService(request.log).getOnePopulatedOrThrow({
            id: request.params.id,
            projectId: request.projectId,
        })
        await gitRepoService(request.log).onDeleted({
            type: GitPushOperationType.DELETE_FLOW,
            externalId: flow.externalId,
            userId: request.principal.id,
            projectId: request.projectId,
            platformId: request.principal.platform.id,
            log: request.log,
        })
        await flowService(request.log).delete({
            id: request.params.id,
            projectId: request.projectId,
        })
        applicationEvents.sendUserEvent(request, {
            action: ApplicationEventName.FLOW_DELETED,
            data: {
                flow,
                flowVersion: flow.version,
            },
        })
        return reply.status(StatusCodes.NO_CONTENT).send()
    })
}

function cleanOperation(operation: FlowOperationRequest): FlowOperationRequest {
    if (operation.type === FlowOperationType.IMPORT_FLOW) {
        const clearSampleData = {
            sampleDataFileId: undefined,
            sampleDataInputFileId: undefined,
            lastTestDate: undefined,
        }
        const trigger = flowStructureUtil.transferStep(operation.request.trigger, (step) => {
            return {
                ...step,
                settings: {
                    ...step.settings,
                    sampleData: {
                        ...step.settings.sampleData,
                        ...clearSampleData,
                    },
                },
            }
        }) as FlowTrigger
        return {
            ...operation,
            request: {
                ...operation.request,
                trigger: {
                    ...trigger,
                    settings: {
                        ...trigger.settings,
                        sampleData: {
                            ...trigger.settings.sampleData,
                            ...clearSampleData,
                        },
                    },
                },
            },
        }
    }
    return operation
}

async function assertThatFlowIsNotBeingUsed(
    flow: PopulatedFlow,
    userId: string,
): Promise<void> {
    const currentTime = dayjs()
    if (
        !isNil(flow.version.updatedBy) &&
        flow.version.updatedBy !== userId &&
        currentTime.diff(dayjs(flow.version.updated), 'minute') <= 1
    ) {
        throw new ActivepiecesError({
            code: ErrorCode.FLOW_IN_USE,
            params: {
                flowVersionId: flow.version.id,
                message:
                    'Flow is being used by another user in the last minute. Please try again later.',
            },
        })
    }
}

const CreateFlowRequestOptions = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE], 
            Permission.WRITE_FLOW, {
                type: ProjectResourceType.BODY,
            }),
    },
    schema: {
        tags: ['flows'],
        description: 'Create a flow',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        body: CreateFlowRequest,
        response: {
            [StatusCodes.CREATED]: PopulatedFlow,
        },
    },
}


const ListFlowsRequestOptions = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE], 
            Permission.READ_FLOW, {
                type: ProjectResourceType.QUERY,
            }),
    },
    schema: {
        tags: ['flows'],
        description: 'List flows',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        querystring: ListFlowsRequest,
        response: {
            [StatusCodes.OK]: SeekPage(PopulatedFlow),
        },
    },
}

const CountFlowsRequestOptions = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE], 
            Permission.READ_FLOW, {
                type: ProjectResourceType.QUERY,
            }),
    },
    schema: {
        querystring: CountFlowsRequest,
    },
}

const GetFlowTemplateRequestOptions = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE], 
            Permission.READ_FLOW, {
                type: ProjectResourceType.TABLE,
                tableName: FlowEntity,
            }),
    },
    schema: {
        tags: ['flows'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Export flow as template',
        params: Type.Object({
            id: ApId,
        }),
        querystring: GetFlowTemplateRequestQuery,
        response: {
            [StatusCodes.OK]: SharedTemplate,
        },
    },
}

const GetFlowRequestOptions = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE], 
            Permission.READ_FLOW, {
                type: ProjectResourceType.TABLE,
                tableName: FlowEntity,
            }),
    },
    schema: {
        tags: ['flows'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Get a flow by id',
        params: Type.Object({
            id: ApId,
        }),
        querystring: GetFlowQueryParamsRequest,
        response: {
            [StatusCodes.OK]: PopulatedFlow,
        },
    },
}

const DeleteFlowRequestOptions = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE], 
            Permission.WRITE_FLOW, {
                type: ProjectResourceType.TABLE,
                tableName: FlowEntity,
            }),
    },
    schema: {
        tags: ['flows'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Delete a flow',
        params: Type.Object({
            id: ApId,
        }),
        response: {
            [StatusCodes.NO_CONTENT]: Type.Never(),
        },
    },
}


