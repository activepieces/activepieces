import { EnginePrincipal, PrincipalType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { jwtUtils } from '../../../../src/app/helper/jwt-utils'
import { system } from '../../../../src/app/helper/system/system'
import { AppSystemProp } from '../../../../src/app/helper/system/system-props'

const SECRET = 'generate-engine-token-test-secret'
const FLOW_TIMEOUT_SECONDS = 600
const TRIGGER_TIMEOUT_SECONDS = 60
const TRIGGER_HOOKS_TIMEOUT_SECONDS = 180
const MARGIN_SECONDS = 60 * 60

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
    vi.spyOn(system, 'getNumberOrThrow').mockImplementation((prop) => {
        switch (prop) {
            case AppSystemProp.FLOW_TIMEOUT_SECONDS:
                return FLOW_TIMEOUT_SECONDS
            case AppSystemProp.TRIGGER_TIMEOUT_SECONDS:
                return TRIGGER_TIMEOUT_SECONDS
            case AppSystemProp.TRIGGER_HOOKS_TIMEOUT_SECONDS:
                return TRIGGER_HOOKS_TIMEOUT_SECONDS
            default:
                throw new Error(`Unexpected system prop in test: ${prop}`)
        }
    })
})

async function decode(token: string): Promise<EnginePrincipal & { iat: number, exp: number }> {
    return jwtUtils.decodeAndVerify<EnginePrincipal & { iat: number, exp: number }>({ jwt: token, key: SECRET })
}

describe('generateEngineToken', () => {
    it('issues a JWT that outlives the longest job timeout by a fixed margin', async () => {
        const token = await manager.generateEngineToken({
            jobId: 'job-1',
            projectId: 'proj-1',
            platformId: 'plat-1',
        })

        const decoded = await decode(token)

        expect(decoded.exp - decoded.iat).toBe(FLOW_TIMEOUT_SECONDS + MARGIN_SECONDS)
        expect(decoded.id).toBe('job-1')
        expect(decoded.type).toBe(PrincipalType.ENGINE)
        expect(decoded.projectId).toBe('proj-1')
        expect(decoded.platform.id).toBe('plat-1')
    })
})
