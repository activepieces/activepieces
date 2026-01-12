import { ProjectResourceType, securityAccess } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    ApId,
    CountFlowsRequest,
    CreateFlowRequest,
    ErrorCode,
    FlowOperationRequest,
    FlowOperationType,
    flowStructureUtil,
    FlowTrigger,
    GetFlowQueryParamsRequest,
    isNil,
    ListFlowsRequest,
    Permission,
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
import { Static } from '@sinclair/typebox'
import { authenticationUtils } from '../../authentication/authentication-utils'
import { entitiesMustBeOwnedByCurrentProject } from '../../authentication/authorization'
import { userService } from '../../user/user-service'
import { migrateFlowVersionTemplate } from '../flow-version/migrations'
import { FlowEntity } from './flow.entity'
import { flowService } from './flow.service'

const DEFAULT_PAGE_SIZE = 10

// Simple event names for community edition
enum ApplicationEventName {
    FLOW_CREATED = 'flow.created',
    FLOW_UPDATED = 'flow.updated',
    FLOW_DELETED = 'flow.deleted',
}

// Query schema for GetFlowTemplate
const GetFlowTemplateRequestQuery = Type.Object({})
type GetFlowTemplateRequestQuery = Static<typeof GetFlowTemplateRequestQuery>

export const flowController: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    app.post('/', CreateFlowRequestOptions, async (request, reply) => {
        const newFlow = await flowService(request.log).create({
            projectId: request.projectId,
            request: request.body,
            ownerId: request.principal.type === PrincipalType.SERVICE ? undefined : request.principal.id,
        })

        // Log event instead of sending to EE event system
        request.log.info({
            action: ApplicationEventName.FLOW_CREATED,
            flowId: newFlow.id,
        }, 'Flow created')

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
        // Skip RBAC middleware check in community edition

        const flow = await flowService(request.log).getOnePopulatedOrThrow({
            id: request.params.id,
            projectId: request.projectId,
        })

        // Skip platform plan checks in community edition
        await assertThatFlowIsNotBeingUsed(flow, userId)
        const updatedFlow = await flowService(request.log).update({
            id: request.params.id,
            userId: request.principal.type === PrincipalType.SERVICE ? null : userId,
            platformId: request.principal.platform.id,
            projectId: request.projectId,
            operation: cleanOperation(request.body),
        })

        // Log event instead of sending to EE event system
        request.log.info({
            action: ApplicationEventName.FLOW_UPDATED,
            flowId: flow.id,
            operationType: request.body.type,
        }, 'Flow updated')

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
        // Skip git sync in community edition
        await flowService(request.log).delete({
            id: request.params.id,
            projectId: request.projectId,
        })

        // Log event instead of sending to EE event system
        request.log.info({
            action: ApplicationEventName.FLOW_DELETED,
            flowId: flow.id,
        }, 'Flow deleted')

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
