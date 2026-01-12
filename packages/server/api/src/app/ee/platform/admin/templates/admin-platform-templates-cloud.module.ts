import { AppSystemProp } from '@activepieces/server-shared'
import { isNil } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { FastifyReply, FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { system } from '../../../../helper/system/system'
import { adminPlatformTemplatesCloudController } from './admin-platform-templates-cloud.controller'

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

export const adminPlatformTemplatesCloudModule: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preHandler', checkTemplatesApiKeyPreHandler)
    await app.register(adminPlatformTemplatesCloudController, { prefix: '/v1/admin/templates' })
}
