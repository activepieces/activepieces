import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { clientActivationKeyService } from './client-activation-keys-service'
import { ActivateKeyRequest, CreateKeyRequest, GetKeyRequest } from '@activepieces/shared'

export const clientActivationKeysController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/:key', GetKeyRequest({ withCredentials: true }), async (req) => {
        return clientActivationKeyService.getKey(req.params)
    })

    app.post('/activate', ActivateKeyRequest({ withCredentials: true }), async (req) => {
        return clientActivationKeyService.activateKey(req.body)
    })
    app.post('/', CreateKeyRequest({ withCredentials: true }), async (req) => {
        return clientActivationKeyService.createKey(req.body)
    })
}

