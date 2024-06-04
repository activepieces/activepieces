import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { activationKeysService } from './activation-keys-service'
import { ActivateKeyRequest, CreateKeyRequest, GetKeyRequest } from '@activepieces/shared'


export const activationKeysController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/:key', GetKeyRequest({ withCredentials: false }), async (req) => {
        const key = await activationKeysService.getKeyRow(req.params.key)
        return key
    })

    app.post('/activate', ActivateKeyRequest({ withCredentials: false }), async (req) => {
        const res =  await activationKeysService.activateKey(req.body.key)
        return res

    })
    app.post('/', CreateKeyRequest({ withCredentials: false }), async (req) => {
        const res = await activationKeysService.createKey(req.body.email)
        return res
    })
}
