import { Store, TriggerStrategy } from '@activepieces/pieces-framework'
import { ExecuteTriggerResponse, FlowVersionState, TriggerHookType } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGetPieceAndTriggerOrThrow, storeEntries } = vi.hoisted(() => ({
    mockGetPieceAndTriggerOrThrow: vi.fn(),
    storeEntries: new Map<string, unknown>(),
}))
vi.mock('../../src/lib/helper/piece-loader', () => ({
    pieceLoader: {
        getPieceAndTriggerOrThrow: mockGetPieceAndTriggerOrThrow,
    },
}))
vi.mock('../../src/lib/piece-context/store', () => ({
    createContextStore: (): Store => ({
        async put<T>(key: string, value: T): Promise<T> {
            storeEntries.set(key, value)
            return value
        },
        async get<T>(key: string): Promise<T | null> {
            return storeEntries.has(key) ? storeEntries.get(key) as T : null
        },
        async delete(key: string): Promise<void> {
            storeEntries.delete(key)
        },
    }),
}))

import { EngineConstants, ResolvedExecuteTriggerOperation } from '../../src/lib/handler/context/engine-constants'
import { triggerHelper } from '../../src/lib/helper/trigger-helper'

describe('ON_ENABLE on a republish', () => {
    beforeEach(() => {
        mockGetPieceAndTriggerOrThrow.mockReset()
        storeEntries.clear()
    })

    it('keeps the checkpoint a polling trigger overwrites on enable', async () => {
        storeEntries.set('lastPoll', OLD_CHECKPOINT)
        mockTrigger({ type: TriggerStrategy.POLLING, onEnable: async ({ store }) => {
            await store.put('lastPoll', NEW_CHECKPOINT)
        } })

        await executeOnEnable({ isRepublish: true })

        expect(storeEntries.get('lastPoll')).toBe(OLD_CHECKPOINT)
    })

    it('writes the checkpoint when a polling trigger has none yet', async () => {
        mockTrigger({ type: TriggerStrategy.POLLING, onEnable: async ({ store }) => {
            await store.put('lastPoll', NEW_CHECKPOINT)
        } })

        await executeOnEnable({ isRepublish: true })

        expect(storeEntries.get('lastPoll')).toBe(NEW_CHECKPOINT)
    })

    it('still clears a cache a polling trigger deletes on enable', async () => {
        storeEntries.set('lastPoll', OLD_CHECKPOINT)
        storeEntries.set('fieldsCache', ['old-field'])
        mockTrigger({ type: TriggerStrategy.POLLING, onEnable: async ({ store }) => {
            await store.delete('fieldsCache')
            await store.put('lastPoll', NEW_CHECKPOINT)
        } })

        await executeOnEnable({ isRepublish: true })

        expect(storeEntries.has('fieldsCache')).toBe(false)
        expect(storeEntries.get('lastPoll')).toBe(OLD_CHECKPOINT)
    })

    it('resets the checkpoint when it is not a republish', async () => {
        storeEntries.set('lastPoll', OLD_CHECKPOINT)
        mockTrigger({ type: TriggerStrategy.POLLING, onEnable: async ({ store }) => {
            await store.put('lastPoll', NEW_CHECKPOINT)
        } })

        await executeOnEnable({ isRepublish: false })

        expect(storeEntries.get('lastPoll')).toBe(NEW_CHECKPOINT)
    })

    it('lets a webhook trigger replace its stored webhook id', async () => {
        storeEntries.set('webhookId', 'deleted-webhook')
        mockTrigger({ type: TriggerStrategy.WEBHOOK, onEnable: async ({ store }) => {
            await store.put('webhookId', 'new-webhook')
        } })

        await executeOnEnable({ isRepublish: true })

        expect(storeEntries.get('webhookId')).toBe('new-webhook')
    })

    it('still registers the polling schedule', async () => {
        storeEntries.set('lastPoll', OLD_CHECKPOINT)
        mockTrigger({ type: TriggerStrategy.POLLING, onEnable: async ({ store, setSchedule }) => {
            await store.put('lastPoll', NEW_CHECKPOINT)
            setSchedule({ cronExpression: '*/5 * * * *' })
        } })

        const response = await executeOnEnable({ isRepublish: true })

        expect(response).toMatchObject({ scheduleOptions: { cronExpression: '*/5 * * * *' } })
    })
})

function mockTrigger({ type, onEnable }: { type: TriggerStrategy, onEnable: (context: EnableContext) => Promise<void> }): void {
    mockGetPieceAndTriggerOrThrow.mockResolvedValue({
        piece: { auth: undefined },
        pieceTrigger: { type, props: {}, requireAuth: false, onEnable },
    })
}

async function executeOnEnable({ isRepublish }: { isRepublish: boolean }): Promise<ExecuteTriggerResponse<TriggerHookType>> {
    const params = {
        hookType: TriggerHookType.ON_ENABLE,
        test: false,
        isRepublish,
        webhookUrl: 'http://127.0.0.1:3000/api/v1/webhooks/flow-1',
        flowVersion: {
            id: 'flow-version-1',
            flowId: 'flow-1',
            state: FlowVersionState.LOCKED,
            trigger: {
                name: 'trigger',
                type: 'PIECE_TRIGGER',
                valid: true,
                displayName: 'Polling trigger',
                settings: {
                    pieceName: '@activepieces/piece-under-test',
                    pieceVersion: '1.0.0',
                    triggerName: 'new_item',
                    input: {},
                    propertySettings: {},
                },
            },
        },
        projectId: 'project-1',
        platformId: 'platform-1',
        engineToken: 'engine-token',
        internalApiUrl: 'http://127.0.0.1:3000/api/',
        publicApiUrl: 'http://127.0.0.1:4200/api/',
        timeoutInSeconds: 30,
    } as unknown as ResolvedExecuteTriggerOperation<TriggerHookType.ON_ENABLE>
    return triggerHelper.executeTrigger({ params, constants: EngineConstants.fromExecuteTriggerInput(params) })
}

const OLD_CHECKPOINT = 1000
const NEW_CHECKPOINT = 2000

type EnableContext = {
    store: Store
    setSchedule: (request: { cronExpression: string }) => void
}
