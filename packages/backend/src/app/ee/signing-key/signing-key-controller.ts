import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { ActivepiecesError, ApId, ErrorCode, assertNotNullOrUndefined, isNil } from '@activepieces/shared'
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
        const newSigningKey = await signingKeyService.add({
            userId,
            platformId,
            displayName: req.body.displayName,
        })

        return res
            .status(StatusCodes.CREATED)
            .send(newSigningKey)
    })

    app.get('/', {}, async (req) => {
        const { platformId } = req.principal
        assertNotNullOrUndefined(platformId, 'platformId')
        return signingKeyService.list({
            platformId: req.principal.platformId,
        })
    })

    app.get('/:id', GetSigningKeyRequest, async (req) => {
        const { platformId } = req.principal
        assertNotNullOrUndefined(platformId, 'platformId')
        const signingKey = await signingKeyService.getOne({
            id: req.params.id,
            platformId,
        })

        if (isNil(signingKey)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    message: `SigningKey with id ${req.params.id} not found`,
                },
            })
        }

        return signingKey
    })

    app.delete('/:id', DeleteSigningKeyRequest, async (req, res) => {
        const { platformId } = req.principal
        assertNotNullOrUndefined(platformId, 'platformId')
        await signingKeyService.delete({
            id: req.params.id,
            platformId,
            userId: req.principal.id,
        })
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

