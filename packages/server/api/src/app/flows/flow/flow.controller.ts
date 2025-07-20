
import { ApplicationEventName, GitPushOperationType } from '@activepieces/ee-shared'
import {
    ActivepiecesError,
    ApId,
    CountFlowsRequest,
    CreateFlowRequest,
    ErrorCode,
    FlowOperationRequest,
    FlowOperationType,
    flowStructureUtil,
    FlowTemplateWithoutProjectInformation,
    GetFlowQueryParamsRequest,
    GetFlowTemplateRequestQuery,
    isNil,
    ListFlowsRequest,
    Permission,
    PopulatedFlow,
    PrincipalType,
    SeekPage,
    SERVICE_KEY_SECURITY_OPENAPI,
    Trigger,
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
import { gitRepoService } from '../../ee/project-release/git-sync/git-sync.service'
import { eventsHooks } from '../../helper/application-events'
import { flowService } from './flow.service'

const DEFAULT_PAGE_SIZE = 10

export const flowController: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)

    app.post('/', CreateFlowRequestOptions, async (request, reply) => {
        const newFlow = await flowService(request.log).create({
            projectId: request.principal.projectId,
            request: request.body,
        })

        eventsHooks.get(request.log).sendUserEventFromRequest(request, {
            action: ApplicationEventName.FLOW_CREATED,
            data: {
                flow: newFlow,
            },
        })

        return reply.status(StatusCodes.CREATED).send(newFlow)
    })

    app.post('/:id', UpdateFlowRequestOptions, async (request) => {
        const userId = await authenticationUtils.extractUserIdFromPrincipal(request.principal)
        await assertUserHasPermissionToFlow(request.principal, request.body.type, request.log)

        const flow = await flowService(request.log).getOnePopulatedOrThrow({
            id: request.params.id,
            projectId: request.principal.projectId,
        })
        await assertThatFlowIsNotBeingUsed(flow, userId)
        eventsHooks.get(request.log).sendUserEventFromRequest(request, {
            action: ApplicationEventName.FLOW_UPDATED,
            data: {
                request: request.body,
                flowVersion: flow.version,
            },
        })
        const updatedFlow = await flowService(request.log).update({
            id: request.params.id,
            userId: request.principal.type === PrincipalType.SERVICE ? null : userId,
            platformId: request.principal.platform.id,
            projectId: request.principal.projectId,
            operation: cleanOperation(request.body),
        })
        return updatedFlow
    })

    app.get('/', ListFlowsRequestOptions, async (request) => {
        return flowService(request.log).list({
            projectId: request.principal.projectId,
            folderId: request.query.folderId,
            cursorRequest: request.query.cursor ?? null,
            limit: request.query.limit ?? DEFAULT_PAGE_SIZE,
            status: request.query.status,
            name: request.query.name,
            versionState: request.query.versionState,
            connectionExternalIds: request.query.connectionExternalIds,
        })
    })

    app.get('/count', CountFlowsRequestOptions, async (request) => {
        return flowService(request.log).count({
            folderId: request.query.folderId,
            projectId: request.principal.projectId,
        })
    })

    app.get('/:id/template', GetFlowTemplateRequestOptions, async (request) => {
        return flowService(request.log).getTemplate({
            flowId: request.params.id,
            projectId: request.principal.projectId,
            versionId: undefined,
        })
    })

    app.get('/:id', GetFlowRequestOptions, async (request) => {
        return flowService(request.log).getOnePopulatedOrThrow({
            id: request.params.id,
            projectId: request.principal.projectId,
            versionId: request.query.versionId,
        })
    })

    app.delete('/:id', DeleteFlowRequestOptions, async (request, reply) => {
        const flow = await flowService(request.log).getOnePopulatedOrThrow({
            id: request.params.id,
            projectId: request.principal.projectId,
        })
        eventsHooks.get(request.log).sendUserEventFromRequest(request, {
            action: ApplicationEventName.FLOW_DELETED,
            data: {
                flow,
                flowVersion: flow.version,
            },
        })
        await gitRepoService(request.log).onDeleted({
            type: GitPushOperationType.DELETE_FLOW,
            id: request.params.id,
            userId: request.principal.id,
            projectId: request.principal.projectId,
            log: request.log,
        })
        await flowService(request.log).delete({
            id: request.params.id,
            projectId: request.principal.projectId,
        })
        return reply.status(StatusCodes.NO_CONTENT).send()
    })
}

function cleanOperation(operation: FlowOperationRequest): FlowOperationRequest {
    if (operation.type === FlowOperationType.IMPORT_FLOW) {
        const clearInputUiInfo = {
            currentSelectedData: undefined,
            sampleDataFileId: undefined,
            sampleDataInputFileId: undefined,
            lastTestDate: undefined,
        }
        const trigger = flowStructureUtil.transferStep(operation.request.trigger, (step) => {
            return {
                ...step,
                settings: {
                    ...step.settings,
                    inputUiInfo: {
                        ...step.settings.inputUiInfo,
                        ...clearInputUiInfo,
                    },
                },
            }
        }) as Trigger
        return {
            ...operation,
            request: {
                ...operation.request,
                trigger: {
                    ...trigger,
                    settings: {
                        ...trigger.settings,
                        inputUiInfo: {
                            ...trigger.settings.inputUiInfo,
                            ...clearInputUiInfo,
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
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        permission: Permission.WRITE_FLOW,
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

const UpdateFlowRequestOptions = {
    config: {
        permission: Permission.UPDATE_FLOW_STATUS,
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
}

const ListFlowsRequestOptions = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        permission: Permission.READ_FLOW,
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
    schema: {
        querystring: CountFlowsRequest,
    },
}

const GetFlowTemplateRequestOptions = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        permission: Permission.READ_FLOW,
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
            [StatusCodes.OK]: FlowTemplateWithoutProjectInformation,
        },
    },
}

const GetFlowRequestOptions = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        permission: Permission.READ_FLOW,
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
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        permission: Permission.WRITE_FLOW,
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
