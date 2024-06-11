import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { licenseKeysService } from './license-keys-service'
import { CreateTrialLicenseKeyRequest } from '@activepieces/shared'


export const licenseKeysController: FastifyPluginAsyncTypebox = async (app) => {

    app.post('/', CreateTrialLicenseKeyRequest, async (req) => {
        const res = await licenseKeysService.createKey(req.body)
        return res
    })
    
    app.get('/status', async () => {
        const key = await licenseKeysService.getKeyStatus()
        return key
    })

}


