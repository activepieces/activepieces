import { isNil } from '@activepieces/core-utils'
import { FastifyReply, FastifyRequest } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { denoMigrationService } from './deno-migration.service'

const API_KEY_HEADER = 'api-key'
const API_KEY = system.get(AppSystemProp.API_KEY)

async function checkAdminApiKeyPreHandler(
    req: FastifyRequest,
    res: FastifyReply,
): Promise<void> {
    const key = req.headers[API_KEY_HEADER] as string | undefined
    if (key !== API_KEY || isNil(API_KEY)) {
        await res.status(StatusCodes.FORBIDDEN).send({ message: 'Forbidden' })
        throw new Error('Forbidden')
    }
}

export const denoMigrationModule: FastifyPluginAsyncZod = async (app) => {
    app.addHook('preHandler', checkAdminApiKeyPreHandler)
    await app.register(denoMigrationController, { prefix: '/v1/admin/flows' })
}

const denoMigrationController: FastifyPluginAsyncZod = async (app) => {
    app.post('/migrate-to-deno', MigrateFlowsDenoRequest, async (req, res) => {
        const result = await denoMigrationService(req.log).migrateToDeno(req.body)
        return res.status(StatusCodes.OK).send(result)
    })

    app.post('/revert-from-deno', MigrateFlowsDenoRequest, async (req, res) => {
        const result = await denoMigrationService(req.log).revertFromDeno(req.body)
        return res.status(StatusCodes.OK).send(result)
    })
}

const MigrateFlowsDenoRequest = {
    schema: {
        body: z.object({
            platformId: z.string().optional(),
            projectId: z.string().optional(),
            flowIds: z.array(z.string()).optional(),
        }).refine((body) => [body.platformId, body.projectId, body.flowIds].filter((value) => !isNil(value)).length === 1, {
            message: 'exactly one of platformId, projectId or flowIds must be provided',
        }),
    },
    config: {
        security: securityAccess.public(),
    },
}
