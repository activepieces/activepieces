import { PieceMetadata } from '@activepieces/pieces-framework'
import { ApEnvironment, AppConnectionWithoutSensitiveData, ApplicationEventName, ConnectionDeletedEvent, ConnectionUpsertedEvent, Flow, FlowActivatedEvent, FlowCreatedEvent, FlowDeactivatedEvent, FlowDeletedEvent, FlowPublishedEvent, FlowRun, FlowRunFinishedEvent, FlowRunRetriedEvent, FlowRunStartedEvent, FlowUpdatedEvent, Folder, FolderCreatedEvent, FolderDeletedEvent, FolderUpdatedEvent, isNil, ProjectWithLimits, SignUpEvent, Template, UserEmailVerifiedEvent, UserInvitation, UserPasswordResetEvent, UserSignedInEvent, UserWithMetaInformation } from '@activepieces/shared'
import replyFrom from '@fastify/reply-from'
import swagger from '@fastify/swagger'
import { createAdapter } from '@socket.io/redis-adapter'
import { FastifyInstance, FastifyRequest, HTTPMethods } from 'fastify'
import { jsonSchemaTransform, jsonSchemaTransformObject } from 'fastify-type-provider-zod'
import Mustache from 'mustache'
import { globalRegistry } from 'zod/v4/core'
import { agentsModule } from './agents/agents-module'
import { aiProviderService } from './ai/ai-provider-service'
import { aiProviderModule } from './ai/ai-provider.module'
import { platformAnalyticsModule } from './analytics/platform-analytics.module'
import { appConnectionModule } from './app-connection/app-connection.module'
import { platformAppConnectionModule } from './app-connection/platform-app-connection.module'
import { authenticationModule } from './authentication/authentication.module'
import { canaryRoutingMiddleware } from './core/canary/canary-routing.middleware'
import { collaborativeModule } from './core/collaborative/collaborative.module'
import { rateLimitModule } from './core/security/rate-limit'
import { authenticationMiddleware } from './core/security/v2/authn/authentication-middleware'
import { authorizationMiddleware } from './core/security/v2/authz/authorization-middleware'
import { distributedLock, redisConnections } from './database/redis-connections'
import { fileModule } from './file/file.module'
import { flagModule } from './flags/flag.module'
import { flowBackgroundJobs } from './flows/flow/flow.jobs'
import { humanInputModule } from './flows/flow/human-input/human-input.module'
import { flowRunModule } from './flows/flow-run/flow-run-module'
import { flowModule } from './flows/flow.module'
import { folderModule } from './flows/folder/folder.module'
import { domainHelper } from './helper/domain-helper'
import { openapiModule } from './helper/openapi/openapi.module'
import { system } from './helper/system/system'
import { AppSystemProp } from './helper/system/system-props'
import { SystemJobName } from './helper/system-jobs/common'
import { systemJobHandlers } from './helper/system-jobs/job-handlers'
import { systemJobsSchedule } from './helper/system-jobs/system-job'
import { validateEnvPropsOnStartup } from './helper/system-validator'
import { knowledgeBaseModule } from './knowledge-base/knowledge-base.module'
import { mcpServerModule } from './mcp/mcp-module'
import { mcpOAuthApproveController } from './mcp/oauth/code/mcp-oauth-approve.controller'
import { communityPiecesModule } from './pieces/community-piece-module'
import { startDevPieceWatcher } from './pieces/dev-piece-watcher'
import { pieceModule } from './pieces/metadata/piece-metadata-controller'
import { pieceMetadataService } from './pieces/metadata/piece-metadata-service'
import { pieceSyncService } from './pieces/piece-sync-service'
import { tagsModule } from './pieces/tags/tags-module'
import { platformModule } from './platform/platform.module'
import { storeEntryModule } from './store-entry/store-entry.module'
import { tablesModule } from './tables/tables.module'
import { templateModule } from './template/template.module'
import { appEventRoutingModule } from './trigger/app-event-routing/app-event-routing.module'
import { triggerModule } from './trigger/trigger.module'
import { userBadgeModule } from './user/badges/badge-module'
import { platformUserModule } from './user/platform/platform-user-module'
import { invitationModule } from './user-invitations/user-invitation.module'
import { variableModule } from './variable/variable.module'
import { webhookModule } from './webhooks/webhook-module'
import { engineResponseWatcher } from './workers/engine-response-watcher'

import { migrateQueuesAndRunConsumers, workerModule } from './workers/worker-module'

