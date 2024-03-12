import fastify, { FastifyInstance, FastifyRequest, HTTPMethods } from 'fastify'
import cors from '@fastify/cors'
import formBody from '@fastify/formbody'
import qs from 'qs'
import fastifyMultipart from '@fastify/multipart'
import fastifySocketIO from 'fastify-socket.io'
import { openapiModule } from './helper/openapi/openapi.module'
import { flowModule } from './flows/flow.module'
import { fileModule } from './file/file.module'
import { pieceModule } from './pieces/base-piece-module'
import { storeEntryModule } from './store-entry/store-entry.module'
import { flowRunModule } from './flows/flow-run/flow-run-module'
import { flagModule } from './flags/flag.module'
import { flowWorkerModule } from './workers/flow-worker/flow-worker-module'
import { webhookModule } from './webhooks/webhook-module'
import { errorHandler } from './helper/error-handler'
import { appConnectionModule } from './app-connection/app-connection.module'
import swagger from '@fastify/swagger'
import { logger } from 'server-shared'
import { appEventRoutingModule } from './app-event-routing/app-event-routing.module'
import { triggerEventModule } from './flows/trigger-events/trigger-event.module'
import { fastifyRawBody } from 'fastify-raw-body'
import { stepFileModule } from './flows/step-file/step-file.module'
import { rbacMiddleware } from './ee/authentication/rbac/rbac-middleware'
import { userModule } from './user/user.module'
import {
    ActivepiecesError,
    ApEdition,
    ApEnvironment,
    AppConnectionWithoutSensitiveData,
    CodeSandboxType,
    ErrorCode,
    Flow,
    FlowRun,
    ProjectWithLimits,
} from '@activepieces/shared'
import { appConnectionsHooks } from './app-connection/app-connection-service/app-connection-hooks'
import { authenticationModule } from './authentication/authentication.module'
import { cloudAppConnectionsHooks } from './ee/app-connections/cloud-app-connection-service'
import { appCredentialModule } from './ee/app-credentials/app-credentials.module'
import { connectionKeyModule } from './ee/connection-keys/connection-key.module'
import { platformRunHooks } from './ee/flow-run/cloud-flow-run-hooks'
import { platformFlowTemplateModule } from './ee/flow-template/platform-flow-template.module'
import { platformWorkerHooks } from './ee/flow-worker/cloud-flow-worker-hooks'
import { initilizeSentry } from 'server-shared'
import { adminPieceModule } from './ee/pieces/admin-piece-module'
import { platformPieceServiceHooks } from './ee/pieces/piece-service/platform-piece-service-hooks'
import { projectMemberModule } from './ee/project-members/project-member.module'
import { platformProjectModule } from './ee/projects/platform-project-module'
import { referralModule } from './ee/referrals/referral.module'
import { flowRunHooks } from './flows/flow-run/flow-run-hooks'
import { getEdition } from './helper/secret-helper'
import { pieceServiceHooks } from './pieces/piece-service/piece-service-hooks'
import { projectModule } from './project/project-module'
import { flowWorkerHooks } from './workers/flow-worker/flow-worker-hooks'
import { customDomainModule } from './ee/custom-domains/custom-domain.module'
import { authenticationServiceHooks } from './authentication/authentication-service/hooks'
import { enterpriseAuthenticationServiceHooks } from './ee/authentication/authentication-service/hooks/enterprise-authentication-service-hooks'
import { flowQueueConsumer } from './workers/flow-worker/flow-queue-consumer'
import { setupBullMQBoard } from './workers/flow-worker/queues/redis/redis-queue'
import { signingKeyModule } from './ee/signing-key/signing-key-module'
import { managedAuthnModule } from './ee/managed-authn/managed-authn-module'
import { oauthAppModule } from './ee/oauth-apps/oauth-app.module'
import { platformOAuth2Service } from './ee/app-connections/platform-oauth2-service'
import { setPlatformOAuthService } from './app-connection/app-connection-service/oauth2'
import { pieceMetadataServiceHooks } from './pieces/piece-metadata-service/hooks'
import { enterprisePieceMetadataServiceHooks } from './ee/pieces/enterprise-piece-metadata-service-hooks'
import { flagHooks } from './flags/flags.hooks'
import { enterpriseFlagsHooks } from './ee/flags/enterprise-flags.hooks'
import { communityPiecesModule } from './pieces/community-piece-module'
import { platformPieceModule } from './ee/pieces/platform-piece-module'
import { otpModule } from './ee/otp/otp-module'
import { cloudAuthenticationServiceHooks } from './ee/authentication/authentication-service/hooks/cloud-authentication-service-hooks'
import { enterpriseLocalAuthnModule } from './ee/authentication/enterprise-local-authn/enterprise-local-authn-module'
import { federatedAuthModule } from './ee/authentication/federated-authn/federated-authn-module'
import fastifyFavicon from 'fastify-favicon'
import {
    ProjectMember,
    GitRepoWithoutSensitiveData,
} from '@activepieces/ee-shared'
import { apiKeyModule } from './ee/api-keys/api-key-module'
import { domainHelper } from './helper/domain-helper'
import { platformDomainHelper } from './ee/helper/platform-domain-helper'
import { enterpriseUserModule } from './ee/user/enterprise-user-module'
import { flowResponseWatcher } from './flows/flow-run/flow-response-watcher'
import { securityHandlerChain } from './core/security/security-handler-chain'
import { communityFlowTemplateModule } from './flow-templates/community-flow-template.module'
import { copilotModule } from './copilot/copilot.module'
import { PieceMetadata } from '@activepieces/pieces-framework'
import { Socket } from 'socket.io'
import { accessTokenManager } from './authentication/lib/access-token-manager'
import { websocketService } from './websockets/websockets.service'
import { rateLimitModule } from './core/security/rate-limit'
import { eventsHooks } from './helper/application-events'
import { auditLogService } from './ee/audit-logs/audit-event-service'
import { auditEventModule } from './ee/audit-logs/audit-event-module'
import { ExecutionMode, QueueMode, SystemProp, system } from 'server-shared'
import { loadEncryptionKey } from './helper/encryption'
import { activityModule } from './ee/activity/activity-module'
import { redisSystemJob } from './ee/helper/redis-system-job'
import { usageTrackerModule } from './ee/usage-tracker/usage-tracker-module'
import { projectBillingModule } from './ee/billing/project-billing/project-billing.module'
import { appSumoModule } from './ee/billing/appsumo/appsumo.module'
import { platformModule } from './platform/platform.module'
import { gitRepoModule } from './ee/git-repos/git-repo.module'
import { formModule } from './flows/flow/form/form.module'
import { adminPlatformPieceModule } from './ee/platform/admin-platform.controller'

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

    await app.register(fastifyFavicon)

    await app.register(swagger, {
        hideUntagged: true,
        openapi: {
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
                    'project-member': ProjectMember,
                    project: ProjectWithLimits,
                    flow: Flow,
                    'flow-run': FlowRun,
                    'app-connection': AppConnectionWithoutSensitiveData,
                    piece: PieceMetadata,
                    'git-repo': GitRepoWithoutSensitiveData,
                },
            },
            info: {
                title: 'Activepieces Documentation',
                version: '0.14.3',
            },
            externalDocs: {
                url: 'https://www.activepieces.com/docs',
                description: 'Find more info here',
            },
        },
    })

    await app.register(cors, {
        origin: '*',
        exposedHeaders: ['*'],
        methods: ['*'],
    })

    await app.register(fastifyMultipart, {
        attachFieldsToBody: 'keyValues',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async onFile(part: any) {
            const buffer = await part.toBuffer()
            part.value = buffer
        },
    })

    await app.register(fastifyRawBody, {
        field: 'rawBody',
        global: false,
        encoding: 'utf8',
        runFirst: true,
        routes: [],
    })

    await app.register(formBody, { parser: (str) => qs.parse(str) })
    await app.register(rateLimitModule)

    await app.register(fastifySocketIO, {
        cors: {
            origin: '*',
        },
        transports: ['websocket'],
    })

    app.io.use((socket: Socket, next: (err?: Error) => void) => {
        accessTokenManager
            .extractPrincipal(socket.handshake.auth.token)
            .then(() => {
                next()
            })
            .catch(() => {
                next(new Error('Authentication error'))
            })
    })

    app.io.on('connection', (socket: Socket) => {
        websocketService.init(socket)
    })

    app.addHook('onRequest', async (request, reply) => {
        const route = app.hasRoute({
            method: request.method as HTTPMethods,
            url: request.url,
        })
        if (!route) {
            return reply.code(404).send({
                statusCode: 404,
                error: 'Not Found',
                message: 'Route not found',
            })
        }
    })

    app.addHook('preHandler', securityHandlerChain)
    app.addHook('preHandler', rbacMiddleware)
    app.setErrorHandler(errorHandler)
    await app.register(fileModule)
    await app.register(flagModule)
    await app.register(storeEntryModule)
    await app.register(flowModule)
    await app.register(flowWorkerModule)
    await app.register(pieceModule)
    await app.register(flowRunModule)
    await app.register(webhookModule)
    await app.register(appConnectionModule)
    await app.register(openapiModule)
    await app.register(triggerEventModule)
    await app.register(appEventRoutingModule)
    await app.register(stepFileModule)
    await app.register(userModule)
    await app.register(authenticationModule)
    await app.register(copilotModule)
    await app.register(platformModule)
    await app.register(formModule)

    await setupBullMQBoard(app)

    app.get(
        '/redirect',
        async (
            request: FastifyRequest<{ Querystring: { code: string } }>,
            reply,
        ) => {
            const params = {
                code: request.query.code,
            }
            if (!params.code) {
                return reply.send('The code is missing in url')
            }
            else {
                return reply
                    .type('text/html')
                    .send(
                        `<script>if(window.opener){window.opener.postMessage({ 'code': '${encodeURIComponent(
                            params.code,
                        )}' },'*')}</script> <html>Redirect succuesfully, this window should close now</html>`,
                    )
            }
        },
    )

    // SurveyMonkey
    app.addContentTypeParser(
        'application/vnd.surveymonkey.response.v1+json',
        { parseAs: 'string' },
        app.getDefaultJsonParser('ignore', 'ignore'),
    )
    await validateEnvPropsOnStartup()

    const edition = getEdition()
    logger.info(`Activepieces ${edition} Edition`)
    switch (edition) {
        case ApEdition.CLOUD:
            await app.register(appCredentialModule)
            await app.register(connectionKeyModule)
            await app.register(platformProjectModule)
            await app.register(projectMemberModule)
            await app.register(appSumoModule)
            await app.register(referralModule)
            await app.register(adminPieceModule)
            await app.register(customDomainModule)
            await app.register(signingKeyModule)
            await app.register(managedAuthnModule)
            await app.register(oauthAppModule)
            await app.register(platformPieceModule)
            await app.register(otpModule)
            await app.register(enterpriseLocalAuthnModule)
            await app.register(federatedAuthModule)
            await app.register(apiKeyModule)
            await app.register(enterpriseUserModule)
            await app.register(platformFlowTemplateModule)
            await app.register(gitRepoModule)
            await app.register(auditEventModule)
            await app.register(activityModule)
            await redisSystemJob.init()
            await app.register(projectBillingModule)
            await app.register(usageTrackerModule)
            await app.register(adminPlatformPieceModule)
            setPlatformOAuthService({
                service: platformOAuth2Service,
            })
            eventsHooks.set(auditLogService)
            appConnectionsHooks.setHooks(cloudAppConnectionsHooks)
            flowWorkerHooks.setHooks(platformWorkerHooks)
            flowRunHooks.setHooks(platformRunHooks)
            pieceServiceHooks.set(platformPieceServiceHooks)
            pieceMetadataServiceHooks.set(enterprisePieceMetadataServiceHooks)
            flagHooks.set(enterpriseFlagsHooks)
            authenticationServiceHooks.set(cloudAuthenticationServiceHooks)
            domainHelper.set(platformDomainHelper)
            initilizeSentry()
            break
        case ApEdition.ENTERPRISE:
            await app.register(customDomainModule)
            await app.register(platformProjectModule)
            await app.register(projectMemberModule)
            await app.register(signingKeyModule)
            await app.register(managedAuthnModule)
            await app.register(oauthAppModule)
            await app.register(platformPieceModule)
            await app.register(otpModule)
            await app.register(enterpriseLocalAuthnModule)
            await app.register(federatedAuthModule)
            await app.register(apiKeyModule)
            await app.register(enterpriseUserModule)
            await app.register(platformFlowTemplateModule)
            await app.register(gitRepoModule)
            await app.register(auditEventModule)
            await app.register(activityModule)
            await redisSystemJob.init()
            await app.register(usageTrackerModule)
            setPlatformOAuthService({
                service: platformOAuth2Service,
            })
            eventsHooks.set(auditLogService)
            pieceServiceHooks.set(platformPieceServiceHooks)
            flowRunHooks.setHooks(platformRunHooks)
            flowWorkerHooks.setHooks(platformWorkerHooks)
            authenticationServiceHooks.set(enterpriseAuthenticationServiceHooks)
            pieceMetadataServiceHooks.set(enterprisePieceMetadataServiceHooks)
            flagHooks.set(enterpriseFlagsHooks)
            domainHelper.set(platformDomainHelper)
            break
        case ApEdition.COMMUNITY:
            await app.register(projectModule)
            await app.register(communityPiecesModule)
            await app.register(communityFlowTemplateModule)
            break
    }

    app.addHook('onClose', async () => {
        await flowQueueConsumer.close()
        await redisSystemJob.close()
        await flowResponseWatcher.shutdown()
    })

    return app
}


const validateEnvPropsOnStartup = async (): Promise<void> => {
    const codeSandboxType = system.get<CodeSandboxType>(
        SystemProp.CODE_SANDBOX_TYPE,
    )
    const executionMode = system.get<ExecutionMode>(SystemProp.EXECUTION_MODE)
    const signedUpEnabled =
        system.getBoolean(SystemProp.SIGN_UP_ENABLED) ?? false
    const queueMode = system.getOrThrow<QueueMode>(SystemProp.QUEUE_MODE)
    const environment = system.get(SystemProp.ENVIRONMENT)
    await loadEncryptionKey(queueMode)

    if (
        executionMode === ExecutionMode.UNSANDBOXED &&
        codeSandboxType !== CodeSandboxType.V8_ISOLATE &&
        signedUpEnabled &&
        environment === ApEnvironment.PRODUCTION
    ) {
        throw new ActivepiecesError(
            {
                code: ErrorCode.SYSTEM_PROP_INVALID,
                params: {
                    prop: SystemProp.EXECUTION_MODE,
                },
            },
            'Allowing users to sign up is not allowed in unsandboxed mode, please check the configuration section in the documentation',
        )
    }
}
