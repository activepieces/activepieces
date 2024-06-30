import cors from '@fastify/cors'
import formBody from '@fastify/formbody'
import fastifyMultipart from '@fastify/multipart'
import fastify, { FastifyInstance } from 'fastify'
import fastifyFavicon from 'fastify-favicon'
import { fastifyRawBody } from 'fastify-raw-body'
import qs from 'qs'
import { setupApp } from './app'
import { errorHandler } from './helper/error-handler'
import { setupWorker } from './worker'
import { initializeSentry, logger, system } from '@activepieces/server-shared'
import { apId } from '@activepieces/shared'


export const setupServer = async (): Promise<FastifyInstance> => {
    const app = await setupBaseApp()

    if (system.isApp()) {
        await setupApp(app)
    }
    if (system.isWorker()) {
        await setupWorker(app)
    }
    return app
}



async function setupBaseApp(): Promise<FastifyInstance> {
    const app = fastify({
        logger,
        // Default 4MB, also set in nginx.conf
        pluginTimeout: 30000,
        bodyLimit: 4 * 1024 * 1024,
        genReqId: () => {
            return `req_${apId()}`
        },
        ajv: {
            customOptions: {
                removeAdditional: 'all',
                useDefaults: true,
                coerceTypes: 'array',
                formats: {},
            },
        },
    })

    await app.register(fastifyFavicon)
    await app.register(fastifyMultipart, {
        attachFieldsToBody: 'keyValues',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async onFile(part: any) {
            const buffer = await part.toBuffer()
            part.value = buffer
        },
    })
    initializeSentry()


    await app.register(fastifyRawBody, {
        field: 'rawBody',
        global: false,
        encoding: 'utf8',
        runFirst: true,
        routes: [],
    })

    await app.register(formBody, { parser: (str) => qs.parse(str) })
    app.setErrorHandler(errorHandler)
    await app.register(cors, {
        origin: '*',
        exposedHeaders: ['*'],
        methods: ['*'],
    })
    // SurveyMonkey
    app.addContentTypeParser(
        'application/vnd.surveymonkey.response.v1+json',
        { parseAs: 'string' },
        app.getDefaultJsonParser('ignore', 'ignore'),
    )
    return app
}

