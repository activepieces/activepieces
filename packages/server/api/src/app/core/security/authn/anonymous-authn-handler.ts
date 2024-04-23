import { FastifyRequest } from 'fastify'
import { BaseSecurityHandler } from '../security-handler'
import {
    apId,
    isNil,
    Principal,
    PrincipalType,
} from '@activepieces/shared'

export class AnonymousAuthnHandler extends BaseSecurityHandler {
    protected canHandle(_request: FastifyRequest): Promise<boolean> {
        return Promise.resolve(true)
    }

    protected doHandle(request: FastifyRequest): Promise<void> {
        const principal = request.principal as Principal | undefined

        if (isNil(principal)) {
            request.principal = {
                id: `ANONYMOUS_${apId()}`,
                type: PrincipalType.UNKNOWN,
                projectId: `ANONYMOUS_${apId()}`,
                platform: {
                    id: `ANONYMOUS_${apId()}`,
                },
            }
        }

        return Promise.resolve()
    }
}
