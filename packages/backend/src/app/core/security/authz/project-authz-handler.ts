import { FastifyRequest } from 'fastify'
import { BaseSecurityHandler } from '../security-handler'
import { ActivepiecesError, ErrorCode } from '@activepieces/shared'
import { requestUtils } from '../../request/request-utils'

export class ProjectAuthzHandler extends BaseSecurityHandler {
    private static readonly IGNORED_ROUTES = [
        '/v1/users/projects/:projectId/token',
        '/v1/admin/platforms',
        '/v1/admin/pieces',
        '/v1/app-credentials',
    ]

    protected canHandle(request: FastifyRequest): Promise<boolean> {
        const requestMatches = !ProjectAuthzHandler.IGNORED_ROUTES.includes(request.routerPath)
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
