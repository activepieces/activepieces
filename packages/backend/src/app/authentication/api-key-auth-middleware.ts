import { FastifyRequest } from 'fastify'
import { ActivepiecesError, ErrorCode } from '@activepieces/shared'
import { system } from '../helper/system/system'
import { SystemProp } from '../helper/system/system-prop'

const API_KEY = system.getOrThrow(SystemProp.API_KEY)

export const API_KEY_PROTECTED_ROUTES = new Set([
    '/v1/admin/pieces',
])

export const apiKeyAuthMiddleware = async (req: FastifyRequest): Promise<void> => {
    const routeNotProtected = !API_KEY_PROTECTED_ROUTES.has(req.routerPath)

    if (routeNotProtected) {
        return
    }

    const requestApiKey = req.headers['Api-Key']
    const keyNotMatching = API_KEY !== requestApiKey

    if (keyNotMatching) {
        throw new ActivepiecesError({
            code: ErrorCode.INVALID_API_KEY,
            params: {},
        })
    }
}
