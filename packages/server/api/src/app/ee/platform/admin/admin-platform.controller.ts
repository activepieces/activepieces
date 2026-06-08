import { ErrorHandlingOptionsParam, PieceMetadata, PieceMetadataModel, WebhookRenewConfiguration } from '@activepieces/pieces-framework'
import { AdminRetryRunsRequestBody, ApplyLicenseKeyByEmailRequestBody, ChatConversation, ExactVersionType, IncreaseAICreditsForPlatformRequestBody, isNil, PackageType, PieceCategory, PieceType, TriggerStrategy, TriggerTestStrategy, WebhookHandshakeConfiguration } from '@activepieces/shared'
import { FastifyReply, FastifyRequest } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { repoFactory } from '../../../core/db/repo-factory'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { flowVersionOutputRepairService } from '../../../flows/flow-version/flow-version-output-repair.service'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { pieceMetadataService } from '../../../pieces/metadata/piece-metadata-service'
import { ChatConversationEntity } from '../../chat/chat-conversation-entity'
import { chatAnalyticsBulkSync } from '../../chat/chat-sync-job'
import { CANARY_WORKER_GROUP_ID, workerGroupService } from '../platform-plan/worker-group.service'
import { adminPlatformService } from './admin-platform.service'

const API_KEY_HEADER = 'api-key'
const API_KEY = system.get(AppSystemProp.API_KEY)

async function checkCertainKeyPreHandler(
    req: FastifyRequest,
    res: FastifyReply,
): Promise<void> {

    const key = req.headers[API_KEY_HEADER] as string | undefined
    if (key !== API_KEY || isNil(API_KEY)) {
        await res.status(StatusCodes.FORBIDDEN).send({ message: 'Forbidden' })
        throw new Error('Forbidden')
    }
}

export const adminPlatformModule: FastifyPluginAsyncZod = async (app) => {
    app.addHook('preHandler', checkCertainKeyPreHandler)
    await app.register(adminPlatformController, { prefix: '/v1/admin/' })
}

const adminPlatformController: FastifyPluginAsyncZod = async (
    app,
) => {

    app.post('/pieces', CreatePieceRequest, async (req): Promise<PieceMetadataModel> => {
        return pieceMetadataService(req.log).create({
            pieceMetadata: req.body as PieceMetadata,
            packageType: PackageType.REGISTRY,
            pieceType: PieceType.OFFICIAL,
        })
    },
    )

    app.post('/platforms/runs/retry', AdminRetryRunsRequest, async (req, res) => {
        await adminPlatformService(req.log).retryRuns(req.body)
        return res.status(StatusCodes.OK).send()
    })

    app.post('/platforms/apply-license-key', ApplyLicenseKeyByEmailRequest, async (req, res) => {
        await adminPlatformService(req.log).applyLicenseKeyByEmail(req.body)
        return res.status(StatusCodes.OK).send()
    })

    app.post('/platforms/increase-ai-credits', IncreaseAICreditsForPlatformRequest, async (req, res) => {
        await adminPlatformService(req.log).increaseAiCredits(req.body)
        return res.status(StatusCodes.OK).send()
    })

    app.post('/platforms/worker-group', UpdateWorkerGroupRequest, async (req, res) => {
        const { platformId, workerGroupId } = req.body
        await workerGroupService(req.log).moveJobsToTargetQueue({ platformId, workerGroupId })
        await workerGroupService(req.log).updateWorkerGroup({ platformId, workerGroupId })
        return res.status(StatusCodes.OK).send()
    })

    app.post('/platforms/canary', UpdateCanaryRequest, async (req, res) => {
        const { platformId, canary } = req.body
        await workerGroupService(req.log).moveJobsToTargetQueue({ platformId, workerGroupId: canary ? CANARY_WORKER_GROUP_ID : null })
        await workerGroupService(req.log).updateCanary({ platformId, canary })
        return res.status(StatusCodes.OK).send()
    })

    app.post('/flow-versions/repair-output-nesting', RepairOutputNestingRequest, async (req) => {
        return flowVersionOutputRepairService(req.log).repairOutputNesting({
            flowVersionId: req.body.flowVersionId,
            forceSingleOutput: req.body.forceSingleOutput,
        })
    })

    app.post('/chat/sync-all', SyncAllConversationsRequest, async (req, res) => {
        const PAGE_SIZE = 100
        const conversationRepo = repoFactory(ChatConversationEntity)
        const totalCount = await conversationRepo().count()
        const totalPages = Math.ceil(totalCount / PAGE_SIZE)

        req.log.info({ totalCount, totalPages }, 'Starting bulk chat analytics sync')

        let synced = 0
        let failed = 0

        for (let page = 0; page < totalPages; page++) {
            const conversations: ChatConversation[] = await conversationRepo().find({
                skip: page * PAGE_SIZE,
                take: PAGE_SIZE,
                order: { created: 'ASC' },
            })
            const result = await chatAnalyticsBulkSync(req.log).syncAll({ conversations })
            synced += result.synced
            failed += result.failed
            req.log.info({ page: page + 1, totalPages, synced, failed }, 'Synced chat analytics page')
        }

        return res.status(StatusCodes.OK).send({ synced, failed, total: totalCount })
    })
}


