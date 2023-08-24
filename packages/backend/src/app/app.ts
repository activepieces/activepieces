import fastify, { FastifyRequest, HTTPMethods } from 'fastify'
import cors from '@fastify/cors'
import formBody from '@fastify/formbody'
import qs from 'qs'
import fastifyMultipart from '@fastify/multipart'
import { projectModule } from './project/project.module'
import { openapiModule } from './helper/openapi/openapi.module'
import { flowModule } from './flows/flow.module'
import { fileModule } from './file/file.module'
import { pieceModule } from './pieces/piece-module'
import { tokenVerifyMiddleware } from './authentication/token-verify-middleware'
import { storeEntryModule } from './store-entry/store-entry.module'
import { flowRunModule } from './flows/flow-run/flow-run-module'
import { flagModule } from './flags/flag.module'
import { flowWorkerModule } from './workers/flow-worker/flow-worker-module'
import { webhookModule } from './webhooks/webhook-module'
import { errorHandler } from './helper/error-handler'
import { appConnectionModule } from './app-connection/app-connection.module'
import swagger from '@fastify/swagger'
import { logger } from './helper/logger'
import { appEventRoutingModule } from './app-event-routing/app-event-routing.module'
import { triggerEventModule } from './flows/trigger-events/trigger-event.module'
import { flowInstanceModule } from './flows/flow-instance/flow-instance.module'

export const app = fastify({
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
app.register(fastifyMultipart, { addToBody: true })
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

// SurveyMonkey
app.addContentTypeParser('application/vnd.surveymonkey.response.v1+json', { parseAs: 'string' }, app.getDefaultJsonParser('ignore', 'ignore'))