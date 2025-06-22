import {
    ActivepiecesError,
    ErrorCode,
    isNil,
    isObject,
} from '@activepieces/shared'
import { preSerializationHookHandler } from 'fastify'

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
    const principalProjectId = request.principal?.projectId

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

type SingleEntity = {
    projectId?: string
}

type MultipleEntities = {
    data: SingleEntity[]
}

type Payload = SingleEntity | MultipleEntities

type AuthzVerdict = 'ALLOW' | 'DENY'
