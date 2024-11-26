import { ApplicationEventName, AuthenticationEvent, ConnectionEvent, FlowCreatedEvent, FlowDeletedEvent, FlowRunEvent, FolderEvent, GitRepoWithoutSensitiveData, ProjectMember, ProjectRoleEvent, SigningKeyEvent, SignUpEvent } from '@activepieces/ee-shared'
import { PieceMetadata } from '@activepieces/pieces-framework'
import { AppSystemProp, initializeSentry, logger, QueueMode, rejectedPromiseHandler, SharedSystemProp, system } from '@activepieces/server-shared'
import { ApEdition, ApEnvironment, AppConnectionWithoutSensitiveData, Flow, FlowRun, FlowTemplate, Folder, isNil, ProjectWithLimits, spreadIfDefined, UserInvitation } from '@activepieces/shared'
import swagger from '@fastify/swagger'
import { createAdapter } from '@socket.io/redis-adapter'
import { FastifyInstance, FastifyRequest, HTTPMethods } from 'fastify'
import fastifySocketIO from 'fastify-socket.io'
import { Socket } from 'socket.io'
import { aiProviderModule } from './ai/ai-provider.module'
import { setPlatformOAuthService } from './app-connection/app-connection-service/oauth2'
import { appConnectionModule } from './app-connection/app-connection.module'
import { appEventRoutingModule } from './app-event-routing/app-event-routing.module'
import { authenticationServiceHooks } from './authentication/authentication-service/hooks'
import { authenticationModule } from './authentication/authentication.module'
import { accessTokenManager } from './authentication/lib/access-token-manager'
import { copilotModule } from './copilot/copilot.module'
import { requestWriterModule } from './copilot/request-writer/request-writer.module'
import { rateLimitModule } from './core/security/rate-limit'
import { securityHandlerChain } from './core/security/security-handler-chain'
import { getRedisConnection } from './database/redis-connection'
import { alertsModule } from './ee/alerts/alerts-module'
import { analyticsModule } from './ee/analytics/analytics.module'
import { apiKeyModule } from './ee/api-keys/api-key-module'
import { platformOAuth2Service } from './ee/app-connections/platform-oauth2-service'
import { appCredentialModule } from './ee/app-credentials/app-credentials.module'
import { auditEventModule } from './ee/audit-logs/audit-event-module'
import { auditLogService } from './ee/audit-logs/audit-event-service'
import { cloudAuthenticationServiceHooks } from './ee/authentication/authentication-service/hooks/cloud-authentication-service-hooks'
import { enterpriseAuthenticationServiceHooks } from './ee/authentication/authentication-service/hooks/enterprise-authentication-service-hooks'
import { enterpriseLocalAuthnModule } from './ee/authentication/enterprise-local-authn/enterprise-local-authn-module'
import { federatedAuthModule } from './ee/authentication/federated-authn/federated-authn-module'
import { rbacMiddleware } from './ee/authentication/project-role/rbac-middleware'
import { authnSsoSamlModule } from './ee/authentication/saml-authn/authn-sso-saml-module'
import { appSumoModule } from './ee/billing/appsumo/appsumo.module'
import { projectBillingModule } from './ee/billing/project-billing/project-billing.module'
import { connectionKeyModule } from './ee/connection-keys/connection-key.module'
import { customDomainModule } from './ee/custom-domains/custom-domain.module'
import { enterpriseFlagsHooks } from './ee/flags/enterprise-flags.hooks'
import { platformRunHooks } from './ee/flow-run/cloud-flow-run-hooks'
import { platformFlowTemplateModule } from './ee/flow-template/platform-flow-template.module'
import { gitRepoModule } from './ee/git-sync/git-sync.module'
import { globalConnectionModule } from './ee/global-connections/global-connection-module'
import { emailService } from './ee/helper/email/email-service'
import { platformDomainHelper } from './ee/helper/platform-domain-helper'
import { issuesModule } from './ee/issues/issues-module'
import { licenseKeysModule } from './ee/license-keys/license-keys-module'
import { managedAuthnModule } from './ee/managed-authn/managed-authn-module'
import { oauthAppModule } from './ee/oauth-apps/oauth-app.module'
import { otpModule } from './ee/otp/otp-module'
import { adminPieceModule } from './ee/pieces/admin-piece-module'
import { enterprisePieceMetadataServiceHooks } from './ee/pieces/filters/enterprise-piece-metadata-service-hooks'
import { platformPieceModule } from './ee/pieces/platform-piece-module'
import { adminPlatformPieceModule } from './ee/platform/admin-platform.controller'
import { projectMemberModule } from './ee/project-members/project-member.module'
import { projectRoleModule } from './ee/project-role/project-role.module'
import { projectEnterpriseHooks } from './ee/projects/ee-project-hooks'
import { platformProjectModule } from './ee/projects/platform-project-module'
import { referralModule } from './ee/referrals/referral.module'
import { signingKeyModule } from './ee/signing-key/signing-key-module'
import { usageTrackerModule } from './ee/usage-tracker/usage-tracker-module'
import { fileModule } from './file/file.module'
import { flagModule } from './flags/flag.module'
import { flagHooks } from './flags/flags.hooks'
import { communityFlowTemplateModule } from './flow-templates/community-flow-template.module'
import { humanInputModule } from './flows/flow/human-input/human-input.module'
import { flowRunHooks } from './flows/flow-run/flow-run-hooks'
import { flowRunModule } from './flows/flow-run/flow-run-module'
import { flowModule } from './flows/flow.module'
import { folderModule } from './flows/folder/folder.module'
import { triggerEventModule } from './flows/trigger-events/trigger-event.module'
import { eventsHooks } from './helper/application-events'
import { domainHelper } from './helper/domain-helper'
import { openapiModule } from './helper/openapi/openapi.module'
import { systemJobsSchedule } from './helper/system-jobs'
import { SystemJobName } from './helper/system-jobs/common'
import { systemJobHandlers } from './helper/system-jobs/job-handlers'
import { validateEnvPropsOnStartup } from './helper/system-validator'
import { pieceModule } from './pieces/base-piece-module'
import { communityPiecesModule } from './pieces/community-piece-module'
import { pieceMetadataServiceHooks } from './pieces/piece-metadata-service/hooks'
import { pieceSyncService } from './pieces/piece-sync-service'
import { platformModule } from './platform/platform.module'
import { platformService } from './platform/platform.service'
import { projectHooks } from './project/project-hooks'
import { projectModule } from './project/project-module'
import { storeEntryModule } from './store-entry/store-entry.module'
import { tagsModule } from './tags/tags-module'
import { platformUserModule } from './user/platform/platform-user-module'
import { invitationModule } from './user-invitations/user-invitation.module'
import { webhookModule } from './webhooks/webhook-module'
import { websocketService } from './websockets/websockets.service'
import { flowConsumer } from './workers/consumer'
import { webhookResponseWatcher } from './workers/helper/webhook-response-watcher'
import { workerModule } from './workers/worker-module'

