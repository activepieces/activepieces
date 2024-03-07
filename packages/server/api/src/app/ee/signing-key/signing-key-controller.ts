import {
    FastifyPluginAsyncTypebox,
    Type,
} from '@fastify/type-provider-typebox'
import {
    ActivepiecesError,
    ApId,
    ErrorCode,
    assertNotNullOrUndefined,
    isNil,
} from '@activepieces/shared'
import { signingKeyService } from './signing-key-service'
import { StatusCodes } from 'http-status-codes'
import { AddSigningKeyRequestBody, ApplicationEventName } from '@activepieces/ee-shared'
import { eventsHooks } from '../../helper/application-events'

export const signingKeyController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/', AddSigningKeyRequest, async (req, res) => {
        const platformId = req.principal.platform.id
        assertNotNullOrUndefined(platformId, 'platformId')

        const newSigningKey = await signingKeyService.add({
            platformId,
            displayName: req.body.displayName,
        })

        eventsHooks.get().send(req, {
            action: ApplicationEventName.CREATED_SIGNING_KEY,
            userId: req.principal.id,
            signingKey: newSigningKey,
        })

        return res.status(StatusCodes.CREATED).send(newSigningKey)
    })

    app.get('/', {}, async (req) => {
        const platformId = req.principal.platform.id
        assertNotNullOrUndefined(platformId, 'platformId')
        return signingKeyService.list({
            platformId,
        })
    })

    app.get('/:id', GetSigningKeyRequest, async (req) => {
        const platformId = req.principal.platform.id
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
        return signingKey
    })

    app.delete('/:id', DeleteSigningKeyRequest, async (req, res) => {
        const platformId = req.principal.platform.id
        assertNotNullOrUndefined(platformId, 'platformId')
        await signingKeyService.delete({
            id: req.params.id,
            platformId,
        })
        return res.status(StatusCodes.OK).send()
    })
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
