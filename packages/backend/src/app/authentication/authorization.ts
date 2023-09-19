import { ActivepiecesError, ErrorCode, PrincipalType, isNil } from '@activepieces/shared'
import { onRequestHookHandler, preSerializationHookHandler } from 'fastify'
import { logger } from '../helper/logger'

export const allowWorkersOnly: onRequestHookHandler = (request, _res, done) => {
    if (request.principal.type !== PrincipalType.WORKER) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {},
        })
    }

    done()
}

export const entitiesMustBeOwnedByCurrentProject: preSerializationHookHandler<Payload> = (request, _response, payload, done) => {
    logger.trace({ payload, principal: request.principal, route: request.routeConfig }, 'entitiesMustBeOwnedByCurrentProject')

    if (!isNil(payload)) {
        const projectId = request.principal.projectId

        let someEntityNotOwnedByCurrentProject = false
        const payloadIsSingleEntity = !isNil(payload.projectId)

        if (payloadIsSingleEntity) {
            someEntityNotOwnedByCurrentProject = payload.projectId !== projectId
        }
        else if (Array.isArray(payload.data)) {
            someEntityNotOwnedByCurrentProject = payload.data.some(entity => entity.projectId !== projectId)
        }


        if (someEntityNotOwnedByCurrentProject) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHORIZATION,
                params: {},
            })
        }
    }

    done()
}

type WithProjectId = {
    projectId: string
}

type Payload = WithProjectId & {
    data: WithProjectId[] | undefined
}
