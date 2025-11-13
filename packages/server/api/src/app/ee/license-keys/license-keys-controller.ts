import { ActivepiecesError, ErrorCode, isNil, PrincipalType, VerifyLicenseKeyRequestBody } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import { licenseKeysService } from './license-keys-service'
import { platformAdminOnly, publicAccess } from '@activepieces/server-shared'

export const licenseKeysController: FastifyPluginAsyncTypebox = async (app) => {


    app.get('/:licenseKey', GetLicenseKeyRequest, async (req) => {
        const licenseKey = await licenseKeysService(app.log).getKey(req.params.licenseKey)
        return licenseKey
    })

    app.post('/verify', VerifyLicenseKeyRequest, async (req) => {
        const { licenseKey } = req.body
        const key = await licenseKeysService(app.log).verifyKeyOrReturnNull({
            platformId: req.principal.platform.id,
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
        await licenseKeysService(app.log).applyLimits(req.principal.platform.id, key)
        return key
    })

}
const VerifyLicenseKeyRequest = {
    config: {
        security: platformAdminOnly([PrincipalType.USER])
    },
    schema: {
        body: VerifyLicenseKeyRequestBody,
    },
}

const GetLicenseKeyRequest = {
    config: {
        security: publicAccess(),
    },
    schema: {
        params: Type.Object({
            licenseKey: Type.String(),
        }),
    },
}