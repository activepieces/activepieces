import { AppSystemProp } from '@activepieces/server-shared'
import { ActivepiecesError, ALL_PRINCIPAL_TYPES, ApFlagId, CreateTemplateRequestBody, ErrorCode, isNil, TemplateType, UpdateFlagRequestBody, UpdateTemplateRequestBody } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import { FastifyReply, FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { flagService } from '../../../flags/flag.service'
import { system } from '../../../helper/system/system'
import { templateService } from '../../../template/template.service'

const TEMPLATES_API_KEY_HEADER = 'templates-api-key'
const TEMPLATES_API_KEY = system.get(AppSystemProp.TEMPLATES_API_KEY)

async function checkTemplatesApiKeyPreHandler(
    req: FastifyRequest,
    res: FastifyReply,
): Promise<void> {

    const templatesApiKey = req.headers[TEMPLATES_API_KEY_HEADER] as string | undefined
    if (templatesApiKey !== TEMPLATES_API_KEY || isNil(TEMPLATES_API_KEY)) {
        const errorMessage = 'Invalid templates API key'
        await res.status(StatusCodes.FORBIDDEN).send({ message: errorMessage })
        throw new Error(errorMessage)
    }
}

export const adminPlatformTemplatesCloudController: FastifyPluginAsyncTypebox = async (
    app,
) => {
    app.addHook('preHandler', checkTemplatesApiKeyPreHandler)

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
        const cloudPlatformId = system.getOrThrow(AppSystemProp.CLOUD_PLATFORM_ID)
        return templateService().create({
            platformId: cloudPlatformId,
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
}

const UpdateTemplatesCategoriesFlagRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        body: UpdateFlagRequestBody,
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