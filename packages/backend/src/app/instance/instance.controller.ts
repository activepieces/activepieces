import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { GetInstanceRequest, UpdateInstanceRequest, UpsertInstanceRequest } from '@activepieces/shared'
import { instanceService as service } from './instance.service'
import { Static, Type } from '@sinclair/typebox'

const GetCollectionIdParams = Type.Object({
    collectionId: Type.String(),
})

type GetCollectionIdParams = Static<typeof GetCollectionIdParams>

export const instanceController = async (app: FastifyInstance) => {
    // upsert
    app.post(
        '/',
        {
            schema: {
                body: UpsertInstanceRequest,
            },
        },
        async (request: FastifyRequest<{ Body: UpsertInstanceRequest }>, reply: FastifyReply) => {
            const instance = await service.upsert({ projectId: request.principal.projectId, request: request.body })
            reply.send(instance)
        },
    )

    // list
    app.get(
        '/',
        {
            schema: {
                querystring: GetInstanceRequest,
            },
        }
        ,
        async (
            request: FastifyRequest<{
                Querystring: GetInstanceRequest
            }>,
            reply: FastifyReply,
        ) => {
            reply.send(await service.getByCollectionId({ projectId: request.principal.projectId, collectionId: request.query.collectionId }))
        },
    )

    // delete one
    app.delete('/:collectionId', async (request: FastifyRequest<{ Params: GetCollectionIdParams }>, reply: FastifyReply) => {
        await service.deleteOne({
            id: request.params.collectionId,
            projectId: request.principal.projectId,
        })
        reply.status(StatusCodes.OK).send()
    })

    // update status
    app.post(
        '/:collectionId',
        {
            schema: {
                params: GetCollectionIdParams,
                body: UpdateInstanceRequest,
            },
        },
        async (request: FastifyRequest<{ Body: UpdateInstanceRequest, Params: GetCollectionIdParams }>, reply: FastifyReply) => {
            const instance = await service.updateInstanceStatusByCollectionId({ projectId: request.principal.projectId, collectionId: request.params.collectionId, request: request.body })
            reply.send(instance)
        },
    )
}
