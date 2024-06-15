import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { licenseKeysService } from './license-keys-service'
import { system, SystemProp } from '@activepieces/server-shared'
import { CreateTrialLicenseKeyRequestBody, PrincipalType } from '@activepieces/shared'

const key = system.get<string>(SystemProp.LICENSE_KEY)

export const licenseKeysController: FastifyPluginAsyncTypebox = async (app) => {

    app.post('/', CreateTrialLicenseKeyRequest, async (req) => {
        const res = await licenseKeysService.requestTrial(req.body)
        return res
    })

    app.get('/status', async (_req, res) => {
        if (!key) {
            return res.status(StatusCodes.NOT_FOUND).send({
                message: 'No license key found',
            })
        }
        return licenseKeysService.getKey(key)
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
