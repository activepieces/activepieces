import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { StatusCodes } from "http-status-codes";
import { GetInstanceRequest, InstanceId, UpsertInstanceRequest } from "@activepieces/shared";
import { instanceService as service } from "./instance.service";


interface GetOnePathParams {
    id: InstanceId;
}

export const instanceController = async (app: FastifyInstance) => {
    // upsert
    app.post(
        "/",
        {
            schema: {
                body: UpsertInstanceRequest,
            },
        },
        async (request: FastifyRequest<{ Body: UpsertInstanceRequest }>, reply: FastifyReply) => {
            const instance = await service.upsert({ projectId: request.principal.projectId, request: request.body });
            reply.send(instance);
        }
    );

    // list
    app.get(
        "/",
        {
            schema: {
                querystring: GetInstanceRequest
            }
        }
        ,
        async (
            request: FastifyRequest<{
                Querystring: GetInstanceRequest
            }>,
            reply: FastifyReply
        ) => {
            reply.send(await service.getByCollectionId({ projectId: request.principal.projectId, collectionId: request.query.collectionId }));
        }
    );

    // delete one
    app.delete("/:id", async (request: FastifyRequest<{ Params: GetOnePathParams }>, reply: FastifyReply) => {
        await service.deleteOne({
            id: request.params.id,
            projectId: request.principal.projectId
        });
        reply.status(StatusCodes.OK).send();
    });
};
