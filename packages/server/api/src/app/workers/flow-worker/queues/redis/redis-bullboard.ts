import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { FastifyAdapter } from '@bull-board/fastify'
import basicAuth from '@fastify/basic-auth'
import { FastifyInstance } from 'fastify'
import { getEdition } from '../../../../helper/secret-helper'
import { redisQueueManager } from './redis-queue'
import { logger, system, SystemProp } from '@activepieces/server-shared'
import { ApEdition, ApEnvironment, isNil } from '@activepieces/shared'
const QUEUE_BASE_PATH = '/ui'

function isQueueEnabled(): boolean {
    const edition = getEdition()
    if (edition === ApEdition.CLOUD) {
        return false
    }
    return system.getBoolean(SystemProp.QUEUE_UI_ENABLED) ?? false
}

export async function setupBullMQBoard(app: FastifyInstance): Promise<void> {
    if (!isQueueEnabled()) {
        return
    }
    const queueUsername = system.getOrThrow(SystemProp.QUEUE_UI_USERNAME)
    const queuePassword = system.getOrThrow(SystemProp.QUEUE_UI_PASSWORD)
    logger.info(
        '[setupBullMQBoard] Setting up bull board, visit /ui to see the queues',
    )

    await app.register(basicAuth, {
        validate: (username, password, _req, reply, done) => {
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
        queues: [
            new BullMQAdapter(redisQueueManager.getOneTimeJobQueue()),
            new BullMQAdapter(redisQueueManager.getScheduledJobQueue()),
            new BullMQAdapter(redisQueueManager.getWebhookJobQueue()),
        ],
        serverAdapter,
    })
    const environment =
        system.get(SystemProp.ENVIRONMENT) ?? ApEnvironment.DEVELOPMENT
    switch (environment) {
        case ApEnvironment.DEVELOPMENT:
            serverAdapter.setBasePath(QUEUE_BASE_PATH)
            break
        case ApEnvironment.PRODUCTION:
            serverAdapter.setBasePath(`/api${QUEUE_BASE_PATH}`)
            break
        case ApEnvironment.TESTING:
            throw new Error('Not supported')
    }

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