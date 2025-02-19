import { AppSystemProp } from '@activepieces/server-shared'
import { ActivepiecesError, ErrorCode, isNil, PrincipalType, VerifyLicenseKeyRequestBody } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import { StatusCodes } from 'http-status-codes'
import { system } from '../../helper/system/system'
import { platformService } from '../../platform/platform.service'
import { licenseKeysService } from './license-keys-service'
import { licenseKeysTrialService } from './license-keys-trial.service'

const key = system.get<string>(AppSystemProp.LICENSE_KEY)

export const licenseKeysController: FastifyPluginAsyncTypebox = async (app) => {

    app.post('/', GenerateTrialRequest, async (req, res) => {
        const { email, companyName, selfHosting, ultimatePlan, productionKey } = req.body as { email: string, companyName: string, selfHosting: boolean, ultimatePlan: boolean, productionKey: boolean }
        const { message } = await licenseKeysTrialService(req.log).requestTrial({ email, companyName, selfHosting, ultimatePlan, productionKey })
        return res.status(StatusCodes.OK).send({ message })
    })

    app.post('/extend-trial', ExtendTrialRequest, async (req, res) => {
        const { email, days } = req.body as { email: string, days: number }
        await licenseKeysTrialService(req.log).extendTrial({ email, days })
        return res.status(StatusCodes.OK).send({
            message: 'Trial extended',
        })
    })

    app.get('/status', async (_req, res) => {
        const licenseKey = await licenseKeysService(app.log).getKey(key)
        if (isNil(licenseKey)) {
            return res.status(StatusCodes.NOT_FOUND).send({
                message: 'No license key found',
            })
        }
        return licenseKey
    })

    app.get('/:licenseKey', GetLicenseKeyRequest, async (req) => {
        const licenseKey = await licenseKeysService(app.log).getKey(req.params.licenseKey)
        return licenseKey
    })

    app.post('/verify', VerifyLicenseKeyRequest, async (req) => {
        const { platformId, licenseKey } = req.body
        const key = await licenseKeysService(app.log).verifyKeyOrReturnNull({
            platformId,
            license: licenseKey,
        })
        if (isNil(key)) {
            throw new ActivepiecesError({
                code: ErrorCode.INVALID_LICENSE_KEY,
                params: {
                    key: licenseKey,
                },
            })
        }
        await platformService.update({
            id: platformId,
            licenseKey: key.key,
        })
        await licenseKeysService(app.log).applyLimits(platformId, key)
        return key
    })

}

const GenerateTrialRequest = {
    schema: {
        body: {
            type: 'object',
            properties: {
                email: { type: 'string' },
                companyName: { type: 'string' },
                selfHosting: { type: 'boolean' },
                ultimatePlan: { type: 'boolean' },
                productionKey: { type: 'boolean' },
            },
            required: ['email', 'companyName', 'selfHosting', 'ultimatePlan', 'productionKey'],
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

const VerifyLicenseKeyRequest = {
    config: {
        allowedPrincipals: [
            PrincipalType.UNKNOWN,
            PrincipalType.USER,
        ],
    },
    schema: {
        body: VerifyLicenseKeyRequestBody,
    },
}

const GetLicenseKeyRequest = {
    config: {
        allowedPrincipals: [
            PrincipalType.UNKNOWN,
            PrincipalType.USER,
        ],
    },
    schema: {
        params: Type.Object({
            licenseKey: Type.String(),
        }),
    },
}