import { FastifyRequest } from 'fastify'
import { requestUtils } from '../../request/request-utils'
import { BaseSecurityHandler } from '../security-handler'
import { ActivepiecesError, ErrorCode } from '@activepieces/shared'

export class ProjectAuthzHandler extends BaseSecurityHandler {
    private static readonly IGNORED_ROUTES = [
        '/v1/admin/pieces',
        '/v1/admin/platforms',
        '/v1/app-credentials',
        '/v1/users/projects/:projectId/token',
        '/v1/webhooks',
        '/v1/webhooks/:flowId',
        '/v1/webhooks/:flowId/test',
        '/v1/webhooks/:flowId/sync',
    ]

    protected canHandle(request: FastifyRequest): Promise<boolean> {
        const requestMatches = !ProjectAuthzHandler.IGNORED_ROUTES.includes(
            request.routerPath,
        )
        return Promise.resolve(requestMatches)
    }

    protected doHandle(request: FastifyRequest): Promise<void> {
        const projectId = requestUtils.extractProjectId(request)

        if (projectId && projectId !== request.principal.projectId) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHORIZATION,
                params: {
                    message: 'invalid project id',
                },
            })
        }

        return Promise.resolve()
    }
}
