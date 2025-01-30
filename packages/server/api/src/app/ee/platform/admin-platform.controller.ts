import { AdminAddPlatformRequestBody, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { redisQueue } from '../../workers/redis/redis-queue'
import { adminPlatformService } from './admin-platform.service'

export const adminPlatformPieceModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(adminPlatformController, { prefix: '/v1/admin/platforms' })
}

const adminPlatformController: FastifyPluginAsyncTypebox = async (
    app,
) => {
    app.post('/', AdminAddPlatformRequest, async (req, res) => {
        const newPlatform = await adminPlatformService(req.log).add(req.body)

        return res.status(StatusCodes.CREATED).send(newPlatform)
    })

    app.get('/check-redis-key', async (req, res) => {
        const jobs = await redisQueue(req.log).getAllRepeatableJobsWithNoRedisKey()
        return res.status(StatusCodes.OK).send(jobs)
    })
}

const AdminAddPlatformRequest = {
    schema: {
        body: AdminAddPlatformRequestBody,
    },
    config: {
        allowedPrincipals: [PrincipalType.SUPER_USER],
    },
}