import { FastifyPluginAsyncTypebox, FastifyPluginCallbackTypebox } from '@fastify/type-provider-typebox'
import { Worker } from 'bullmq'
import { createRedisClient } from '../../database/redis-connection'
import { redisQueue } from '../../flow-worker/redis/redis-queue'
import { pieceMetadataService } from '../../pieces/piece-metadata-service'
import { CreatePieceRequest } from './admin-piece-requests.ee'
import { PieceMetadata, PieceMetadataModel } from '@activepieces/pieces-framework'
import { PackageType, PieceType, PrincipalType } from '@activepieces/shared'

export const adminPieceModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(adminPieceController, { prefix: '/v1/admin/pieces' })
}

const adminPieceController: FastifyPluginCallbackTypebox = (
    app,
    _opts,
    done,
) => {
    app.post(
        '/',
        CreatePieceRequest,
        async (req): Promise<PieceMetadataModel> => {
            return pieceMetadataService.create({
                pieceMetadata: req.body as PieceMetadata,
                packageType: PackageType.REGISTRY,
                pieceType: PieceType.OFFICIAL,
            })
        },
    )

    app.post(
        '/tmp',
        TestFix,
        async (): Promise<void> => {
            const worker = new Worker('scheduledJobs', async (job) => {
                await redisQueue.add(job.data)
            }, {
                connection: createRedisClient(),
                lockDuration: 30000,
                maxStalledCount: 5,
                drainDelay: 5,
                stalledInterval: 30000,
            })
            await worker.waitUntilReady()
            
            
        },
    )


    done()
}

export const TestFix = {
    schema: {
    },
    config: {
        allowedPrincipals: [PrincipalType.SUPER_USER],
    },
}
