import { PrincipalType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { jwtUtils } from '../../../../src/app/helper/jwt-utils'

const SECRET = 'verify-principal-test-secret'

vi.mock('../../../../src/app/user/user-service', () => ({
    userService: () => ({
        getOneOrFail: vi.fn().mockResolvedValue({
            id: 'user-1',
            identityId: 'identity-1',
            status: 'ACTIVE',
        }),
    }),
}))

vi.mock('../../../../src/app/authentication/user-identity/user-identity-service', () => ({
    userIdentityService: () => ({
        getOneOrFail: vi.fn().mockResolvedValue({
            id: 'identity-1',
            verified: true,
            tokenVersion: null,
        }),
    }),
}))

const { accessTokenManager } = await import('../../../../src/app/authentication/lib/access-token-manager')

const mockLog: FastifyBaseLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    trace: vi.fn(),
    child: vi.fn(),
    silent: vi.fn(),
    level: 'info',
} as unknown as FastifyBaseLogger

const manager = accessTokenManager(mockLog)

beforeAll(() => {
    vi.spyOn(jwtUtils, 'getJwtSecret').mockResolvedValue(SECRET)
})

describe('verifyPrincipal', () => {
    it('accepts a token with a valid PrincipalType', async () => {
        const token = await jwtUtils.sign({
            payload: {
                id: 'worker-1',
                type: PrincipalType.WORKER,
            },
            key: SECRET,
            expiresInSeconds: 60,
        })

        const decoded = await manager.verifyPrincipal(token)
        expect(decoded.id).toBe('worker-1')
        expect(decoded.type).toBe(PrincipalType.WORKER)
    })

    it('rejects a token whose type is not a PrincipalType', async () => {
        const token = await jwtUtils.sign({
            payload: {
                id: 'x',
                type: 'NOT_A_REAL_TYPE',
            },
            key: SECRET,
            expiresInSeconds: 60,
        })

        await expect(manager.verifyPrincipal(token)).rejects.toThrow()
    })

    it('rejects a token with no type field', async () => {
        const token = await jwtUtils.sign({
            payload: {
                id: 'x',
            },
            key: SECRET,
            expiresInSeconds: 60,
        })

        await expect(manager.verifyPrincipal(token)).rejects.toThrow()
    })
})