export const setupApp = async (app: FastifyInstance): Promise<FastifyInstance> => {

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
                    [ApplicationEventName.FLOW_CREATED]: FlowCreatedEvent,
                    [ApplicationEventName.FLOW_DELETED]: FlowDeletedEvent,
                    [ApplicationEventName.CONNECTION_UPSERTED]: ConnectionEvent,
                    [ApplicationEventName.CONNECTION_DELETED]: ConnectionEvent,
                    [ApplicationEventName.FOLDER_CREATED]: FolderEvent,
                    [ApplicationEventName.FOLDER_UPDATED]: FolderEvent,
                    [ApplicationEventName.FOLDER_DELETED]: FolderEvent,
                    [ApplicationEventName.FLOW_RUN_STARTED]: FlowRunEvent,
                    [ApplicationEventName.FLOW_RUN_FINISHED]: FlowRunEvent,
                    [ApplicationEventName.USER_SIGNED_UP]: SignUpEvent,
                    [ApplicationEventName.USER_SIGNED_IN]: AuthenticationEvent,
                    [ApplicationEventName.USER_PASSWORD_RESET]: AuthenticationEvent,
                    [ApplicationEventName.USER_EMAIL_VERIFIED]: AuthenticationEvent,
                    [ApplicationEventName.SIGNING_KEY_CREATED]: SigningKeyEvent,
                    [ApplicationEventName.PROJECT_ROLE_CREATED]: ProjectRoleEvent,
                    'flow-template': FlowTemplate,
                    'folder': Folder,
                    'user-invitation': UserInvitation,
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
                version: '0.0.0',
            },
            externalDocs: {
                url: 'https://www.activepieces.com/docs',
                description: 'Find more info here',
            },
        },
    })


    await app.register(rateLimitModule)

    await app.register(fastifySocketIO, {
        cors: {
            origin: '*',
        },
        ...spreadIfDefined('adapter', await getAdapter()),
        transports: ['websocket'],
    })

    app.io.use((socket: Socket, next: (err?: Error) => void) => {
        accessTokenManager
            .verifyPrincipal(socket.handshake.auth.token)
            .then(() => {
                next()
            })
            .catch(() => {
                next(new Error('Authentication error'))
            })
    })

    app.io.on('connection', (socket: Socket) => {
        rejectedPromiseHandler(websocketService.init(socket))
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
    await systemJobsSchedule.init()
    await app.register(fileModule)
    await app.register(flagModule)
    await app.register(storeEntryModule)
    await app.register(folderModule)
    await app.register(flowModule)
    await app.register(pieceModule)
    await app.register(flowRunModule)
    await app.register(webhookModule)
    await app.register(appConnectionModule)
    await app.register(openapiModule)
    await app.register(triggerEventModule)
    await app.register(appEventRoutingModule)
    await app.register(authenticationModule)
    await app.register(copilotModule),
    await app.register(requestWriterModule),
    await app.register(platformModule)
    await app.register(humanInputModule)
    await app.register(tagsModule)
    await pieceSyncService.setup()
    await app.register(platformUserModule)
    await app.register(issuesModule)
    await app.register(authnSsoSamlModule)
    await app.register(alertsModule)
    await app.register(invitationModule)
    await app.register(workerModule)
    await app.register(aiProviderModule)
    await app.register(licenseKeysModule)

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

    await validateEnvPropsOnStartup()

    const edition = system.getEdition()
    logger.info({
        edition,
    }, 'Activepieces Edition')
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
            await app.register(platformFlowTemplateModule)
            await app.register(gitRepoModule)
            await app.register(auditEventModule)
            await app.register(usageTrackerModule)
            await app.register(adminPlatformPieceModule)
            await app.register(analyticsModule)
            await app.register(projectBillingModule)
            await app.register(projectRoleModule)
            await app.register(globalConnectionModule)
            setPlatformOAuthService({
                service: platformOAuth2Service,
            })
            projectHooks.setHooks(projectEnterpriseHooks)
            eventsHooks.set(auditLogService)
            flowRunHooks.setHooks(platformRunHooks)
            pieceMetadataServiceHooks.set(enterprisePieceMetadataServiceHooks)
            flagHooks.set(enterpriseFlagsHooks)
            authenticationServiceHooks.set(cloudAuthenticationServiceHooks)
            domainHelper.set(platformDomainHelper)
            systemJobHandlers.registerJobHandler(SystemJobName.ISSUES_REMINDER, emailService.sendReminderJobHandler)
            initializeSentry()
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
            await app.register(platformFlowTemplateModule)
            await app.register(gitRepoModule)
            await app.register(auditEventModule)
            await app.register(usageTrackerModule)
            await app.register(analyticsModule)
            await app.register(projectRoleModule)
            await app.register(globalConnectionModule)
            systemJobHandlers.registerJobHandler(SystemJobName.ISSUES_REMINDER, emailService.sendReminderJobHandler)
            setPlatformOAuthService({
                service: platformOAuth2Service,
            })
            projectHooks.setHooks(projectEnterpriseHooks)
            eventsHooks.set(auditLogService)
            flowRunHooks.setHooks(platformRunHooks)
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
        logger.info('Shutting down')
        await flowConsumer.close()
        await systemJobsSchedule.close()
        await webhookResponseWatcher.shutdown()
    })

    return app
}



