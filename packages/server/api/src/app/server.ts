import { initializeSentry, logger, SharedSystemProp, system } from '@activepieces/server-shared'
import { apId, ApMultipartFile } from '@activepieces/shared'
import cors from '@fastify/cors'
import formBody from '@fastify/formbody'
import fastifyMultipart, { MultipartFile } from '@fastify/multipart'
import fastify, { FastifyBaseLogger, FastifyInstance } from 'fastify'
import fastifyFavicon from 'fastify-favicon'
import { fastifyRawBody } from 'fastify-raw-body'
import qs from 'qs'
import { setupApp } from './app'
import { healthModule } from './health/health.module'
import { errorHandler } from './helper/error-handler'
import { setupWorker } from './worker'
const MAX_FILE_SIZE_MB = system.getNumberOrThrow(SharedSystemProp.MAX_FILE_SIZE_MB)

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
        logger: logger as FastifyBaseLogger,
        ignoreTrailingSlash: true,
        pluginTimeout: 30000,
        // Default 100MB, also set in nginx.conf
        bodyLimit: (MAX_FILE_SIZE_MB + 4) * 1024 * 1024,
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
        async onFile(part: MultipartFile) {
            const apFile: ApMultipartFile = {
                filename: part.filename,
                data: await part.toBuffer(),
                type: 'file',
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (part as any).value = apFile
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
    await app.register(healthModule)

    return app
}