export const setupApp = async (app: FastifyInstance): Promise<FastifyInstance> => {

    app.addContentTypeParser('application/octet-stream', { parseAs: 'buffer' }, async (_request: FastifyRequest, payload: unknown) => {
        return payload as Buffer
    })

    registerOpenApiSchemas()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await app.register(swagger as any, {
        hideUntagged: true,
        transform: jsonSchemaTransform,
        transformObject: jsonSchemaTransformObject,
        openapi: {
            openapi: '3.1.0',
            servers: [
                {
                    url: 'https://cloud.activepieces.com/api',
                    description: 'Production Server',
                },
            ],
            components: {
                securitySchemes: {
                    apiKey: {
                        type: 'http',
                        description: 'Use your api key generated from the admin console',
                        scheme: 'bearer',
                    },
                },
                schemas: {
                    'global-connection': { $ref: '#/components/schemas/app-connection' },
                },
            },
            info: {
                title: 'Activepieces Documentation',
                version: '0.0.0',
            },
            externalDocs: {
                url: 'https://www.activepieces.com/docs',
                description: 'Find more info here',
            },
        },
    })


    await app.register(rateLimitModule)
    app.addHook('onResponse', async (request, reply) => {
        // eslint-disable-next-line
        reply.header('x-request-id', request.id)
    })
    app.addHook('onRequest', async (request, reply) => {
        const route = app.hasRoute({
            method: request.method as HTTPMethods,
            url: request.routeOptions.url!,
        })
        if (!route) {
            return reply.code(404).send({
                statusCode: 404,
                error: 'Not Found',
                message: 'Route not found',
            })
        }
    })

    app.addHook('preHandler', authenticationMiddleware)
    app.addHook('preHandler', authorizationMiddleware)

    const canaryAppUrl = system.get(AppSystemProp.CANARY_APP_URL)
    if (!isNil(canaryAppUrl)) {
        await app.register(replyFrom, { base: canaryAppUrl })
        app.addHook('preHandler', canaryRoutingMiddleware)
    }

    await systemJobsSchedule(app.log).init()
    await app.register(fileModule)
    await app.register(flagModule)
    await app.register(storeEntryModule)
    await app.register(folderModule)
    await pieceSyncService(app.log).setup()
    await pieceMetadataService(app.log).setup()
    await app.register(pieceModule)
    await app.register(collaborativeModule)
    await app.register(flowModule)
    await app.register(flowRunModule)
    await app.register(webhookModule)
    await app.register(appConnectionModule)
    await app.register(platformAppConnectionModule)
    await app.register(variableModule)
    await app.register(openapiModule)
    await app.register(appEventRoutingModule)
    await app.register(authenticationModule)
    await app.register(triggerModule)
    await app.register(platformModule)
    await app.register(humanInputModule)
    await app.register(tagsModule)
    await app.register(mcpServerModule)
    await app.register(mcpOAuthApproveController)
    await app.register(agentsModule)
    await app.register(platformUserModule)
    await app.register(invitationModule)
    await app.register(workerModule)
    await aiProviderService(app.log).setup()
    await app.register(aiProviderModule)
    await app.register(tablesModule)
    await app.register(knowledgeBaseModule)
    await app.register(templateModule)
    await app.register(userBadgeModule)
    await app.register(platformAnalyticsModule)
    systemJobHandlers.registerJobHandler(SystemJobName.DELETE_FLOW, (data) => flowBackgroundJobs(app.log).deleteFlowHandler(data))

    app.get(
        '/redirect',
        async (
            request: FastifyRequest<{ Querystring: { code: string } }>,
            reply,
        ) => {
            const code = request.query.code
            if (!code) {
                return reply.type('text/plain').send('The code is missing in url')
            }
            return reply
                .type('text/html')
                .header('Content-Security-Policy', 'default-src \'none\'; script-src \'unsafe-inline\'')
                .header('X-Content-Type-Options', 'nosniff')
                .send(Mustache.render(REDIRECT_HTML_TEMPLATE, { code }))
        },
    )

    await validateEnvPropsOnStartup(app.log)

    await app.register(communityPiecesModule)

    const isCanaryApp = system.getBoolean(AppSystemProp.IS_CANARY_APP) ?? false
    if (isCanaryApp) {
        app.log.info('[setupApp] Skipping system jobs worker on canary app instance')
    }
    else {
        await systemJobsSchedule(app.log).startWorker()
    }

    app.addHook('onClose', async () => {
        app.log.info('Shutting down')
        await systemJobsSchedule(app.log).close()
        await redisConnections.destroy()
        await distributedLock(app.log).destroy()
        await engineResponseWatcher(app.log).shutdown()
    })

    return app
}



export async function getAdapter() {
    const redisConnectionInstance = await redisConnections.useExisting()
    const sub = redisConnectionInstance.duplicate()
    const pub = redisConnectionInstance.duplicate()
    return createAdapter(pub, sub, {
        requestsTimeout: 30000,
    })
}


