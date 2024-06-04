import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { activationKeysService } from './activation-keys-service'
import { ActivateKeyRequest, CreateKeyRequest, GetKeyRequest } from '@activepieces/shared'


export const activationKeysController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/:key', GetKeyRequest, async (req) => {
        const key = await activationKeysService.getKeyRow(req.params)
        return key
    })

    app.post('/activate', ActivateKeyRequest, async (req) => {
        const res =  await activationKeysService.activateKey(req.body)
        return res

    })
    app.post('/', CreateKeyRequest, async (req) => {
        const res = await activationKeysService.createKey(req.body)
        return res
    })
}
