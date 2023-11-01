import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { ActivepiecesError, ApId, ErrorCode, assertNotNullOrUndefined, isNil } from '@activepieces/shared'
import { signingKeyService } from './signing-key-service'
import { StatusCodes } from 'http-status-codes'
import { AddSigningKeyRequestBody } from '@activepieces/ee-shared'
import { platformService } from '../platform/platform.service'

export const signingKeyController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/', AddSigningKeyRequest, async (req, res) => {
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
        const signingKey = await signingKeyService.get({
            id: req.params.id,
        })
        if (isNil(signingKey)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    message: `SigningKey with id ${req.params.id} not found`,
                },
            })
        }
        assertUserOwnPlatformId({ userId: req.id, platformId: signingKey.platformId })
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


const assertUserOwnPlatformId = async ({ userId, platformId }: { userId: string, platformId: string }): Promise<void> => {
    const userIsOwner = await platformService.checkUserIsOwner({
        userId,
        platformId,
    })

    if (!userIsOwner) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {},
        })
    }
}
const AddSigningKeyRequest = {
    schema: {
        body: AddSigningKeyRequestBody,
    },
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
