import {
    ActivepiecesError,
    ErrorCode,
    isNil,
    isObject,
    PrincipalType,
    ProjectType,
} from '@activepieces/shared'
import { onRequestAsyncHookHandler, preSerializationHookHandler } from 'fastify'
import { projectService } from '../project/project-service'

export function extractResourceName(url: string): string | undefined {
    const urlPath = url.split('?')[0]
    const resourceRegex = /\/v1\/(.+?)(\/|$)/
    const resourceMatch = urlPath.match(resourceRegex)
    const resource = resourceMatch ? resourceMatch[1] : undefined
    return resource
}

/**
 * Throws an authz error if response entities contain a `projectId` property and
 * the `projectId` property value does not match the principal's `projectId`.
 * Otherwise, does nothing.
 */
export const entitiesMustBeOwnedByCurrentProject: preSerializationHookHandler<
Payload | null
> = (request, _response, payload, done) => {
    request.log.trace(
        { payload, principal: request.principal, route: request.routeOptions.config },
        'entitiesMustBeOwnedByCurrentProject',
    )
    const principalProjectId = request.principal.type === PrincipalType.USER
    || request.principal.type === PrincipalType.ENGINE
        ? request.principal.projectId : undefined

    if (isObject(payload) && !isNil(principalProjectId)) {
        let verdict: AuthzVerdict = 'ALLOW'

        if ('projectId' in payload) {
            if (payload.projectId !== principalProjectId) {
                verdict = 'DENY'
            }
        }
        else if ('data' in payload && Array.isArray(payload.data)) {
            const someEntityNotOwnedByCurrentProject = payload.data.some((entity) => {
                return 'projectId' in entity && entity.projectId !== principalProjectId
            })

            if (someEntityNotOwnedByCurrentProject) {
                verdict = 'DENY'
            }
        }

        if (verdict === 'DENY') {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHORIZATION,
                params: {
                    message: 'not owned by current project',
                },
            })
        }
    }

    done()
}

export const projectMustBeTeamType: onRequestAsyncHookHandler =
    async (request, _res) => {
        if (request.principal.type !== PrincipalType.USER && request.principal.type !== PrincipalType.SERVICE) {
            return
        }
        const projectId = request.principal.type === PrincipalType.USER ? request.principal.projectId : null
        if (isNil(projectId)) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHORIZATION,
                params: {
                    message: 'Project ID is required / or is null',
                },
            })
        }
        const project = await projectService.getOneOrThrow(projectId)
        if (project.type !== ProjectType.TEAM) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'Project must be a team project',
                },
            })
        }
    }

type SingleEntity = {
    projectId?: string
}

type MultipleEntities = {
    data: SingleEntity[]
}

type Payload = SingleEntity | MultipleEntities

type AuthzVerdict = 'ALLOW' | 'DENY'
