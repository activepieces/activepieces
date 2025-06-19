import { AppSystemProp } from '@activepieces/server-shared'
import { ApEdition, isNil } from '@activepieces/shared'
import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { FastifyAdapter } from '@bull-board/fastify'
import basicAuth from '@fastify/basic-auth'
import { FastifyInstance } from 'fastify'
import { system } from '../../helper/system/system'
import { systemJobsQueue } from '../../helper/system-jobs/redis-system-job'
import { bullMqGroups } from './redis-queue'
import { redisRateLimiter } from './redis-rate-limiter'

const QUEUE_BASE_PATH = '/ui'

export async function setupBullMQBoard(app: FastifyInstance): Promise<void> {
    const edition = system.getEdition()
    const isQueueEnabled = (edition !== ApEdition.CLOUD) && (system.getBoolean(AppSystemProp.QUEUE_UI_ENABLED) ?? false)
    if (!isQueueEnabled) {
        app.log.info('[setupBullMQBoard] Queue UI is disabled')
        return
    }
    const queueUsername = system.getOrThrow(AppSystemProp.QUEUE_UI_USERNAME)
    const queuePassword = system.getOrThrow(AppSystemProp.QUEUE_UI_PASSWORD)
    app.log.info(
        '[setupBullMQBoard] Setting up bull board, visit /ui to see the queues',
    )

    await app.register(basicAuth, {
        validate: (username, password, _req, _reply, done) => {
            if (username === queueUsername && password === queuePassword) {
                done()
            }
            else {
                done(new Error('Unauthorized'))
            }
        },
        authenticate: true,
    })

    const allQueues = [...Object.values(bullMqGroups).map((queue) => new BullMQAdapter(queue)),
        new BullMQAdapter(systemJobsQueue),
        new BullMQAdapter(await redisRateLimiter(app.log).getCleanUpQueue()),
        new BullMQAdapter(await redisRateLimiter(app.log).getQueue())]

    const serverAdapter = new FastifyAdapter()
    createBullBoard({
        queues: allQueues,
        serverAdapter,
    })

    serverAdapter.setBasePath(`/api${QUEUE_BASE_PATH}`)
    app.addHook('onRequest', (req, reply, next) => {
        if (!req.routerPath.startsWith(QUEUE_BASE_PATH)) {
            next()
        }
        else {
            app.basicAuth(req, reply, function (error?: unknown) {
                const castedError = error as { statusCode: number, name: string }
                if (!isNil(castedError)) {
                    void reply
                        .code(castedError.statusCode || 500)
                        .send({ error: castedError.name })
                }
                else {
                    next()
                }
            })
        }
    })

    await app.register(serverAdapter.registerPlugin(), {
        prefix: QUEUE_BASE_PATH,
        basePath: QUEUE_BASE_PATH,
    })
}