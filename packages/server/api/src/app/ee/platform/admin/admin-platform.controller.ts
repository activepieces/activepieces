import { ErrorHandlingOptionsParam, PieceMetadata, PieceMetadataModel, WebhookRenewConfiguration } from '@activepieces/pieces-framework'
import { AdminRetryRunsRequestBody, ApplyLicenseKeyByEmailRequestBody, ExactVersionType, IncreaseAICreditsForPlatformRequestBody, isNil, PackageType, PieceCategory, PieceType, TriggerStrategy, TriggerTestStrategy, WebhookHandshakeConfiguration } from '@activepieces/shared'
import { FastifyReply, FastifyRequest } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { platformCanaryService } from '../../../core/canary/platform-canary.service'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { pieceMetadataService } from '../../../pieces/metadata/piece-metadata-service'
import { dedicatedWorkers } from '../platform-plan/platform-dedicated-workers'
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

    app.post('/platforms/dedicated-workers', ConfigureDedicatedWorkersRequest, async (req, res) => {
        await dedicatedWorkers(req.log).updateWorkerConfig({
            operation: req.body.operation,
            platformId: req.body.platformId,
            trustedEnvironment: req.body.trustedEnvironment,
        })
        return res.status(StatusCodes.OK).send()
    })

    app.post('/platforms/canary', UpdateCanaryRequest, async (req, res) => {
        await platformCanaryService(req.log).updateCanary(req.body.platformId, req.body.canary)
        return res.status(StatusCodes.OK).send()
    })

    app.delete('/platforms/canary', DisableAllCanaryRequest, async (req, res) => {
        await platformCanaryService(req.log).disableAll()
        return res.status(StatusCodes.OK).send()
    })
}


const ConfigureDedicatedWorkersRequest = {
    schema: {
        body: z.object({
            operation: z.union([z.literal('enable'), z.literal('disable')]),
            platformId: z.string(),
            trustedEnvironment: z.boolean(),
        }),
    },
    config: {
        security: securityAccess.public(),
    },
}

const DisableAllCanaryRequest = {
    schema: {},
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