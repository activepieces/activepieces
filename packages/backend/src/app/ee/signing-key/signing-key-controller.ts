import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { ApId, assertNotNullOrUndefined, isNil } from '@activepieces/shared'
import { signingKeyService } from './signing-key-service'
import { StatusCodes } from 'http-status-codes'

export const signingKeyController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/', AddSigningKeyRequest, async (req, res) => {
        const { id: userId, platformId } = req.principal
        assertNotNullOrUndefined(platformId, 'platformId')

        const newSigningKey = await signingKeyService.add({
            userId,
            platformId,
        })

        return res
            .status(StatusCodes.CREATED)
            .send(newSigningKey)
    })

    app.get('/', ListSigningKeysRequest, async (req) => {
        return signingKeyService.list({
            platformId: req.query.platformId,
        })
    })

    app.get('/:id', GetSigningKeyRequest, async (req, res) => {
        const signingKey = signingKeyService.getOne(req.params.id)

        if (isNil(signingKey)) {
            return res.status(StatusCodes.NOT_FOUND).send()
        }

        return signingKey
    })
}

const AddSigningKeyRequest = {}

const GetSigningKeyRequest = {
    schema: {
        params: Type.Object({
            id: ApId,
        }),
    },
}

const ListSigningKeysRequest = {
    schema: {
        querystring: Type.Object({
            platformId: ApId,
        }),
    },
}
