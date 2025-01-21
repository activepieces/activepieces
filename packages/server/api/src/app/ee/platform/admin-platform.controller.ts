import { AdminAddPlatformRequestBody, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { licenseKeysTrialService } from '../license-keys/license-keys-trial.service'
import { adminPlatformService } from './admin-platform.service'

export const adminPlatformPieceModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(adminPlatformController, { prefix: '/v1/admin/platforms' })
}

const adminPlatformController: FastifyPluginAsyncTypebox = async (
    app,
) => {
    app.post('/', AdminAddPlatformRequest, async (req, res) => {
        const newPlatform = await adminPlatformService(req.log).add(req.body)

        return res.status(StatusCodes.CREATED).send(newPlatform)
    })

    app.post('/generate-trial-key', GenerateTrialRequest, async (req, res) => {
        const { email, selfHosting, ultimatePlan } = req.body as { email: string, selfHosting: boolean, ultimatePlan: boolean }
        const { message } = await licenseKeysTrialService(req.log).requestTrial({ email, selfHosting, ultimatePlan })
        return res.status(StatusCodes.OK).send({ message })
    })

    app.post('/extend-trial', ExtendTrialRequest, async (req, res) => {
        const { email, days } = req.body as { email: string, days: number }
        await licenseKeysTrialService(req.log).extendTrial({ email, days })
        return res.status(StatusCodes.OK).send({
            message: 'Trial extended',
        })
    })
}

const AdminAddPlatformRequest = {
    schema: {
        body: AdminAddPlatformRequestBody,
    },
    config: {
        allowedPrincipals: [PrincipalType.SUPER_USER],
    },
}

const GenerateTrialRequest = {
    schema: {
        body: {
            type: 'object',
            properties: {
                email: { type: 'string' },
                selfHosting: { type: 'boolean' },
                plan: { type: 'string' },
            },
            required: ['email', 'selfHosting', 'plan'],
        },
    },
    config: {
        allowedPrincipals: [PrincipalType.SUPER_USER],
    },
}

const ExtendTrialRequest = {
    schema: {
        body: {
            type: 'object',
            properties: {
                email: { type: 'string' },
                days: { type: 'number' },
            },
        },
    },
    config: {
        allowedPrincipals: [PrincipalType.SUPER_USER],
    },
}