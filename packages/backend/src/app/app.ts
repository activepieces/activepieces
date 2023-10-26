import fastify, { FastifyInstance, FastifyRequest, HTTPMethods } from 'fastify'
import cors from '@fastify/cors'
import formBody from '@fastify/formbody'
import qs from 'qs'
import fastifyMultipart from '@fastify/multipart'
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
import { apiKeyAuthMiddleware } from './ee/authentication/api-key-auth-middleware.ee'
import { fastifyRawBody } from 'fastify-raw-body'
import { stepFileModule } from './flows/step-file/step-file.module'
import { chatbotModule } from './chatbot/chatbot.module'
import { rbacAuthMiddleware } from './ee/authentication/rbac-auth-middleware'
import { userModule } from './user/user.module'
import { ApEdition } from '@activepieces/shared'
import { appConnectionsHooks } from './app-connection/app-connection-service/app-connection-hooks'
import { authenticationModule } from './authentication/authentication.module'
import { chatbotHooks } from './chatbot/chatbot.hooks'
import { datasourceHooks } from './chatbot/datasources/datasource.hooks'
import { embeddings } from './chatbot/embedings'
import { cloudAppConnectionsHooks } from './ee/app-connections/cloud-app-connection-service'
import { appCredentialModule } from './ee/app-credentials/app-credentials.module'
import { appSumoModule } from './ee/appsumo/appsumo.module'
import { billingModule } from './ee/billing/billing.module'
import { cloudChatbotHooks } from './ee/chatbot/cloud/cloud-chatbot.hook'
import { cloudDatasourceHooks } from './ee/chatbot/cloud/cloud-datasources.hook'
import { qdrantEmbeddings } from './ee/chatbot/cloud/qdrant-embeddings'
import { connectionKeyModule } from './ee/connection-keys/connection-key.module'
import { firebaseAuthenticationModule } from './ee/firebase-auth/firebase-authentication.module'
import { cloudRunHooks } from './ee/flow-run/cloud-flow-run-hooks'
import { flowTemplateModule } from './ee/flow-template/flow-template.module'
import { cloudWorkerHooks } from './ee/flow-worker/cloud-flow-worker-hooks'
import { initilizeSentry } from './ee/helper/exception-handler'
import { adminPieceModule } from './ee/pieces/admin-piece-module'
import { cloudPieceServiceHooks } from './ee/pieces/piece-service/cloud-piece-service-hooks'
import { platformModule } from './ee/platform/platform.module'
import { projectMemberModule } from './ee/project-members/project-member.module'
import { enterpriseProjectModule } from './ee/projects/enterprise-project-controller'
import { referralModule } from './ee/referrals/referral.module'
import { flowRunHooks } from './flows/flow-run/flow-run-hooks'
import { getEdition } from './helper/secret-helper'
import { pieceServiceHooks } from './pieces/piece-service/piece-service-hooks'
import { projectModule } from './project/project-module'
import { flowWorkerHooks } from './workers/flow-worker/flow-worker-hooks'
import { customDomainModule } from './ee/custom-domains/custom-domain.module'
import { setupBullMQBoard } from './workers/flow-worker/queues/redis/redis-queue'

export const setupApp = async (): Promise<FastifyInstance> => {
    const app = fastify({
        logger,
        // Default 4MB, also set in nginx.conf
        bodyLimit: 4 * 1024 * 1024,
        ajv: {
            customOptions: {
                removeAdditional: 'all',
                useDefaults: true,
                coerceTypes: 'array',
                formats: {},
            },
        },
    })

    await app.register(swagger, {
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

    await app.register(cors, {
        origin: '*',
        methods: ['*'],
    })

    await app.register(
        fastifyMultipart,
        {
            attachFieldsToBody: 'keyValues',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            async onFile(part: any) {
                const buffer = await part.toBuffer()
                part.value = buffer
            },
        },
    )

    await app.register(fastifyRawBody, {
        field: 'rawBody',
        global: false,
        encoding: 'utf8',
        runFirst: true,
        routes: [],
    })

    await app.register(formBody, { parser: str => qs.parse(str) })

    app.addHook('onRequest', async (request, reply) => {
        const route = app.hasRoute({
            method: request.method as HTTPMethods,
            url: request.url,
        })
        if (!route) {
            return reply.code(404).send(`
                Oops! It looks like we hit a dead end.
                The endpoint you're searching for is nowhere to be found.
                We suggest turning around and trying another path. Good luck!
            `)
        }
    })

    // BEGIN EE
    app.addHook('onRequest', apiKeyAuthMiddleware)
    // END EE
    app.addHook('onRequest', tokenVerifyMiddleware)
    // BEGIN EE
    app.addHook('onRequest', rbacAuthMiddleware)
    // END EE
    app.setErrorHandler(errorHandler)
    await app.register(fileModule)
    await app.register(flagModule)
    await app.register(storeEntryModule)
    await app.register(flowModule)
    await app.register(flowWorkerModule)
    await app.register(pieceModule)
    await app.register(flowInstanceModule)
    await app.register(flowRunModule)
    await app.register(webhookModule)
    await app.register(appConnectionModule)
    await app.register(openapiModule)
    await app.register(triggerEventModule)
    await app.register(appEventRoutingModule)
    await app.register(stepFileModule)
    await app.register(chatbotModule)
    await app.register(userModule)

    await setupBullMQBoard(app)

    app.get(
        '/redirect',
        async (
            request: FastifyRequest<{ Querystring: { code: string } }>, reply,
        ) => {
            const params = {
                'code': request.query.code,
            }
            if (!params.code) {
                return reply.send('The code is missing in url')
            }
            else {
                return reply.type('text/html').send(`<script>if(window.opener){window.opener.postMessage({ 'code': '${encodeURIComponent(params.code)}' },'*')}</script> <html>Redirect succuesfully, this window should close now</html>`)
            }
        },
    )

    // SurveyMonkey
    app.addContentTypeParser('application/vnd.surveymonkey.response.v1+json', { parseAs: 'string' }, app.getDefaultJsonParser('ignore', 'ignore'))

    const edition = getEdition()
    logger.info(`Activepieces ${edition} Edition`)
    switch (edition) {
        case ApEdition.CLOUD:
            await app.register(firebaseAuthenticationModule)
            await app.register(billingModule)
            await app.register(appCredentialModule)
            await app.register(connectionKeyModule)
            await app.register(flowTemplateModule)
            await app.register(enterpriseProjectModule)
            await app.register(projectMemberModule)
            await app.register(appSumoModule)
            await app.register(referralModule)
            await app.register(adminPieceModule)
            await app.register(platformModule)
            await app.register(customDomainModule)
            chatbotHooks.setHooks(cloudChatbotHooks)
            datasourceHooks.setHooks(cloudDatasourceHooks)
            embeddings.set(qdrantEmbeddings)
            appConnectionsHooks.setHooks(cloudAppConnectionsHooks)
            flowWorkerHooks.setHooks(cloudWorkerHooks)
            flowRunHooks.setHooks(cloudRunHooks)
            pieceServiceHooks.set(cloudPieceServiceHooks)
            initilizeSentry()
            break
        case ApEdition.ENTERPRISE:
            await app.register(authenticationModule)
            await app.register(enterpriseProjectModule)
            await app.register(projectMemberModule)
            await app.register(platformModule)
            await app.register(customDomainModule)
            pieceServiceHooks.set(cloudPieceServiceHooks)
            break
        case ApEdition.COMMUNITY:
            await app.register(authenticationModule)
            await app.register(projectModule)
            break
    }

    return app
}
