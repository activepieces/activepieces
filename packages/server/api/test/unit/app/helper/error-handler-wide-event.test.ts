import { ActivepiecesError, ErrorCode } from '@activepieces/core-utils'
import { StatusCodes } from 'http-status-codes'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockSet } = vi.hoisted(() => ({ mockSet: vi.fn() }))

vi.mock('@activepieces/server-utils', async (importOriginal) => ({
    ...await importOriginal<typeof import('@activepieces/server-utils')>(),
    wideEvent: { set: mockSet },
}))

import { enrichWideEventWithError } from '../../../../src/app/helper/error-handler'

function loggedStatus(): unknown {
    return mockSet.mock.calls[0][0].status
}

describe('enrichWideEventWithError — a handled 4xx must not log as a 500', () => {
    beforeEach(() => {
        mockSet.mockClear()
    })

    it('records a quota rejection as payment required, not a server error', () => {
        enrichWideEventWithError(new ActivepiecesError({ code: ErrorCode.QUOTA_EXCEEDED, params: { metric: 'credits', quota: 0 } }))

        expect(loggedStatus()).toBe(StatusCodes.PAYMENT_REQUIRED)
    })

    it('records a missing entity as not found', () => {
        enrichWideEventWithError(new ActivepiecesError({ code: ErrorCode.ENTITY_NOT_FOUND, params: { entityType: 'AIProvider' } }))

        expect(loggedStatus()).toBe(StatusCodes.NOT_FOUND)
    })

    it('still records a genuine server fault as a 500', () => {
        enrichWideEventWithError(new Error('Cannot read properties of undefined'))

        expect(loggedStatus()).toBe(StatusCodes.INTERNAL_SERVER_ERROR)
    })
})
