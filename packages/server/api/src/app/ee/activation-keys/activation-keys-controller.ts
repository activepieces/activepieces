import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { activationKeysService } from './activation-keys-service'
import { ActivateKeyRequestBody, CreateKeyRequestBody,  PrincipalType } from '@activepieces/shared'


export const activationKeysController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/:key', GetKeyRequest, async (req) => {
        const key = await activationKeysService.getKeyRow(req.params.key)
        return key
    })

    app.post('/activate', ActivateKeyRequest, async (req) => {
        const res =  await activationKeysService.activateKey(req.body.key)
        return res

    })
    app.post('/', CreateKeyRequest, async (req) => {
        const res = await activationKeysService.createKey(req.body.email)
        return res
    })
}

const GetKeyRequest = {
    config: {
        allowedPrincipals: [
            PrincipalType.USER,
        ],
    },
    schema: {
        params: Type.Object({
            key: Type.String(),
        }),
    },
}

const CreateKeyRequest = {
    config: {
        allowedPrincipals: [
            PrincipalType.USER,
        ],
    },
    schema: {
        body: CreateKeyRequestBody,
    },
}
const ActivateKeyRequest = {
    config: {
        allowedPrincipals: [
            PrincipalType.USER,
        ],
    },
    schema: {
        body: ActivateKeyRequestBody,
    },
}
