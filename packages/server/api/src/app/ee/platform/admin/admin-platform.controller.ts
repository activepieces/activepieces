import { ErrorHandlingOptionsParam, PieceMetadata, PieceMetadataModel, WebhookRenewConfiguration } from '@activepieces/pieces-framework'
import { AppSystemProp, securityAccess } from '@activepieces/server-shared'
import { AdminRetryRunsRequestBody, ApplyLicenseKeyByEmailRequestBody, ExactVersionType, IncreaseAICreditsForPlatformRequestBody, isNil, PackageType, PieceCategory, PieceType, TriggerStrategy, TriggerTestStrategy, WebhookHandshakeConfiguration } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import { FastifyReply, FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { system } from '../../../helper/system/system'
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

export const adminPlatformModule: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preHandler', checkCertainKeyPreHandler)
    await app.register(adminPlatformController, { prefix: '/v1/admin/' })
}

const adminPlatformController: FastifyPluginAsyncTypebox = async (
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
}


const ConfigureDedicatedWorkersRequest = {
    schema: {
        body: Type.Object({
            operation: Type.Union([Type.Literal('enable'), Type.Literal('disable')]),
            platformId: Type.String(),
            trustedEnvironment: Type.Boolean(),
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


const Action = Type.Object({
    name: Type.String(),
    displayName: Type.String(),
    description: Type.String(),
    requireAuth: Type.Boolean(),
    props: Type.Unknown(),
    errorHandlingOptions: Type.Optional(ErrorHandlingOptionsParam),
})

const Trigger = Type.Composite([
    Action,
    Type.Object({
        renewConfiguration: Type.Optional(WebhookRenewConfiguration),
        handshakeConfiguration: WebhookHandshakeConfiguration,
        sampleData: Type.Optional(Type.Unknown()),
        type: Type.Enum(TriggerStrategy),
        testStrategy: Type.Enum(TriggerTestStrategy),
    }),
])

const CreatePieceRequest = {
    schema: {
        body: Type.Object({
            name: Type.String(),
            displayName: Type.String(),
            logoUrl: Type.String(),
            description: Type.Optional(Type.String()),
            version: ExactVersionType,
            auth: Type.Optional(Type.Any()),
            authors: Type.Array(Type.String()),
            categories: Type.Optional(Type.Array(Type.Enum(PieceCategory))),
            minimumSupportedRelease: ExactVersionType,
            maximumSupportedRelease: ExactVersionType,
            actions: Type.Record(Type.String(), Action),
            triggers: Type.Record(Type.String(), Trigger),
            i18n: Type.Optional(Type.Record(Type.String(), Type.Record(Type.String(), Type.String()))),
        }),
    },
    config: {
        security: securityAccess.public(),
    },
}