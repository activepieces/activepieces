import { ActivepiecesError, ErrorCode, isNil, isObject } from '@activepieces/core-utils'
import { PrincipalType } from '@activepieces/shared'
import { preSerializationHookHandler } from 'fastify'

export const entitiesMustBeOwnedByCurrentProject: preSerializationHookHandler<Payload | null> = (request, _response, payload, done) => {
    request.log.trace(
        { payload, principal: request.principal, route: request.routeOptions.config },
        'entitiesMustBeOwnedByCurrentProject',
    )
    const principalProjectId = request.principal.type === PrincipalType.ENGINE ? request.principal.projectId : (request.projectId ?? undefined)

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
            request.log.warn({
                principalProjectId,
                route: request.routeOptions.config,
            }, 'Authorization denied: entity not owned by current project')
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
