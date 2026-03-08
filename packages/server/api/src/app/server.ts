import { apId, ApMultipartFile } from '@activepieces/shared'
import cors from '@fastify/cors'
import formBody from '@fastify/formbody'
import fastifyMultipart, { MultipartFile } from '@fastify/multipart'
import fastify, { FastifyInstance } from 'fastify'
import fastifyFavicon from 'fastify-favicon'
import { fastifyRawBody } from 'fastify-raw-body'
import { validatorCompiler } from 'fastify-type-provider-zod'
import qs from 'qs'
import { setupApp } from './app'
import { healthModule } from './health/health.module'
import { errorHandler } from './helper/error-handler'
import { exceptionHandler } from './helper/exception-handler'
import { system } from './helper/system/system'
import { AppSystemProp } from './helper/system/system-props'


export let app: FastifyInstance | undefined = undefined

export const setupServer = async (): Promise<FastifyInstance> => {
    app = await setupBaseApp()

    if (system.isApp()) {
        await setupApp(app)
    }
    return app
}

async function setupBaseApp(): Promise<FastifyInstance> {
    const fileSizeLimit = system.getNumberOrThrow(AppSystemProp.MAX_FILE_SIZE_MB)
    const flowRunLogSizeLimit = system.getNumberOrThrow(AppSystemProp.MAX_FLOW_RUN_LOG_SIZE_MB)
    const app = fastify({
        disableRequestLogging: true,
        querystringParser: qs.parse,
        loggerInstance: system.globalLogger(),
        ignoreTrailingSlash: true,
        pluginTimeout: 30000,
        // Default 100MB, also set in nginx.conf
        bodyLimit: Math.max(fileSizeLimit + 4, flowRunLogSizeLimit + 4, 25) * 1024 * 1024,
        genReqId: () => {
            return `req_${apId()}`
        },
    })

    app.setValidatorCompiler(validatorCompiler)
    app.setSerializerCompiler(({ schema: maybeSchema }) => {
        const schema = resolveZodSchema(maybeSchema)
        return (data) => {
            if (schema) {
                const preprocessed = convertDatesToStrings(data)
                const result = schema.safeParse(preprocessed)
                if (result.success) {
                    return JSON.stringify(result.data)
                }
            }
            return JSON.stringify(data)
        }
    })

    await app.register(fastifyFavicon)
    await app.register(fastifyMultipart, {
        attachFieldsToBody: 'keyValues',
        async onFile(part: MultipartFile) {
            const apFile: ApMultipartFile = {
                filename: part.filename,
                data: await part.toBuffer(),
                type: 'file',
                mimetype: part.mimetype,
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (part as any).value = apFile
        },
    })
    exceptionHandler.initializeSentry(system.get(AppSystemProp.SENTRY_DSN))


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

type ZodLike = { safeParse: (data: unknown) => { success: boolean, data?: unknown } }

function resolveZodSchema(maybeSchema: unknown): ZodLike | null {
    if (typeof maybeSchema === 'object' && maybeSchema !== null) {
        if ('safeParse' in maybeSchema) {
            return maybeSchema as ZodLike
        }
        if ('properties' in maybeSchema) {
            const props = (maybeSchema as Record<string, unknown>).properties
            if (typeof props === 'object' && props !== null && 'safeParse' in props) {
                return props as ZodLike
            }
        }
    }
    return null
}

function convertDatesToStrings(data: unknown): unknown {
    if (data instanceof Date) {
        return data.toISOString()
    }
    if (Array.isArray(data)) {
        return data.map(convertDatesToStrings)
    }
    if (typeof data === 'object' && data !== null) {
        const result: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(data)) {
            result[key] = convertDatesToStrings(value)
        }
        return result
    }
    return data
}


