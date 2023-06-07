import fastify, { FastifyRequest, HTTPMethods } from 'fastify'
import cors from '@fastify/cors'
import formBody from '@fastify/formbody'
import qs from 'qs'
import fastifyMultipart from '@fastify/multipart'

import { authenticationModule } from './app/authentication/authentication.module'
import { projectModule } from './app/project/project.module'
import { openapiModule } from './app/helper/openapi/openapi.module'
import { flowModule } from './app/flows/flow.module'
import { fileModule } from './app/file/file.module'
import { pieceModule } from './app/pieces/piece-module'
import { tokenVerifyMiddleware } from './app/authentication/token-verify-middleware'
import { storeEntryModule } from './app/store-entry/store-entry.module'
import { flowRunModule } from './app/flows/flow-run/flow-run-module'
import { flagModule } from './app/flags/flag.module'
import { flowWorkerModule } from './app/workers/flow-worker/flow-worker-module'
import { webhookModule } from './app/webhooks/webhook-module'
import { errorHandler } from './app/helper/error-handler'
import { appConnectionModule } from './app/app-connection/app-connection.module'
import { system, validateEnvPropsOnStartup } from './app/helper/system/system'
import { SystemProp } from './app/helper/system/system-prop'
import swagger from '@fastify/swagger'
import { databaseConnection } from './app/database/database-connection'
import { initilizeSentry, logger } from './app/helper/logger'
import { getEdition } from './app/helper/secret-helper'
import { ApEdition } from '@activepieces/shared'
import { appEventRoutingModule } from './app/app-event-routing/app-event-routing.module'
import { triggerEventModule } from './app/flows/trigger-events/trigger-event.module'
import { seedDevData } from './app/database/seeds/dev-seeds'
import { flowInstanceModule } from './app/flows/flow-instance/flow-instance.module'
import { closeAllConsumers } from './app/workers/flow-worker/flow-queue-consumer'

const app = fastify({
    logger,
    // Default 4MB, also set in nginx.conf
    bodyLimit: 4 * 1024 * 1024,
    ajv: {
        customOptions: {
            removeAdditional: 'all',
            useDefaults: true,
            coerceTypes: 'array',
            formats: {

            },
        },
    },
})

app.register(swagger, {
    openapi: {
        info: {
            title: 'Activepieces Documentation',
            version: '0.3.6',
        },
        externalDocs: {
            url: 'https://www.activepieces.com/docs',
            description: 'Find more info here',
        },
    },
})

app.register(cors, {
    origin: '*',
    methods: ['*'],
})
app.register(fastifyMultipart)
app.register(import('fastify-raw-body'), {
    field: 'rawBody',
    global: false,
    encoding: 'utf8',
    runFirst: true,
    routes: [],
})
app.register(formBody, { parser: str => qs.parse(str) })

app.addHook('onRequest', async (request, reply) => {
    const route = app.hasRoute({
        method: request.method as HTTPMethods,
        url: request.url,
    })
    if (!route) {
        reply.code(404).send(`
            Oops! It looks like we hit a dead end.
            The endpoint you're searching for is nowhere to be found.
            We suggest turning around and trying another path. Good luck!
        `)
    }
})

app.addHook('onRequest', tokenVerifyMiddleware)
app.register(projectModule)
app.register(fileModule)
app.register(flagModule)
app.register(storeEntryModule)
app.register(flowModule)
app.register(flowWorkerModule)
app.register(pieceModule)
app.register(flowInstanceModule)
app.register(flowRunModule)
app.register(webhookModule)
app.register(appConnectionModule)
app.register(openapiModule)
app.register(triggerEventModule)
app.register(appEventRoutingModule)

app.get(
    '/redirect',
    async (
        request: FastifyRequest<{ Querystring: { code: string } }>, reply,
    ) => {
        const params = {
            'code': request.query.code,
        }
        if (!params.code) {
            reply.send('The code is missing in url')
        }
        else {
            reply.type('text/html').send(`<script>if(window.opener){window.opener.postMessage({ 'code': '${encodeURIComponent(params.code)}' },'*')}</script> <html>Redirect succuesfully, this window should close now</html>`)
        }
    },
)
app.setErrorHandler(errorHandler)

const start = async () => {
    try {

        validateEnvPropsOnStartup()
        await databaseConnection.initialize()
        await databaseConnection.runMigrations()

        await seedDevData()

        const edition = await getEdition()
        logger.info('Activepieces ' + (edition == ApEdition.ENTERPRISE ? 'Enterprise' : 'Community') + ' Edition')
        if (edition === ApEdition.ENTERPRISE) {
            initilizeSentry()
        }
        else {
            app.register(authenticationModule)
        }
        await app.listen({
            host: '0.0.0.0',
            port: 3000,
        })

        logger.info(`
             _____   _______   _____  __      __  ______   _____    _____   ______    _____   ______    _____
    /\\      / ____| |__   __| |_   _| \\ \\    / / |  ____| |  __ \\  |_   _| |  ____|  / ____| |  ____|  / ____|
   /  \\    | |         | |      | |    \\ \\  / /  | |__    | |__) |   | |   | |__    | |      | |__    | (___
  / /\\ \\   | |         | |      | |     \\ \\/ /   |  __|   |  ___/    | |   |  __|   | |      |  __|    \\___ \\
 / ____ \\  | |____     | |     _| |_     \\  /    | |____  | |       _| |_  | |____  | |____  | |____   ____) |
/_/    \\_\\  \\_____|    |_|    |_____|     \\/     |______| |_|      |_____| |______|  \\_____| |______| |_____/

The application started on ${system.get(SystemProp.FRONTEND_URL)}, as specified by the AP_FRONTEND_URL variable.
    `)
    }
    catch (err) {
        logger.error(err)
        process.exit(1)
    }
}

start()

// This might be needed as it can be called twice
let shuttingDown = false

const stop = async () => {
    if (shuttingDown) return
    shuttingDown = true

    try {
        await app.close()
        await closeAllConsumers()
        logger.info('Server stopped')
        process.exit(0)
    }
    catch (err) {
        logger.error('Error stopping server', err)
        process.exit(1)
    }
}

process.on('SIGINT', stop)
process.on('SIGTERM', stop)
