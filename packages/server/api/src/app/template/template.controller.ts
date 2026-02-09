import { securityAccess } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    ALL_PRINCIPAL_TYPES,
    ApEdition,
    ApFlagId,
    CreateTemplateRequestBody,
    ErrorCode,
    isNil,
    ListTemplatesRequestQuery,
    Principal,
    PrincipalType,
    SERVICE_KEY_SECURITY_OPENAPI,
    Template,
    TemplateType,
    UpdateTemplateRequestBody,
} from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { Static, Type } from '@sinclair/typebox'
import { FastifyBaseLogger } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { platformMustBeOwnedByCurrentUser } from '../ee/authentication/ee-authorization'
import { flagService } from '../flags/flag.service'
import { migrateFlowVersionTemplateList } from '../flows/flow-version/migrations'
import { system } from '../helper/system/system'
import { platformService } from '../platform/platform.service'
import { communityTemplates } from './community-templates.service'
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
        const officialTemplates = await loadOfficialTemplatesOrReturnEmpty(app.log, request.query)
        const customTemplates = await loadCustomTemplatesOrReturnEmpty(app.log, request.query, request.principal)

        return {
            data: [...officialTemplates, ...customTemplates],
            next: null,
            previous: null,
        }
    })

    app.post('/', {
        ...CreateParams,
        preValidation: async (request) => {
            const migratedFlows = await migrateFlowVersionTemplateList(request.body.flows ?? [])
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

    app.post('/:id', { ...UpdateParams,
        preValidation: async (request) => {
            const migratedFlows = await migrateFlowVersionTemplateList(request.body.flows ?? [])
            request.body.flows = migratedFlows
        },
    }, async (request, reply) => {
        const result = await templateService(app.log).update({ id: request.params.id, params: request.body })
        return reply.status(StatusCodes.OK).send(result)
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

async function loadOfficialTemplatesOrReturnEmpty(
    log: FastifyBaseLogger,
    query: ListTemplatesRequestQuery,
): Promise<Template[]> {
    if (!isNil(query.type) && query.type !== TemplateType.OFFICIAL) {
        return []
    }
    if (edition === ApEdition.CLOUD) {
        const officialTemplatesFromCloud = await templateService(log).list({
            platformId: null,
            type: TemplateType.OFFICIAL,
            ...query,
        })
        return officialTemplatesFromCloud.data
    }
    const loadTemplatesFromCloud = await communityTemplates.list({ ...query, type: TemplateType.OFFICIAL })
    return loadTemplatesFromCloud.data
}

async function loadCustomTemplatesOrReturnEmpty(
    log: FastifyBaseLogger,
    query: ListTemplatesRequestQuery,
    principal: Principal,
): Promise<Template[]> {
    if ((!isNil(query.type) && query.type !== TemplateType.CUSTOM)) {
        return []
    }
    const platformId = principal.type === PrincipalType.UNKNOWN || principal.type === PrincipalType.WORKER ? null : principal.platform.id
    if (isNil(platformId)) {
        return []
    }
    const platform = await platformService.getOneWithPlanOrThrow(platformId)
    if (!platform.plan.manageTemplatesEnabled) {
        return []
    }
    const customTemplates = await templateService(log).list({ platformId, type: TemplateType.CUSTOM, ...query })
    return customTemplates.data
}