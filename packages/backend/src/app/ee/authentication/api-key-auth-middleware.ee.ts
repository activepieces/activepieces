import { FastifyRequest } from 'fastify'
import { ActivepiecesError, ErrorCode, isEmpty, isNil } from '@activepieces/shared'
import { system } from '../../helper/system/system'
import { SystemProp } from '../../helper/system/system-prop'

const API_KEY = system.get(SystemProp.API_KEY)

export const API_KEY_PROTECTED_ROUTES = [
    {
        method: 'POST',
        url: '/v1/admin/pieces',
    },
    {
        method: 'POST',
        url: '/v1/admin/flow-templates',
    },
    {
        method: 'DELETE',
        url: '/v1/admin/flow-templates',
    },
    {
        method: 'POST',
        url: '/v1/admin/flow-templates/:id',
    },
    {
        method: 'POST',
        url: '/v1/admin/users',
    },
    {
        method: 'POST',
        url: '/v1/admin/platforms',
    },
]

export const apiKeyAuthMiddleware = async (req: FastifyRequest): Promise<void> => {
    const routeNotProtected = !API_KEY_PROTECTED_ROUTES.find((route: { method: string, url: string }) => {
        return route.method === req.method && route.url === req.url
    })
    if (routeNotProtected) {
        return
    }
    if (isEmpty(API_KEY) || isNil(API_KEY)) {
        throw new ActivepiecesError({
            code: ErrorCode.INVALID_API_KEY,
            params: {},
        })
    }

    const requestApiKey = req.headers['api-key']
    const keyNotMatching = API_KEY !== requestApiKey

    if (keyNotMatching) {
        throw new ActivepiecesError({
            code: ErrorCode.INVALID_API_KEY,
            params: {},
        })
    }
}
