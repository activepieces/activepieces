import {
    ActivepiecesError,
    ALL_PRINCIPAL_TYPES,
    ApEdition,
    CreateTemplateRequestBody,    
    ErrorCode,    
    FlowVersionTemplate,
    isNil,
    ListTemplatesRequestQuery,
    Principal,
    PrincipalType,
    SERVICE_KEY_SECURITY_OPENAPI,
    TemplateType,
    UpdateTemplateRequestBody,
} from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { Static, Type } from '@sinclair/typebox'
import { StatusCodes } from 'http-status-codes'
import { platformMustBeOwnedByCurrentUser } from '../ee/authentication/ee-authorization'
import { migrateFlowVersionTemplate } from '../flows/flow-version/migrations'
import { system } from '../helper/system/system'
import { platformService } from '../platform/platform.service'
import { communityTemplates } from './community-flow-template.service'
import { templateService } from './template.service'

const edition = system.getEdition()

export const templateController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/:id', GetParams, async (request) => {
        return templateService().getOneOrThrow({ id: request.params.id })
    })

    app.get('/', ListTemplatesParams, async (request) => {
        const platformId = await resolveTemplatesPlatformIdOrThrow(request.principal, request.query.type ?? TemplateType.OFFICIAL)
        if (isNil(platformId)) {
            if (edition === ApEdition.CLOUD) {
                return templateService().list({ platformId: null, requestQuery: request.query })
            }
            return communityTemplates.get(request.query)
        }
        return templateService().list({ platformId, requestQuery: request.query })
    })

    app.post('/', {
        ...CreateParams,
        preValidation: async (request) => {
            const migratedFlows = await Promise.all((request.body.flows ?? []).map(async (flow: FlowVersionTemplate) => {
                const migratedFlow = await migrateFlowVersionTemplate(flow.trigger, flow.schemaVersion)
                return {
                    ...flow,
                    trigger: migratedFlow.trigger,
                    schemaVersion: migratedFlow.schemaVersion,
                }
            }))
            request.body.flows = migratedFlows
        },
    }, async (request, reply) => {
        const { type } = request.body
        let platformId: string | undefined

        switch (type) {
            case TemplateType.CUSTOM: {
                await platformMustBeOwnedByCurrentUser.call(app, request, reply)
                platformId = request.principal.platform.id
            }
                break
            case TemplateType.SHARED:
                break
            case TemplateType.OFFICIAL: {
                throw new ActivepiecesError({
                    code: ErrorCode.VALIDATION,
                    params: {
                        message: 'Official templates are not supported to being created',
                    },
                })
            }
        }
        const result = await templateService().create({ platformId, params: request.body })
        return reply.status(StatusCodes.CREATED).send(result)
    })

    app.post('/:id', UpdateParams, async (request, reply) => {
        const result = await templateService().update({ id: request.params.id, params: request.body })
        return reply.status(StatusCodes.OK).send(result)
    })

    app.post('/:id/increment-usage-count', IncrementUsageCountParams, async (request, reply) => { 
        await templateService().incrementUsageCount({ id: request.params.id })
        return reply.status(StatusCodes.OK).send()
    })

    app.delete('/:id', DeleteParams, async (request, reply) => {
        const template = await templateService().getOneOrThrow({ id: request.params.id })

        if (template.type === TemplateType.CUSTOM) {
            await platformMustBeOwnedByCurrentUser.call(app, request, reply)
        }

        await templateService().delete({
            id: request.params.id,
        })
        return reply.status(StatusCodes.NO_CONTENT).send()
    })
}

async function resolveTemplatesPlatformIdOrThrow(principal: Principal, type: TemplateType): Promise<string | null> {
    if (principal.type === PrincipalType.UNKNOWN || principal.type === PrincipalType.WORKER || type === TemplateType.OFFICIAL) {
        return null
    }

    if (type === TemplateType.CUSTOM) {
        const platform = await platformService.getOneWithPlanOrThrow(principal.platform.id)
        if (!platform.plan.manageTemplatesEnabled) {
            throw new ActivepiecesError({
                code: ErrorCode.FEATURE_DISABLED,
                params: {
                    message: 'Templates are not enabled for this platform',
                },
            })
        }
        return platform.id
    }

    throw new ActivepiecesError({
        code: ErrorCode.VALIDATION,
        params: {
            message: 'Invalid request, shared templates are not supported to being listed',
        },
    })
}


const GetIdParams = Type.Object({
    id: Type.String(),
})
type GetIdParams = Static<typeof GetIdParams>


const GetParams = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        tags: ['templates'],
        description: 'Get a template.',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: GetIdParams,
    },
}

const ListTemplatesParams = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        tags: ['templates'],
        description: 'List templates.',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        querystring: ListTemplatesRequestQuery,
    },
}

const DeleteParams = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE] as const,
    },
    schema: {
        description: 'Delete a template.',
        tags: ['templates'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: GetIdParams,
    },
}

const CreateParams = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE] as const,
    },
    schema: {
        description: 'Create a template.',
        tags: ['templates'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        body: CreateTemplateRequestBody,
    },
}

const UpdateParams = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE] as const,
    },
    schema: {
        description: 'Update a template.',
        tags: ['templates'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: GetIdParams,
        body: UpdateTemplateRequestBody,
    },
}

const IncrementUsageCountParams = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE] as const,
    },
    schema: {
        description: 'Increment usage count of a template.',
        tags: ['templates'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: GetIdParams,
    },
}