import { logger, system, SystemProp } from '@activepieces/server-shared'
import { ApEdition, isNil } from '@activepieces/shared'
import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { FastifyAdapter } from '@bull-board/fastify'
import basicAuth from '@fastify/basic-auth'
import { FastifyInstance } from 'fastify'
import { bullmqQueues } from './redis-queue'

const QUEUE_BASE_PATH = '/ui'

export async function setupBullMQBoard(app: FastifyInstance): Promise<void> {
    const edition = system.getEdition()
    const isQueueEnabled = (edition !== ApEdition.CLOUD) && (system.getBoolean(SystemProp.QUEUE_UI_ENABLED) ?? false)
    if (!isQueueEnabled) {
        return
    }
    const queueUsername = system.getOrThrow(SystemProp.QUEUE_UI_USERNAME)
    const queuePassword = system.getOrThrow(SystemProp.QUEUE_UI_PASSWORD)
    logger.info(
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

    const serverAdapter = new FastifyAdapter()
    createBullBoard({
        queues: Object.values(bullmqQueues).map((queue) => new BullMQAdapter(queue)),
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