export async function appPostBoot(app: FastifyInstance): Promise<void> {

    app.log.info(`
             _____   _______   _____  __      __  ______   _____    _____   ______    _____   ______    _____
    /\\      / ____| |__   __| |_   _| \\ \\    / / |  ____| |  __ \\  |_   _| |  ____|  / ____| |  ____|  / ____|
   /  \\    | |         | |      | |    \\ \\  / /  | |__    | |__) |   | |   | |__    | |      | |__    | (___
  / /\\ \\   | |         | |      | |     \\ \\/ /   |  __|   |  ___/    | |   |  __|   | |      |  __|    \\___ \\
 / ____ \\  | |____     | |     _| |_     \\  /    | |____  | |       _| |_  | |____  | |____  | |____   ____) |
/_/    \\_\\  \\_____|    |_|    |_____|     \\/     |______| |_|      |_____| |______|  \\_____| |______| |_____/

The application started on ${await domainHelper.getPublicApiUrl({ path: '' })}, as specified by the AP_FRONTEND_URL variables.`)

    const environment = system.get(AppSystemProp.ENVIRONMENT)
    const pieces = process.env.AP_DEV_PIECES

    await migrateQueuesAndRunConsumers(app)
    app.log.info('Queues migrated and consumers run')
    if (environment === ApEnvironment.DEVELOPMENT) {
        app.log.warn(
            `[WARNING]: The application is running in ${environment} mode.`,
        )
        app.log.warn(
            `[WARNING]: This is only shows pieces specified in AP_DEV_PIECES ${pieces} environment variable.`,
        )
    }
    void startDevPieceWatcher(app)
}

function registerOpenApiSchemas() {
    globalRegistry.add(FlowCreatedEvent, { id: ApplicationEventName.FLOW_CREATED })
    globalRegistry.add(FlowUpdatedEvent, { id: ApplicationEventName.FLOW_UPDATED })
    globalRegistry.add(FlowDeletedEvent, { id: ApplicationEventName.FLOW_DELETED })
    globalRegistry.add(FlowPublishedEvent, { id: ApplicationEventName.FLOW_PUBLISHED })
    globalRegistry.add(FlowActivatedEvent, { id: ApplicationEventName.FLOW_ACTIVATED })
    globalRegistry.add(FlowDeactivatedEvent, { id: ApplicationEventName.FLOW_DEACTIVATED })
    globalRegistry.add(ConnectionUpsertedEvent, { id: ApplicationEventName.CONNECTION_UPSERTED })
    globalRegistry.add(ConnectionDeletedEvent, { id: ApplicationEventName.CONNECTION_DELETED })
    globalRegistry.add(FolderCreatedEvent, { id: ApplicationEventName.FOLDER_CREATED })
    globalRegistry.add(FolderUpdatedEvent, { id: ApplicationEventName.FOLDER_UPDATED })
    globalRegistry.add(FolderDeletedEvent, { id: ApplicationEventName.FOLDER_DELETED })
    globalRegistry.add(FlowRunStartedEvent, { id: ApplicationEventName.FLOW_RUN_STARTED })
    globalRegistry.add(FlowRunFinishedEvent, { id: ApplicationEventName.FLOW_RUN_FINISHED })
    globalRegistry.add(FlowRunRetriedEvent, { id: ApplicationEventName.FLOW_RUN_RETRIED })
    globalRegistry.add(SignUpEvent, { id: ApplicationEventName.USER_SIGNED_UP })
    globalRegistry.add(UserSignedInEvent, { id: ApplicationEventName.USER_SIGNED_IN })
    globalRegistry.add(UserPasswordResetEvent, { id: ApplicationEventName.USER_PASSWORD_RESET })
    globalRegistry.add(UserEmailVerifiedEvent, { id: ApplicationEventName.USER_EMAIL_VERIFIED })
    globalRegistry.add(Template, { id: 'template' })
    globalRegistry.add(Folder, { id: 'folder' })
    globalRegistry.add(UserWithMetaInformation, { id: 'user' })
    globalRegistry.add(UserInvitation, { id: 'user-invitation' })
    globalRegistry.add(ProjectWithLimits, { id: 'project' })
    globalRegistry.add(Flow, { id: 'flow' })
    globalRegistry.add(FlowRun, { id: 'flow-run' })
    globalRegistry.add(AppConnectionWithoutSensitiveData, { id: 'app-connection' })
    globalRegistry.add(PieceMetadata, { id: 'piece' })
}

const REDIRECT_HTML_TEMPLATE = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Redirect</title></head>
<body>
Redirect successful, this window should close now.
<meta id="ap-oauth-code" content="{{code}}">
<script>
(function () {
    var el = document.getElementById('ap-oauth-code');
    var code = el ? el.getAttribute('content') : null;
    if (window.opener && code) {
        window.opener.postMessage({ code: code }, '*');
    }
})();
</script>
</body>
</html>`
