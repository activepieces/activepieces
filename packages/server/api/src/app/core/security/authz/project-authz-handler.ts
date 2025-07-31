import {
    ActivepiecesError,
    assertNotNullOrUndefined,
    ErrorCode,
    PrincipalType,
} from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { requestUtils } from '../../request/request-utils'
import { BaseSecurityHandler } from '../security-handler'

export class ProjectAuthzHandler extends BaseSecurityHandler {
    private static readonly IGNORED_ROUTES = [
        '/v1/admin/pieces',
        '/v1/admin/platforms',
        '/v1/app-credentials',
        '/v1/authentication/switch-project',
        '/v1/authentication/switch-platform',
        '/v1/webhooks',
        '/v1/webhooks/:flowId',
        '/v1/webhooks/:flowId/test',
        '/v1/webhooks/:flowId/sync',
        // This works for both platform and project, we have to check this manually
        '/v1/user-invitations',
        '/v1/audit-events',
    ]

    protected canHandle(request: FastifyRequest): Promise<boolean> {
        const routerPath = request.routeOptions.url
        assertNotNullOrUndefined(routerPath, 'routerPath is undefined'  )    
        const requestMatches = !ProjectAuthzHandler.IGNORED_ROUTES.includes(
            routerPath,
        )
        return Promise.resolve(requestMatches)
    }

    protected doHandle(request: FastifyRequest): Promise<void> {
        if (request.principal.type === PrincipalType.WORKER) {
            return Promise.resolve()
        }
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
