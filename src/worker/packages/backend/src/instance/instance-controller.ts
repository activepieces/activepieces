import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { StatusCodes } from 'http-status-codes';
import { Cursor, InstanceId, ProjectId, UpsertInstanceRequest } from 'shared';
import { ActivepiecesError, ErrorCode } from '../helper/activepieces-error';
import { instanceService as service } from './instance-service';

const DEFAULT_PAGING_LIMIT = 10;

type ListQueryParams = {
    projectId: ProjectId,
    cursor: Cursor | undefined,
    limit: number | undefined,
};

type GetOnePathParams = {
    id: InstanceId,
};

export const instanceController = async (app: FastifyInstance, _options: FastifyPluginOptions) => {
    // upsert
    app.post(
        '/',
        {
            schema: {
                body: UpsertInstanceRequest,
            },
        },
        async (request: FastifyRequest<{ Body: UpsertInstanceRequest}>, reply: FastifyReply) => {
            const instance = await service.upsert(request.body);
            reply.send(instance);
        },
    );

    // list
    app.get(
        '/',
        async (request: FastifyRequest<{ Querystring: ListQueryParams}>, reply: FastifyReply) => {
            const instancePage = await service.list({
                projectId: request.query.projectId,
                cursor: request.query.cursor??null,
                limit: request.query.limit ?? DEFAULT_PAGING_LIMIT,
            })

            reply.send(instancePage);
        },
    );

    // get one
    app.get(
        `/:id`,
        async (request: FastifyRequest<{ Params: GetOnePathParams}>, reply: FastifyReply) => {
            const instance = await service.getOne({
                id: request.params.id,
            });

            if (!instance) {
                throw new ActivepiecesError({
                    code: ErrorCode.INSTANCE_NOT_FOUND,
                    params: {
                        id: request.params.id,
                    },
                });
            }

            reply.send(instance);
        },
    );

    // delete one
    app.delete(
        `/:id`,
        async (request: FastifyRequest<{ Params: GetOnePathParams}>, reply: FastifyReply) => {
            const instance = await service.deleteOne({
                id: request.params.id,
            });

            reply.status(StatusCodes.OK).send();
        },
    );
};
