import { authenticationModule } from './app/authentication/authentication.module'
import { system, validateEnvPropsOnStartup } from './app/helper/system/system'
import { SystemProp } from './app/helper/system/system-prop'
import { databaseConnection } from './app/database/database-connection'
import { logger } from './app/helper/logger'
import { getEdition } from './app/helper/secret-helper'
import { ApEdition, ApEnvironment } from '@activepieces/shared'
import { seedDevData } from './app/database/seeds/dev-seeds'
import { flowQueueConsumer } from './app/workers/flow-worker/flow-queue-consumer'
import { setupApp } from './app/app'
import { FastifyInstance } from 'fastify'
import { firebaseAuthenticationModule } from './app/ee/firebase-auth/firebase-authentication.module'
import { billingModule } from './app/ee/billing/billing.module'
import { appCredentialModule } from './app/ee/app-credentials/app-credentials.module'
import { connectionKeyModule } from './app/ee/connection-keys/connection-key.module'
import { flowTemplateModule } from './app/ee/flow-template/flow-template.module'
import { initilizeSentry } from './app/ee/helper/exception-handler'
import { appSumoModule } from './app/ee/appsumo/appsumo.module'
import { referralModule } from './app/ee/referrals/referral.module'
import { cloudDatasourceHooks } from './app/ee/chatbot/cloud/cloud-datasources.hook'
import { projectModule } from './app/project/project-module'
import { cloudChatbotHooks } from './app/ee/chatbot/cloud/cloud-chatbot.hook'
import { qdrantEmbeddings } from './app/ee/chatbot/cloud/qdrant-embeddings'
import { chatbotHooks } from './app/chatbot/chatbot.hooks'
import { datasourceHooks } from './app/chatbot/datasources/datasource.hooks'
import { flowWorkerHooks } from './app/workers/flow-worker/flow-worker-hooks'
import { embeddings } from './app/chatbot/embedings'
import { projectMemberModule } from './app/ee/project-members/project-member.module'
import { enterpriseProjectModule } from './app/ee/projects/enterprise-project-controller'
import { verifyLicenseKey } from './app/ee/helper/licenese-validator'
import { adminPieceModule } from './app/ee/pieces/admin-piece-module'
import { appConnectionsHooks } from './app/app-connection/app-connection-service/app-connection-hooks'
import { cloudAppConnectionsHooks } from './app/ee/app-connections/cloud-app-connection-service'
import { flowRunHooks } from './app/flows/flow-run/flow-run-hooks'
import { cloudRunHooks } from './app/ee/flow-run/cloud-flow-run-hooks'
import { cloudWorkerHooks } from './app/ee/flow-worker/cloud-flow-worker-hooks'
import { pieceServiceHooks } from './app/pieces/piece-service/piece-service-hooks'
import { cloudPieceServiceHooks } from './app/ee/pieces/piece-service/cloud-piece-service-hooks'

const start = async (app: FastifyInstance): Promise<void> => {
    try {
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
                pieceServiceHooks.set(cloudPieceServiceHooks)
                break
            case ApEdition.COMMUNITY:
                await app.register(authenticationModule)
                await app.register(projectModule)
                break
        }
        await app.listen({
            host: '0.0.0.0',
            port: 3000,
        })

        logger.info(`
             _____   _______   _____  __      __  ______   _____    _____   ______    _____   ______    _____
    /\\      / ____| |__   __| |_   _| \\ \\    / / |  ____| |  __ \\  |_   _| |  ____|  / ____| |  ____|  / ____|
   /  \\    | |         | |      | |    \\ \\  / /  | |__    | |__) |   | |   | |__    | |      | |__    | (___
  / /\\ \\   | |         | |      | |     \\ \\/ /   |  __|   |  ___/    | |   |  __|   | |      |  __|    \\___ \\
 / ____ \\  | |____     | |     _| |_     \\  /    | |____  | |       _| |_  | |____  | |____  | |____   ____) |
/_/    \\_\\  \\_____|    |_|    |_____|     \\/     |______| |_|      |_____| |______|  \\_____| |______| |_____/

The application started on ${system.get(SystemProp.FRONTEND_URL)}, as specified by the AP_FRONTEND_URL variables.
    `)

        const environemnt = system.get(SystemProp.ENVIRONMENT)
        const pieces = process.env.AP_DEV_PIECES
        if (environemnt === ApEnvironment.DEVELOPMENT) {
            logger.warn(`[WARNING]: The application is running in ${environemnt} mode.`)
            logger.warn(`[WARNING]: This is only shows pieces specified in AP_DEV_PIECES ${pieces} environment variable.`)
        }
        if (edition !== ApEdition.COMMUNITY) {
            const key = system.getOrThrow(SystemProp.LICENSE_KEY)
            logger.info('[INFO]: Verifying license key ' + key)
            const verified = await verifyLicenseKey({ license: key })
            if (!verified) {
                logger.error('[ERROR]: License key is not valid. Please contact sales@activepieces.com')
                process.exit(1)
            }
        }
    }
    catch (err) {
        logger.error(err)
        process.exit(1)
    }
}

// This might be needed as it can be called twice
let shuttingDown = false

function setupTimeZone(): void {
    // It's important to set the time zone to UTC when working with dates in PostgreSQL.
    // If the time zone is not set to UTC, there can be problems when storing dates in UTC but not considering the UTC offset when converting them back to local time. This can lead to incorrect fields being displayed for the created
    // https://stackoverflow.com/questions/68240368/typeorm-find-methods-returns-wrong-timestamp-time
    process.env.TZ = 'UTC'
}

const stop = async (app: FastifyInstance): Promise<void> => {
    if (shuttingDown) return
    shuttingDown = true

    try {
        await app.close()
        await flowQueueConsumer.close()
        logger.info('Server stopped')
        process.exit(0)
    }
    catch (err) {
        logger.error('Error stopping server')
        logger.error(err)
        process.exit(1)
    }
}

const main = async (): Promise<void> => {

    setupTimeZone()
    await validateEnvPropsOnStartup()
    await databaseConnection.initialize()
    await databaseConnection.runMigrations()
    await seedDevData()
    const app = await setupApp()

    process.on('SIGINT', () => {
        stop(app)
            .catch((e) => logger.error(e, '[Main#stop]'))
    })

    process.on('SIGTERM', () => {
        stop(app)
            .catch((e) => logger.error(e, '[Main#stop]'))
    })

    await start(app)
}

main()
    .catch((e) => logger.error(e, '[Main#main]'))
