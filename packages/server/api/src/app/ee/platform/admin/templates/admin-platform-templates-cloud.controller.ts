import { ActivepiecesError, ALL_PRINCIPAL_TYPES, ApFlagId, CreateTemplateRequestBody, ErrorCode, TemplateType, UpdateTemplateRequestBody, UpdateTemplatesCategoriesFlagRequestBody } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import { flagService } from '../../../../flags/flag.service'
import { templateService } from '../../../../template/template.service'

export const adminPlatformTemplatesCloudController: FastifyPluginAsyncTypebox = async (
    app,
) => {

    app.post('/categories', UpdateTemplatesCategoriesFlagRequest, async (request) => {
        return flagService.save({
            id: ApFlagId.TEMPLATES_CATEGORIES,
            value: request.body.value,
        })
    })

    app.post('/', CreateTemplateRequest, async (request) => {
        const { type } = request.body
        if (type !== TemplateType.OFFICIAL) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'Only official templates are supported to being created',
                },
            })
        }
        return templateService().create({
            platformId: undefined,
            params: request.body,
        })
    })

    app.post('/:id', UpdateTemplateRequest, async (request) => {
        const template = await templateService().getOneOrThrow({ id: request.params.id })
        
        if (template.type !== TemplateType.OFFICIAL) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: 'Only official templates are supported to being updated' },
            })
        }
        return templateService().update({ id: template.id, params: request.body })
    })

    app.delete('/:id', DeleteTemplateRequest, async (request) => {
        const template = await templateService().getOneOrThrow({ id: request.params.id })
        
        if (template.type !== TemplateType.OFFICIAL) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: 'Only official templates are supported to being deleted' },
            })
        }

        return templateService().delete({ id: request.params.id })
    })
}

const UpdateTemplatesCategoriesFlagRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        body: UpdateTemplatesCategoriesFlagRequestBody,
    },
}

const CreateTemplateRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        body: CreateTemplateRequestBody,
    },
}

const UpdateTemplateRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
        body: UpdateTemplateRequestBody,
    },
}

const DeleteTemplateRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
    },
}