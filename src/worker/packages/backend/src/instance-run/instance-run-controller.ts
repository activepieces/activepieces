import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { Cursor, InstanceRunId, ProjectId } from 'shared';
import { ActivepiecesError, ErrorCode } from '../helper/activepieces-error';
import { instanceRunService as service } from './instance-run-service';


const DEFAULT_PAGING_LIMIT = 10;

type ListQueryParams = {
    projectId: ProjectId,
    cursor: Cursor | undefined,
    limit: number | undefined,
};

type GetOnePathParams = {
    id: InstanceRunId,
};

export const instanceRunController = async (app: FastifyInstance, _options: FastifyPluginOptions) => {
    // list
    app.get(
        '/',
        async (request: FastifyRequest<{ Querystring: ListQueryParams}>, reply: FastifyReply) => {
            const instanceRunPage = await service.list({
                projectId: request.query.projectId,
                cursor: request.query.cursor??null,
                limit: request.query.limit ?? DEFAULT_PAGING_LIMIT,
            })

            reply.send(instanceRunPage);
        },
    );

    // get one
    app.get(
        `/:id`,
        async (request: FastifyRequest<{ Params: GetOnePathParams}>, reply: FastifyReply) => {
            const instanceRun = await service.getOne({
                id: request.params.id,
            });

            if (!instanceRun) {
                throw new ActivepiecesError({
                    code: ErrorCode.INSTANCE_RUN_NOT_FOUND,
                    params: {
                        id: request.params.id,
                    },
                });
            }

            reply.send(instanceRun);
        },
    );
};