async function getAdapter() {
    const queue = system.getOrThrow<QueueMode>(AppSystemProp.QUEUE_MODE)
    switch (queue) {
        case QueueMode.MEMORY: {
            return undefined
        }
        case QueueMode.REDIS: {
            const sub = getRedisConnection().duplicate()
            const pub = getRedisConnection().duplicate()
            return createAdapter(pub, sub)
        }
    }
}


export async function appPostBoot(): Promise<void> {

    logger.info(`
             _____   _______   _____  __      __  ______   _____    _____   ______    _____   ______    _____
    /\\      / ____| |__   __| |_   _| \\ \\    / / |  ____| |  __ \\  |_   _| |  ____|  / ____| |  ____|  / ____|
   /  \\    | |         | |      | |    \\ \\  / /  | |__    | |__) |   | |   | |__    | |      | |__    | (___
  / /\\ \\   | |         | |      | |     \\ \\/ /   |  __|   |  ___/    | |   |  __|   | |      |  __|    \\___ \\
 / ____ \\  | |____     | |     _| |_     \\  /    | |____  | |       _| |_  | |____  | |____  | |____   ____) |
/_/    \\_\\  \\_____|    |_|    |_____|     \\/     |______| |_|      |_____| |______|  \\_____| |______| |_____/

The application started on ${system.get(SharedSystemProp.FRONTEND_URL)}, as specified by the AP_FRONTEND_URL variables.`)

    const environment = system.get(SharedSystemProp.ENVIRONMENT)
    const piecesSource = system.getOrThrow(SharedSystemProp.PIECES_SOURCE)
    const pieces = process.env.AP_DEV_PIECES

    logger.warn(
        `[WARNING]: Pieces will be loaded from source type ${piecesSource}`,
    )
    if (environment === ApEnvironment.DEVELOPMENT) {
        logger.warn(
            `[WARNING]: The application is running in ${environment} mode.`,
        )
        logger.warn(
            `[WARNING]: This is only shows pieces specified in AP_DEV_PIECES ${pieces} environment variable.`,
        )
    }
    const oldestPlatform = await platformService.getOldestPlatform()
    const key = system.get<string>(AppSystemProp.LICENSE_KEY)
    if (!isNil(oldestPlatform) && !isNil(key)) {
        await platformService.update({
            id: oldestPlatform.id,
            licenseKey: key,
        })
    }
}
