import { AdminAddPlatformRequestBody, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { stripeHelper } from '../platform-billing/stripe-helper'
import { adminPlatformService } from './admin-platform.service'

export const adminPlatformPieceModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(adminPlatformController, { prefix: '/v1/admin/platforms' })
}

const adminPlatformController: FastifyPluginAsyncTypebox = async (
    app,
) => {
    app.post('/', AdminAddPlatformRequest, async (req, res) => {
        const newPlatform = await adminPlatformService(req.log).add(req.body)

        return res.status(StatusCodes.CREATED).send(newPlatform)
    })

    app.post('/create-stripe-customer', AdminCreateStripeCustomerRequest, async (req, res) => {
        const stripeCustomerId = await stripeHelper(req.log).createCustomer({ email: req.body.email, firstName: req.body.firstName, lastName: req.body.lastName, id: req.body.userId }, req.body.platformId)
        return res.status(StatusCodes.CREATED).send({ stripeCustomerId })
    })
}

const AdminAddPlatformRequest = {
    schema: {
        body: AdminAddPlatformRequestBody,
    },
    config: {
        allowedPrincipals: [PrincipalType.SUPER_USER],
    },
}
const AdminCreateStripeCustomerRequest = {
    schema: {
        body: Type.Object({
            platformId: Type.String(),
            email: Type.String(),
            firstName: Type.String(),
            lastName: Type.String(),
            userId: Type.String(),
        }),
    },
    config: {
        allowedPrincipals: [PrincipalType.SUPER_USER],
    },
}