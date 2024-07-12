import { AppSystemProp, system } from '@activepieces/server-shared'
import { CreateTrialLicenseKeyRequestBody, isNil, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { licenseKeysService } from './license-keys-service'

const key = system.get<string>(AppSystemProp.LICENSE_KEY)

export const licenseKeysController: FastifyPluginAsyncTypebox = async (app) => {

    app.post('/', CreateTrialLicenseKeyRequest, async (req) => {
        return licenseKeysService.requestTrial(req.body)
    })

    app.get('/status', async (_req, res) => {
        const licenseKey = await licenseKeysService.getKey(key)
        if (isNil(licenseKey)) {
            return res.status(StatusCodes.NOT_FOUND).send({
                message: 'No license key found',
            })
        }
        return licenseKey
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
