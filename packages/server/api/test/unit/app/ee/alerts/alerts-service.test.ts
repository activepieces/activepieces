import { FlowTriggerType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import Redis from 'ioredis'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { fakeRedis, mockSendIssueCreatedNotification } = vi.hoisted(() => {
    const expiresAtByKey = new Map<string, number>()
    return {
        mockSendIssueCreatedNotification: vi.fn(),
        fakeRedis: {
            expiresAtByKey,
            set: async (key: string, _value: string, _ex: string, seconds: number, nx?: string) => {
                const expiresAt = expiresAtByKey.get(key)
                if (nx === 'NX' && expiresAt !== undefined && Date.now() < expiresAt) {
                    return null
                }
                expiresAtByKey.set(key, Date.now() + seconds * 1000)
                return 'OK'
            },
        },
    }
})

vi.mock('../../../../../src/app/database/redis-connections', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../../../../src/app/database/redis-connections')>()
    const { distributedStoreFactory } = await import('../../../../../src/app/database/redis/distributed-store-factory')
    return {
        ...actual,
        distributedStore: distributedStoreFactory(async () => fakeRedis as unknown as Redis),
    }
})

vi.mock('../../../../../src/app/project/project-service', () => ({
    projectService: () => ({
        getOneOrThrow: async () => ({ id: 'project-1', platformId: 'platform-1', displayName: 'Project', notifyFlowOwnerOnFailure: false }),
    }),
}))

vi.mock('../../../../../src/app/flows/flow-version/flow-version.service', () => ({
    flowVersionService: () => ({
        getOneOrThrow: async () => ({
            id: 'flow-version-1',
            displayName: 'Failing flow',
            trigger: { name: 'trigger', type: FlowTriggerType.EMPTY, displayName: 'Trigger', settings: {}, valid: true },
        }),
    }),
}))

vi.mock('../../../../../src/app/helper/domain-helper', () => ({
    domainHelper: {
        getInternalUrl: async ({ path }: { path: string }) => `https://cloud.test/${path}`,
    },
}))

vi.mock('../../../../../src/app/ee/helper/email/email-service', () => ({
    emailService: () => ({
        sendIssueCreatedNotification: mockSendIssueCreatedNotification,
    }),
}))

import { alertsService } from '../../../../../src/app/ee/alerts/alerts-service'

const log = { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() } as unknown as FastifyBaseLogger
const HOUR_IN_MS = 60 * 60 * 1000
const START = new Date('2026-09-01T00:00:00.000Z').getTime()

async function failAtHour(hour: number): Promise<void> {
    vi.setSystemTime(START + hour * HOUR_IN_MS)
    await alertsService(log).sendAlertOnRunFinish({
        issueToAlert: {
            flowVersionId: 'flow-version-1',
            projectId: 'project-1',
            flowId: 'flow-1',
            created: new Date().toISOString(),
        },
        flowRunId: `run-${hour}`,
        failedStep: { name: 'step_1', displayName: 'Step 1', message: 'Connection expired' },
    })
}

function alertedRuns(): string[] {
    return mockSendIssueCreatedNotification.mock.calls.map(([params]) => params.flowRunId)
}

describe('alertsService.sendAlertOnRunFinish', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        fakeRedis.expiresAtByKey.clear()
        mockSendIssueCreatedNotification.mockReset()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('sends one alert per day while a flow keeps failing every hour', async () => {
        for (let hour = 0; hour < 48; hour++) {
            await failAtHour(hour)
        }

        expect(alertedRuns()).toEqual(['run-0', 'run-24'])
    })

    it('alerts again when a flow fails after a quiet day', async () => {
        await failAtHour(0)
        await failAtHour(30)

        expect(alertedRuns()).toEqual(['run-0', 'run-30'])
    })
})
