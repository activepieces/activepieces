import { AppSystemProp } from '@activepieces/server-shared'
import { ActivepiecesError, CreateTrialLicenseKeyRequestBody, ErrorCode, isNil, PrincipalType, VerifyLicenseKeyRequestBody } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import { StatusCodes } from 'http-status-codes'
import { system } from '../../helper/system/system'
import { platformService } from '../../platform/platform.service'
import { licenseKeysService } from './license-keys-service'

const key = system.get<string>(AppSystemProp.LICENSE_KEY)

export const licenseKeysController: FastifyPluginAsyncTypebox = async (app) => {

    app.post('/', CreateTrialLicenseKeyRequest, async (req) => {
        return licenseKeysService(app.log).requestTrial(req.body)
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

const CreateTrialLicenseKeyRequest = {
    config: {
        allowedPrincipals: [
            PrincipalType.UNKNOWN,
            PrincipalType.USER,
        ],
    },
    schema: {
        body: CreateTrialLicenseKeyRequestBody,
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