const UpdateWorkerGroupRequest = {
    schema: {
        body: z.object({
            platformId: z.string(),
            workerGroupId: z.string().nullable(),
        }),
    },
    config: {
        security: securityAccess.public(),
    },
}

const UpdateCanaryRequest = {
    schema: {
        body: z.object({
            platformId: z.string(),
            canary: z.boolean(),
        }),
    },
    config: {
        security: securityAccess.public(),
    },
}

const AdminRetryRunsRequest = {
    schema: {
        body: AdminRetryRunsRequestBody,
    },
    config: {
        security: securityAccess.public(),
    },
}

const ApplyLicenseKeyByEmailRequest = {
    schema: {
        body: ApplyLicenseKeyByEmailRequestBody,
    },
    config: {
        security: securityAccess.public(),
    },
}

const IncreaseAICreditsForPlatformRequest = {
    schema: {
        body: IncreaseAICreditsForPlatformRequestBody,
    },
    config: {
        security: securityAccess.public(),
    },
}


const Action = z.object({
    name: z.string(),
    displayName: z.string(),
    description: z.string(),
    requireAuth: z.boolean(),
    props: z.unknown(),
    errorHandlingOptions: ErrorHandlingOptionsParam.optional(),
})

const Trigger = Action.extend({
    renewConfiguration: WebhookRenewConfiguration.optional(),
    handshakeConfiguration: WebhookHandshakeConfiguration,
    sampleData: z.unknown().optional(),
    type: z.nativeEnum(TriggerStrategy),
    testStrategy: z.nativeEnum(TriggerTestStrategy),
})

const CreatePieceRequest = {
    schema: {
        body: z.object({
            name: z.string(),
            displayName: z.string(),
            logoUrl: z.string(),
            description: z.string().optional(),
            version: ExactVersionType,
            auth: z.unknown().optional(),
            authors: z.array(z.string()),
            categories: z.array(z.nativeEnum(PieceCategory)).optional(),
            minimumSupportedRelease: ExactVersionType,
            maximumSupportedRelease: ExactVersionType,
            actions: z.record(z.string(), Action),
            triggers: z.record(z.string(), Trigger),
            i18n: z.record(z.string(), z.record(z.string(), z.string())).optional(),
        }),
    },
    config: {
        security: securityAccess.public(),
    },
}

const SyncAllConversationsRequest = {
    config: {
        security: securityAccess.public(),
    },
}

const RepairOutputNestingRequest = {
    schema: {
        body: z.object({
            flowVersionId: z.string(),
            forceSingleOutput: z.boolean().optional(),
        }),
    },
    config: {
        security: securityAccess.public(),
    },
}
