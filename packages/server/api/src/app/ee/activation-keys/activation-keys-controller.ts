import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { activationKeysService } from './activation-keys-service'
import { CreateKeyRequest, GetKeyRequest } from '@activepieces/shared'


export const activationKeysController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/:key', GetKeyRequest, async (req) => {
        const key = await activationKeysService.getKeyRowOrThrow(req.params)
        return key
    })

    app.post('/', CreateKeyRequest, async (req) => {
        const res = await activationKeysService.createKey(req.body)
        return res
    })
    
    app.get('/status', async () => {
        const key = await activationKeysService.getActivationKeyStatus()
        return key
    })

}


