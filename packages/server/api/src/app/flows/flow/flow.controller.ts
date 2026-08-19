import { ApId, Permission, SeekPage, UserId } from '@activepieces/core-utils'
import { CountFlowsRequest, CreateFlowRequest, FlowOperationRequest, FlowOperationType, FlowStatus, flowStructureUtil, FlowTrigger, GetFlowQueryParamsRequest, GetFlowTemplateRequestQuery, GitPushOperationType, ListFlowsRequest, PopulatedFlow, PrincipalType, SERVICE_KEY_SECURITY_OPENAPI, SharedTemplate } from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { entitiesMustBeOwnedByCurrentProject } from '../../authentication/authorization'
import { ProjectResourceType } from '../../core/security/authorization/common'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { assertUserHasPermissionToFlow } from '../../ee/authentication/project-role/rbac-middleware'
import { platformPlanService } from '../../ee/platform/platform-plan/platform-plan.service'
import { projectLimitsService } from '../../ee/projects/project-plan/project-plan.service'
import { gitRepoService } from '../../ee/projects/project-release/git-sync/git-sync.service'
import { networkUtils } from '../../helper/network-utils'
import { userService } from '../../user/user-service'
import { migrateFlowVersionTemplate } from '../flow-version/migrations'
import { FlowEntity } from './flow.entity'
import { flowService } from './flow.service'

const DEFAULT_PAGE_SIZE = 10

export const flowController: FastifyPluginAsyncZod = async (app) => {
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    app.post('/', CreateFlowRequestOptions, async (request, reply) => {
        const newFlow = await flowService(request.log).create({
            projectId: request.projectId,
            request: request.body,
            ownerId: actorUserId(request),
            templateId: request.body.templateId,
            ip: networkUtils.clientIp(request),
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
            params: z.object({
                id: ApId,
            }),
        },
        preValidation: async (request) => {
            if (request.body?.type === FlowOperationType.IMPORT_FLOW) {
                const migratedFlowTemplate = await migrateFlowVersionTemplate({
                    displayName: request.body.request.displayName,
                    trigger: request.body.request.trigger,
                    //because the target for the first migraiton is undefined not null
                    schemaVersion: request.body.request.schemaVersion ?? undefined,
                    notes: request.body.request.notes ?? [],
                    valid: false,
                })
                request.body.request = {
                    ...request.body.request,
                    displayName: migratedFlowTemplate.displayName,
                    trigger: migratedFlowTemplate.trigger,
                    schemaVersion: migratedFlowTemplate.schemaVersion,
                    notes: migratedFlowTemplate.notes,
                }
            }
        },
    }, async (request) => {
        await assertUserHasPermissionToFlow(request.principal, request.projectId, request.body.type, request.log)

        const flow = await flowService(request.log).getOnePopulatedOrThrow({
            id: request.params.id,
            projectId: request.projectId,
        })

        const turnOnFlow = request.body.type === FlowOperationType.CHANGE_STATUS && request.body.request.status === FlowStatus.ENABLED && flow.status === FlowStatus.DISABLED
        const publishDisabledFlow = request.body.type === FlowOperationType.LOCK_AND_PUBLISH && flow.status === FlowStatus.DISABLED
        if (turnOnFlow || publishDisabledFlow) {
            await platformPlanService(request.log).checkActiveFlowsExceededLimit(request.principal.platform.id)
            await projectLimitsService(request.log).checkActiveFlowsExceededLimit({
                projectId: request.projectId,
            })
        }
        return flowService(request.log).update({
            id: request.params.id,
            userId: actorUserId(request),
            platformId: request.principal.platform.id,
            projectId: request.projectId,
            operation: cleanOperation(request.body),
            previousFlow: flow,
            ip: networkUtils.clientIp(request),
        })
    })

    app.get('/', ListFlowsRequestOptions, async (request) => {
        return flowService(request.log).list({
            projectIds: [request.projectId],
            folderId: request.query.folderId,
            folderIds: request.query.folderIds,
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
        const userMetadata = request.principal.type === PrincipalType.USER ? await userService(request.log).getMetaInformation({ id: request.principal.id }) : null
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
            previousFlow: flow,
            userId: actorUserId(request),
            ip: networkUtils.clientIp(request),
        })
        return reply.status(StatusCodes.NO_CONTENT).send()
    })
}

function actorUserId(request: FastifyRequest): UserId | undefined {
    return request.principal.type === PrincipalType.USER ? request.principal.id : undefined
}

function cleanOperation(operation: FlowOperationRequest): FlowOperationRequest {
    if (operation.type === FlowOperationType.IMPORT_FLOW) {
        const clearSampleData = {
            sampleDataFileId: undefined,
            sampleDataInputFileId: undefined,
            lastTestDate: undefined,
        }
        const trigger = flowStructureUtil.transferStep(operation.request.trigger, (step) => ({
            ...step,
            settings: {
                ...step.settings,
                sampleData: {
                    ...step.settings.sampleData,
                    ...clearSampleData,
                },
            },
        })) as FlowTrigger
        return {
            ...operation,
            request: {
                ...operation.request,
                trigger,
            },
        }
    }
    return operation
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
        params: z.object({
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
        params: z.object({
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
        params: z.object({
            id: ApId,
        }),
        response: {
            [StatusCodes.NO_CONTENT]: z.never(),
        },
    },
}
