import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { ApId, assertNotNullOrUndefined, isNil } from '@activepieces/shared'
import { managedAuthnKeyPairService } from './managed-authn-key-pair-service'
import { StatusCodes } from 'http-status-codes'

export const managedAuthnKeyPairModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(managedAuthnKeyPairController, { prefix: '/v1/managed-authn-key-pairs' })
}

const managedAuthnKeyPairController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/', AddManagedAuthnKeyPairRequest, async (req, res) => {
        const { id: userId, platformId } = req.principal
        assertNotNullOrUndefined(platformId, 'platformId')

        const newManagedAuthnKeyPair = await managedAuthnKeyPairService.add({
            userId,
            platformId,
        })

        return res
            .status(StatusCodes.CREATED)
            .send(newManagedAuthnKeyPair)
    })

    app.get('/', ListManagedAuthnKeyPairsRequest, async (req) => {
        return managedAuthnKeyPairService.list({
            platformId: req.query.platformId,
        })
    })

    app.get('/:id', GetManagedAuthnKeyPairRequest, async (req, res) => {
        const managedAuthnKeyPair = managedAuthnKeyPairService.getOne(req.params.id)

        if (isNil(managedAuthnKeyPair)) {
            return res.status(StatusCodes.NOT_FOUND).send()
        }

        return managedAuthnKeyPair
    })
}

const AddManagedAuthnKeyPairRequest = {}

const GetManagedAuthnKeyPairRequest = {
    schema: {
        params: Type.Object({
            id: ApId,
        }),
    },
}

const ListManagedAuthnKeyPairsRequest = {
    schema: {
        querystring: Type.Object({
            platformId: ApId,
        }),
    },
}
