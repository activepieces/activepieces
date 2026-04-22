import path from 'path'
import { ApEnvironment, apId, ApMultipartFile, spreadIfDefined } from '@activepieces/shared'
import cors from '@fastify/cors'
import formBody from '@fastify/formbody'
import fastifyMultipart, { MultipartFile } from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import fastify, { FastifyInstance } from 'fastify'
import { fastifyRawBody } from 'fastify-raw-body'
import fastifySocketIO from 'fastify-socket'
import { validatorCompiler } from 'fastify-type-provider-zod'
import qs from 'qs'
import { Socket } from 'socket.io'
import { getAdapter, setupApp } from './app'
import { websocketService } from './core/websockets.service'
import { healthModule } from './health/health.module'
import { errorHandler } from './helper/error-handler'
import { exceptionHandler } from './helper/exception-handler'
import { rejectedPromiseHandler } from './helper/promise-handler'
import { system } from './helper/system/system'
import { AppSystemProp } from './helper/system/system-props'
import { mcpAgentController } from './mcp/mcp-agent-controller'
import { mcpOAuthHttpController } from './mcp/oauth/mcp-oauth.controller'
import { mcpOAuthRootModule } from './mcp/oauth/mcp-oauth.module'


export let app: FastifyInstance | undefined = undefined

export const setupServer = async (): Promise<FastifyInstance> => {
    app = await setupBaseApp()

    // MCP OAuth endpoints at domain root (required by MCP spec)
    if (system.isApp()) {
        await app.register(mcpOAuthRootModule)
        await app.register(mcpOAuthHttpController, { prefix: '/mcp' })
        await app.register(mcpAgentController, { prefix: '/api/v1/mcp/agent' })
    }

    await app.register(async (apiApp) => {
        await apiApp.register(healthModule)
        if (system.isApp()) {
            await setupApp(apiApp)
        }
    }, { prefix: '/api' })

    if (system.isApp()) {
        await app.register(fastifySocketIO, {
            cors: { origin: '*' },
            maxHttpBufferSize: 1e8,
            path: '/api/socket.io',
            ...spreadIfDefined('adapter', await getAdapter()),
            transports: ['websocket'],
        })
        app.io.use((socket: Socket, next: (err?: Error) => void) => {
            websocketService
                .verifyPrincipal(socket)
                .then(() => next())
                .catch(() => next(new Error('Authentication error')))
        })
        app.io.on('connection', (socket: Socket) => rejectedPromiseHandler(websocketService.init(socket, app!.log), app!.log))
        app.io.on('disconnect', (socket: Socket) => rejectedPromiseHandler(websocketService.onDisconnect(socket), app!.log))
    }

    const environment = system.get(AppSystemProp.ENVIRONMENT)
    if (system.isApp() && environment !== ApEnvironment.DEVELOPMENT) {
        const frontendPath = path.resolve(process.cwd(), 'dist/packages/web')
        await app.register(fastifyStatic, {
            root: frontendPath,
            setHeaders: (res, filepath) => {
                if (filepath.endsWith('.html')) {
                    void res.setHeader('Cache-Control', 'public, max-age=120')
                }
                else {
                    void res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
                }
            },
        })
    }

    app.setNotFoundHandler(async (request, reply) => {
        if (request.url.startsWith('/api/')) {
            return reply.code(404).send({ statusCode: 404, error: 'Not Found', message: 'Route not found' })
        }
        if (system.isApp() && environment !== ApEnvironment.DEVELOPMENT) {
            if (hasStaticFileExtension(request.url)) {
                return reply.code(404).send({ statusCode: 404, error: 'Not Found', message: 'Asset not found' })
            }
            return reply.sendFile('index.html')
        }
        return reply.code(404).send({ statusCode: 404, error: 'Not Found', message: 'Route not found' })
    })

    app.addHook('onSend', async (_request, reply) => {
        void reply.header('X-Content-Type-Options', 'nosniff')
        void reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
    })

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
        pluginTimeout: 120000,
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
    return app
}

const STATIC_FILE_EXTENSIONS = new Set(['.js', '.css', '.map', '.json', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot'])

function hasStaticFileExtension(url: string): boolean {
    const pathname = url.split('?')[0]
    const lastDot = pathname.lastIndexOf('.')
    if (lastDot === -1) return false
    return STATIC_FILE_EXTENSIONS.has(pathname.slice(lastDot))
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


