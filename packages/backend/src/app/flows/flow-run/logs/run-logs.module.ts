import { FlowRunId } from '@activepieces/shared'
import { FastifyInstance, FastifyRequest } from 'fastify'
import { logsService } from './run-logs.service'

export const logsModule = async (app: FastifyInstance) => {
    app.register(logscontroller, { prefix: '/v1/logs' })
}

const logscontroller = async (fastify: FastifyInstance) => {
    fastify.get(
        '/:logId',
        async (
            request: FastifyRequest<{
                Params: {
                    logId: string
                }
            }>,
            _reply,
        ) => {
            return logsService.getOneOrThrow({
                projectId: request.principal.projectId,
                logId: request.params.logId,
            })
        },
    )
}
