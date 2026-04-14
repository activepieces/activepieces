import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { consoleUsageService } from './console-usage-service'

export const consoleUsageController: FastifyPluginAsyncZod = async (app) => {
    app.post('/snapshots', PostSnapshotParams, async (request, reply) => {
        await consoleUsageService(app.log).processRelayedSnapshot({
            platformId: request.body.platform_id,
            snapshot: request.body,
        })
        return reply.status(StatusCodes.OK).send()
    })
}

const UsageSnapshotBody = z.object({
    platform_id: z.string(),
    executions: z.number().int().min(0),
    active_flows: z.number().int().min(0),
    projects: z.number().int().min(0),
    users: z.number().int().min(0),
    key_value: z.string().optional(),
    reported_at: z.string().optional(),
})

const PostSnapshotParams = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        body: UsageSnapshotBody,
    },
}
