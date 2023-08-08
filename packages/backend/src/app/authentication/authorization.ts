import { ActivepiecesError, ErrorCode, PrincipalType } from '@activepieces/shared'
import { onRequestHookHandler } from 'fastify'

export const allowWorkersOnly: onRequestHookHandler = (request, _res, done) => {
    if (request.principal.type !== PrincipalType.WORKER) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {},
        })
    }

    done()
}
