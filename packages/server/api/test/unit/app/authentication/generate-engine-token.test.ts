import { EnginePrincipal, PrincipalType } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { jwtUtils } from '../../../../src/app/helper/jwt-utils'
import { system } from '../../../../src/app/helper/system/system'
import { AppSystemProp } from '../../../../src/app/helper/system/system-props'

const SECRET = 'generate-engine-token-test-secret'
const RETENTION_DAYS = 30

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
        if (prop === AppSystemProp.EXECUTION_DATA_RETENTION_DAYS) {
            return RETENTION_DAYS
        }
        throw new Error(`Unexpected system prop in test: ${prop}`)
    })
})

describe('generateEngineToken', () => {
    it('issues a JWT whose lifetime equals EXECUTION_DATA_RETENTION_DAYS, not the legacy 100-year value', async () => {
        const token = await manager.generateEngineToken({
            jobId: 'job-1',
            projectId: 'proj-1',
            platformId: 'plat-1',
        })

        const decoded = await jwtUtils.decodeAndVerify<EnginePrincipal & { iat: number, exp: number }>({
            jwt: token,
            key: SECRET,
        })

        const expectedSeconds = dayjs.duration(RETENTION_DAYS, 'day').asSeconds()
        expect(decoded.exp - decoded.iat).toBe(expectedSeconds)
        expect(decoded.type).toBe(PrincipalType.ENGINE)
        expect(decoded.projectId).toBe('proj-1')
        expect(decoded.platform.id).toBe('plat-1')
    })
})
