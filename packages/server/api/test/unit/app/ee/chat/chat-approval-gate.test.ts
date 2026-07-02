import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockPutIfAbsent, mockGet, mockDelete, mockPublish, mockCreateSubscriber } = vi.hoisted(() => ({
    mockPutIfAbsent: vi.fn(),
    mockGet: vi.fn(),
    mockDelete: vi.fn().mockResolvedValue(undefined),
    mockPublish: vi.fn().mockResolvedValue(undefined),
    mockCreateSubscriber: vi.fn(),
}))

vi.mock('../../../../../src/app/database/redis-connections', () => ({
    distributedStore: {
        putIfAbsent: mockPutIfAbsent,
        get: mockGet,
        delete: mockDelete,
        put: vi.fn().mockResolvedValue(undefined),
    },
    redisConnections: {
        create: mockCreateSubscriber,
    },
}))

vi.mock('../../../../../src/app/helper/pubsub', () => ({
    pubsub: {
        publish: mockPublish,
    },
}))

async function resolveGate(input: { gateId: string, approved: boolean, payload?: Record<string, unknown> }): Promise<void> {
    const { chatApprovalGate } = await import('../../../../../src/app/ee/chat/chat-approval-gate')
    await chatApprovalGate.resolveGate(input)
}

async function waitForDecision(input: { gateId: string, timeoutMs: number }): Promise<unknown> {
    const { chatApprovalGate } = await import('../../../../../src/app/ee/chat/chat-approval-gate')
    return chatApprovalGate.waitForDecision(input)
}

describe('chatApprovalGate.resolveGate — first decision wins (BE-15)', () => {
    beforeEach(() => {
        mockPutIfAbsent.mockReset()
        mockGet.mockReset()
        mockDelete.mockReset().mockResolvedValue(undefined)
        mockPublish.mockReset().mockResolvedValue(undefined)
    })

    it('publishes the decision and cleans pending-gate keys on the first resolve', async () => {
        mockPutIfAbsent.mockResolvedValue(true)
        mockGet.mockResolvedValue('conv-1')

        await resolveGate({ gateId: 'g1', approved: true, payload: { tweak: 1 } })

        expect(mockPutIfAbsent).toHaveBeenCalledTimes(1)
        const [key, value, ttl] = mockPutIfAbsent.mock.calls[0]
        expect(key).toBe('tool-approval-decision:g1')
        expect(value).toEqual({ approved: true, payload: { tweak: 1 } })
        expect(ttl).toBe(15 * 60)

        expect(mockPublish).toHaveBeenCalledTimes(1)
        const [channel, message] = mockPublish.mock.calls[0]
        expect(channel).toBe('tool-approval:g1')
        expect(JSON.parse(message)).toEqual({ approved: true, payload: { tweak: 1 } })

        // both pending-gate index keys are removed
        expect(mockDelete).toHaveBeenCalledWith('chat-pending-gate:conv-1')
        expect(mockDelete).toHaveBeenCalledWith('chat-pending-gate:gate:g1')
    })

    it('ignores a duplicate resolve — does not publish or delete pending keys again', async () => {
        mockPutIfAbsent.mockResolvedValue(false)

        await resolveGate({ gateId: 'g1', approved: false })

        // The pending-gate lookup (binding approvedInput to the decision) runs before the
        // putIfAbsent race is decided, so reads are expected — but a losing resolve must
        // never publish or clear the pending keys.
        expect(mockPutIfAbsent).toHaveBeenCalledTimes(1)
        expect(mockPublish).not.toHaveBeenCalled()
        expect(mockDelete).not.toHaveBeenCalled()
    })
})

describe('chatApprovalGate.waitForDecision — race-free subscribe-then-check (BE-15)', () => {
    beforeEach(() => {
        mockGet.mockReset()
        mockCreateSubscriber.mockReset()
    })

    it('returns a decision that already exists at subscribe time (no lost publish)', async () => {
        const subscriber = {
            on: vi.fn(),
            subscribe: vi.fn().mockResolvedValue(undefined),
            unsubscribe: vi.fn().mockResolvedValue(undefined),
            quit: vi.fn().mockResolvedValue(undefined),
        }
        mockCreateSubscriber.mockResolvedValue(subscriber)
        mockGet.mockResolvedValue({ approved: true, payload: { picked: 'conn_x' } })

        const decision = await waitForDecision({ gateId: 'g2', timeoutMs: 1_000 })

        expect(subscriber.subscribe).toHaveBeenCalledWith('tool-approval:g2')
        expect(decision).toEqual({ approved: true, payload: { picked: 'conn_x' } })
        // cleans up the dedicated subscriber connection
        expect(subscriber.unsubscribe).toHaveBeenCalledWith('tool-approval:g2')
        expect(subscriber.quit).toHaveBeenCalled()
    })
})
