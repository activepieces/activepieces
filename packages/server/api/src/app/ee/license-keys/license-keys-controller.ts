import { securityAccess } from '@activepieces/server-shared'
import { ActivepiecesError, ErrorCode, isNil, VerifyLicenseKeyRequestBody } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import { licenseKeysService } from './license-keys-service'

export const licenseKeysController: FastifyPluginAsyncTypebox = async (app) => {


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
        await licenseKeysService(app.log).applyLimits(platformId, key)
        return key
    })

}
const VerifyLicenseKeyRequest = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        body: VerifyLicenseKeyRequestBody,
    },
}

const GetLicenseKeyRequest = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        params: Type.Object({
            licenseKey: Type.String(),
        }),
    },
}