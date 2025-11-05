import {
    apId,
    isNil,
    Principal,
    PrincipalType,
} from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { BaseAuthnHandler } from '../security-handler'

export class PublicAuthnHandler extends BaseAuthnHandler {
    protected canHandle(_request: FastifyRequest): Promise<boolean> {
        return Promise.resolve(true)
    }

    protected doHandle(request: FastifyRequest): Promise<void> {
        const principal = request.principal as Principal | undefined

        if (isNil(principal)) {
            request.principal = {
                id: `ANONYMOUS_${apId()}`,
                type: PrincipalType.UNKNOWN,
            }
        }

        return Promise.resolve()
    }
}
