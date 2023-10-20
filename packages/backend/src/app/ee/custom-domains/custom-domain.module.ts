import { CreateDomainRequest, ListCustomDomainsRequest } from "@activepieces/ee-shared"
import { FastifyPluginAsyncTypebox, Static, Type } from "@fastify/type-provider-typebox"
import { customDomainService } from "./custom-domain.service"
import { HttpStatusCode } from "axios"


const GetOneRequest = Type.Object({
    id: Type.String(),
})
type GetOneRequest = Static<typeof GetOneRequest>;

export const customDomainModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(customDomainController, { prefix: '/v1/custom-domains' })
}

// TODO MAKE SURE ATTACH IT TO PLATFORM AUTHENTICATION
const customDomainController: FastifyPluginAsyncTypebox = async (fastify) => {

    fastify.post(
        '/',
        {
            schema: {
                body: CreateDomainRequest
            },
        },
        async (
            request,
            reply,
        ) => {
            const domain = await customDomainService.getOneByDomain({
                domain: request.body.domain
            })
            if (domain) {
                reply.status(HttpStatusCode.Conflict).send({
                    message: `Domain ${request.body.domain} already exists`
                })
                return;
            }
            return customDomainService.create({
                domain: request.body.domain
            })
        },
    )

    fastify.post(
        '/:id/verify',
        {
            schema: {
                params: GetOneRequest,
            }
        },
        async (
            request,
            reply,
        ) => {
            return customDomainService.check({
                id: request.params.id
            })
        },
    )

    fastify.get('/', {
        schema: {
            querystring: ListCustomDomainsRequest,
        },
    }, async (request) => {
        return customDomainService.list(request.query)
    })

    fastify.delete(
        '/:id',
        {
            schema: {
                params: GetOneRequest,
            }
        },
        async (
            request,
            reply,
        ) => {
            return customDomainService.delete({
                id: request.params.id
            })
        },
    )
}