import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { ApId, assertNotNullOrUndefined, isNil } from '@activepieces/shared'
import { signingKeyService } from './signing-key-service'
import { StatusCodes } from 'http-status-codes'
import { CreateSigningKeyRequest } from '@activepieces/ee-shared'

export const signingKeyController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/', {
    
        schema: {
            body: CreateSigningKeyRequest,
        },
    }, async (req, res) => {
        const { id: userId, platformId } = req.principal
        assertNotNullOrUndefined(platformId, 'platformId')
        const displayName = req.body.displayName
        const newSigningKey = await signingKeyService.add({
            userId,
            platformId,
            displayName,
        })

        return res
            .status(StatusCodes.CREATED)
            .send(newSigningKey)
    })

    app.get('/', ListSigningKeysRequest, async (req) => {
        return await signingKeyService.list({
            platformId: req.query.platformId,
        })
    })

    app.get('/:id', GetSigningKeyRequest, async (req, res) => {
        const signingKey = await signingKeyService.getOne(req.params.id)

        if (isNil(signingKey)) {
            return res.status(StatusCodes.NOT_FOUND).send()
        }

        return signingKey
    })
    
    app.delete('/:id', DeleteSigningKeyRequest, async (req, res) =>{
        await signingKeyService.getOne(req.params.id)
        return res.status(StatusCodes.OK).send()
    })
}



const GetSigningKeyRequest = {
    schema: {
        params: Type.Object({
            id: ApId,
        }),
    },
}

const DeleteSigningKeyRequest = {
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
