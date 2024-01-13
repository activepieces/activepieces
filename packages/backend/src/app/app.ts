import fastify, { FastifyInstance, FastifyRequest, HTTPMethods } from 'fastify'
import cors from '@fastify/cors'
import formBody from '@fastify/formbody'
import qs from 'qs'
import fastifyMultipart from '@fastify/multipart'
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
import { logger } from './helper/logger'
import { appEventRoutingModule } from './app-event-routing/app-event-routing.module'
import { triggerEventModule } from './flows/trigger-events/trigger-event.module'
import { fastifyRawBody } from 'fastify-raw-body'
import { stepFileModule } from './flows/step-file/step-file.module'
import { rbacAuthMiddleware } from './ee/authentication/rbac-auth-middleware'
import { userModule } from './user/user.module'
import { ApEdition, AppConnectionWithoutSensitiveData, Flow } from '@activepieces/shared'
import { appConnectionsHooks } from './app-connection/app-connection-service/app-connection-hooks'
import { authenticationModule } from './authentication/authentication.module'
import { cloudAppConnectionsHooks } from './ee/app-connections/cloud-app-connection-service'
import { appCredentialModule } from './ee/app-credentials/app-credentials.module'
import { appSumoModule } from './ee/appsumo/appsumo.module'
import { connectionKeyModule } from './ee/connection-keys/connection-key.module'
import { platformRunHooks } from './ee/flow-run/cloud-flow-run-hooks'
import { platformFlowTemplateModule } from './ee/flow-template/platform-flow-template.module'
import { platformWorkerHooks } from './ee/flow-worker/cloud-flow-worker-hooks'
import { initilizeSentry } from './ee/helper/exception-handler'
import { adminPieceModule } from './ee/pieces/admin-piece-module'
import { platformPieceServiceHooks } from './ee/pieces/piece-service/platform-piece-service-hooks'
import { platformModule } from './ee/platform/platform.module'
import { projectMemberModule } from './ee/project-members/project-member.module'
import { platformProjectModule } from './ee/projects/platform-project-controller'
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
import { validateEnvPropsOnStartup } from './helper/system/system'
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
import { billingModule } from './ee/billing/billing/billing.module'
import { federatedAuthModule } from './ee/authentication/federated-authn/federated-authn-module'
import fastifyFavicon from 'fastify-favicon'
import { ProjectMember, ProjectWithUsageAndPlanResponse } from '@activepieces/ee-shared'
import { apiKeyModule } from './ee/api-keys/api-key-module'
import { domainHelper } from './helper/domain-helper'
import { platformDomainHelper } from './ee/helper/platform-domain-helper'
import { enterpriseUserModule } from './ee/user/enterprise-user-module'
import { flowResponseWatcher } from './flows/flow-run/flow-response-watcher'
import { gitRepoModule } from './ee/git-repos/git-repo.module'
import { securityHandlerChain } from './core/security/security-handler-chain'
import { communityFlowTemplateModule } from './flow-templates/community-flow-template.module'
import { copilotModule } from './copilot/copilot.module'

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
                schemas: {
                    'project-member': ProjectMember,
                    'project': ProjectWithUsageAndPlanResponse,
                    'flow': Flow,
                    'app-connection': AppConnectionWithoutSensitiveData,
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

    app.addHook('preHandler', securityHandlerChain)
    app.addHook('preHandler', rbacAuthMiddleware)
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
    await validateEnvPropsOnStartup()

    const edition = getEdition()
    logger.info(`Activepieces ${edition} Edition`)
    switch (edition) {
        case ApEdition.CLOUD:
            await app.register(billingModule)
            await app.register(appCredentialModule)
            await app.register(connectionKeyModule)
            await app.register(platformProjectModule)
            await app.register(projectMemberModule)
            await app.register(appSumoModule)
            await app.register(referralModule)
            await app.register(adminPieceModule)
            await app.register(platformModule)
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
            setPlatformOAuthService({
                service: platformOAuth2Service,
            })
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
            await app.register(platformModule)
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
            setPlatformOAuthService({
                service: platformOAuth2Service,
            })
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
        await flowResponseWatcher.shutdown()
    })

    return app
}
