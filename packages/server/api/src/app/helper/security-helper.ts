import { PrincipalType } from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { platformService } from '../platform/platform.service'

export const securityHelper = {
    async getUserIdFromRequest(request: FastifyRequest): Promise<string | null> {
        switch (request.principal.type) {
            case PrincipalType.SERVICE: {
                const platform = await platformService.getOneOrThrow(request.principal.platform.id)
                return platform.ownerId
            }
            case PrincipalType.USER:
                return request.principal.id
            default:
                throw new Error(`Unsupported principal type: ${request.principal.type}`)
        }
    },
}