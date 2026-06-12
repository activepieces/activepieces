import { AppConnection, AppConnectionStatus, AppConnectionType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { describe, expect, it, vi } from 'vitest'
import { appConnectionHandler } from '../../../../src/app/app-connection/app-connection-service/app-connection.handler'

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

function makeCustomAuthConnection(overrides: { status?: AppConnectionStatus; nextRefreshEpochMs?: number }): AppConnection {
    return {
        id: 'conn-1',
        externalId: 'ext-1',
        pieceName: 'my-piece',
        platformId: 'plat-1',
        projectIds: ['proj-1'],
        status: overrides.status ?? AppConnectionStatus.ACTIVE,
        value: {
            type: AppConnectionType.CUSTOM_AUTH,
            props: { apiKey: 'secret' },
            ...(overrides.nextRefreshEpochMs !== undefined ? { nextRefreshEpochMs: overrides.nextRefreshEpochMs } : {}),
        },
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        displayName: 'My Connection',
        ownerId: null,
        scope: 'PROJECT',
    } as unknown as AppConnection
}

describe('appConnectionHandler.needRefresh', () => {
    const handler = appConnectionHandler(mockLog)

    it('returns false for CUSTOM_AUTH with no nextRefreshEpochMs (existing connections unaffected)', () => {
        const connection = makeCustomAuthConnection({})
        expect(handler.needRefresh(connection, mockLog)).toBe(false)
    })

    it('returns false for CUSTOM_AUTH when nextRefreshEpochMs is more than 15 minutes in the future', () => {
        const connection = makeCustomAuthConnection({
            nextRefreshEpochMs: Date.now() + 20 * 60 * 1000,
        })
        expect(handler.needRefresh(connection, mockLog)).toBe(false)
    })

    it('returns true for CUSTOM_AUTH when nextRefreshEpochMs is within 15 minutes (early refresh window)', () => {
        const connection = makeCustomAuthConnection({
            nextRefreshEpochMs: Date.now() + 10 * 60 * 1000,
        })
        expect(handler.needRefresh(connection, mockLog)).toBe(true)
    })

    it('returns true for CUSTOM_AUTH when nextRefreshEpochMs is in the past (overdue)', () => {
        const connection = makeCustomAuthConnection({
            nextRefreshEpochMs: Date.now() - 5 * 60 * 1000,
        })
        expect(handler.needRefresh(connection, mockLog)).toBe(true)
    })

    it('returns false when connection status is ERROR regardless of nextRefreshEpochMs', () => {
        const connection = makeCustomAuthConnection({
            status: AppConnectionStatus.ERROR,
            nextRefreshEpochMs: Date.now() - 1000,
        })
        expect(handler.needRefresh(connection, mockLog)).toBe(false)
    })

    it('returns false for BASIC_AUTH type (not refreshable)', () => {
        const connection = {
            ...makeCustomAuthConnection({}),
            status: AppConnectionStatus.ACTIVE,
            value: { type: AppConnectionType.BASIC_AUTH, username: 'u', password: 'p' },
        } as unknown as AppConnection
        expect(handler.needRefresh(connection, mockLog)).toBe(false)
    })

    it('returns false for SECRET_TEXT type (not refreshable)', () => {
        const connection = {
            ...makeCustomAuthConnection({}),
            status: AppConnectionStatus.ACTIVE,
            value: { type: AppConnectionType.SECRET_TEXT, secret: 'tok' },
        } as unknown as AppConnection
        expect(handler.needRefresh(connection, mockLog)).toBe(false)
    })
})
