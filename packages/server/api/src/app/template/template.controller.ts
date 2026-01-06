import { securityAccess } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    ALL_PRINCIPAL_TYPES,
    ApEdition,
    ApFlagId,
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
import { flagService } from '../flags/flag.service'
import { migrateFlowVersionTemplate } from '../flows/flow-version/migrations'
import { system } from '../helper/system/system'
import { platformService } from '../platform/platform.service'
import { communityTemplates } from './community-flow-template.service'
import { templateService } from './template.service'

const edition = system.getEdition()

export const templateController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/:id', GetParams, async (request) => {
        const template = await templateService(app.log).getOne({ id: request.params.id })
        if (!isNil(template)) {
            return template
        }
        if (edition !== ApEdition.CLOUD) {
            return communityTemplates.getOrThrow(request.params.id)
        }
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: {
                entityType: 'template',
                entityId: request.params.id,
                message: `Template ${request.params.id} not found`,
            },
        })
    })

    app.get('/categories', GetCategoriesParams, async () => {
        if (edition === ApEdition.CLOUD) {
            return flagService.getOne(ApFlagId.TEMPLATES_CATEGORIES)
        }
        return communityTemplates.getCategories()
    })

    app.get('/', ListTemplatesParams, async (request) => {
        const platformId = await resolveTemplatesPlatformIdOrThrow(request.principal, request.query.type ?? TemplateType.OFFICIAL)
        if (isNil(platformId)) {
            if (edition === ApEdition.CLOUD) {
                return templateService(app.log).list({ platformId: null, requestQuery: request.query })
            }
            return communityTemplates.list(request.query)
        }
        return templateService(app.log).list({ platformId, requestQuery: request.query })
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
        const result = await templateService(app.log).create({ platformId, params: request.body })
        return reply.status(StatusCodes.CREATED).send(result)
    })

    app.post('/:id', UpdateParams, async (request, reply) => {
        const result = await templateService(app.log).update({ id: request.params.id, params: request.body })
        return reply.status(StatusCodes.OK).send(result)
    })

    app.post('/:id/increment-usage-count', IncrementUsageCountParams, async (request, reply) => { 
        await templateService(app.log).incrementUsageCount({ id: request.params.id })
        return reply.status(StatusCodes.OK).send()
    })

    app.delete('/:id', DeleteParams, async (request, reply) => {
        const template = await templateService(app.log).getOneOrThrow({ id: request.params.id })

        if (template.type === TemplateType.CUSTOM) {
            await platformMustBeOwnedByCurrentUser.call(app, request, reply)
        }

        await templateService(app.log).delete({
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

const GetCategoriesParams = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        tags: ['templates'],
        description: 'Get categories of templates.',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
    },
}

const GetParams = {
    config: {
        security: securityAccess.public(),
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
        security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES),
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
        security: securityAccess.publicPlatform([PrincipalType.USER, PrincipalType.SERVICE]),
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
        security: securityAccess.publicPlatform([PrincipalType.USER, PrincipalType.SERVICE]),
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
        security: securityAccess.publicPlatform([PrincipalType.USER, PrincipalType.SERVICE]),
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
        security: securityAccess.publicPlatform([PrincipalType.USER, PrincipalType.SERVICE]),
    },
    schema: {
        description: 'Increment usage count of a template.',
        tags: ['templates'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: GetIdParams,
    },
}