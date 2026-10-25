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

describe('a republish leaves a polling trigger\'s stored state untouched', () => {
    beforeEach(() => {
        mockGetPieceAndTriggerOrThrow.mockReset()
        storeEntries.clear()
    })

    it('keeps the checkpoint onEnable overwrites', async () => {
        storeEntries.set('lastPoll', OLD_CHECKPOINT)
        mockTrigger({ type: TriggerStrategy.POLLING, onEnable: async ({ store }) => {
            await store.put('lastPoll', NEW_CHECKPOINT)
        } })

        await executeHook({ hookType: TriggerHookType.ON_ENABLE, isRepublish: true })

        expect(storeEntries.get('lastPoll')).toBe(OLD_CHECKPOINT)
    })

    it('keeps the checkpoint onDisable deletes', async () => {
        storeEntries.set('_seenVideoIds', ['video-1'])
        mockTrigger({ type: TriggerStrategy.POLLING, onDisable: async ({ store }) => {
            await store.delete('_seenVideoIds')
        } })

        await executeHook({ hookType: TriggerHookType.ON_DISABLE, isRepublish: true })

        expect(storeEntries.get('_seenVideoIds')).toEqual(['video-1'])
    })

    it('keeps the checkpoint onDisable clears by writing null', async () => {
        storeEntries.set('_new_incoming_sms_trigger', { sid: 'message-1' })
        mockTrigger({
            type: TriggerStrategy.POLLING,
            onDisable: async ({ store }) => {
                await store.put('_new_incoming_sms_trigger', null)
            },
            onEnable: async ({ store }) => {
                const last = await store.get('_new_incoming_sms_trigger')
                if (last === null) {
                    await store.put('_new_incoming_sms_trigger', { sid: 'message-now' })
                }
            },
        })

        await executeHook({ hookType: TriggerHookType.ON_DISABLE, isRepublish: true })
        await executeHook({ hookType: TriggerHookType.ON_ENABLE, isRepublish: true })

        expect(storeEntries.get('_new_incoming_sms_trigger')).toEqual({ sid: 'message-1' })
    })

    it('does not let onEnable replace the checkpoint with new scan state', async () => {
        storeEntries.set('lastItem', 'checkout-1')
        mockTrigger({ type: TriggerStrategy.POLLING, onEnable: async ({ store }) => {
            await store.put('newestCheckoutScanCursor', 'checkout-99')
            await store.put('newestCheckoutScanEnabledAt', NEW_CHECKPOINT)
            await store.delete('lastItem')
        } })

        await executeHook({ hookType: TriggerHookType.ON_ENABLE, isRepublish: true })

        expect(Object.fromEntries(storeEntries)).toEqual({ lastItem: 'checkout-1' })
    })

    it('still registers the polling schedule', async () => {
        mockTrigger({ type: TriggerStrategy.POLLING, onEnable: async ({ store, setSchedule }) => {
            await store.put('lastPoll', NEW_CHECKPOINT)
            setSchedule({ cronExpression: '*/5 * * * *' })
        } })

        const response = await executeHook({ hookType: TriggerHookType.ON_ENABLE, isRepublish: true })

        expect(response).toMatchObject({ scheduleOptions: { cronExpression: '*/5 * * * *' } })
    })
})

describe('outside a republish the store behaves normally', () => {
    beforeEach(() => {
        mockGetPieceAndTriggerOrThrow.mockReset()
        storeEntries.clear()
    })

    it('lets onEnable reset the checkpoint on a fresh enable', async () => {
        storeEntries.set('lastPoll', OLD_CHECKPOINT)
        mockTrigger({ type: TriggerStrategy.POLLING, onEnable: async ({ store }) => {
            await store.put('lastPoll', NEW_CHECKPOINT)
        } })

        await executeHook({ hookType: TriggerHookType.ON_ENABLE, isRepublish: false })

        expect(storeEntries.get('lastPoll')).toBe(NEW_CHECKPOINT)
    })

    it('lets onDisable clean up when the flow is turned off', async () => {
        storeEntries.set('_seenVideoIds', ['video-1'])
        mockTrigger({ type: TriggerStrategy.POLLING, onDisable: async ({ store }) => {
            await store.delete('_seenVideoIds')
        } })

        await executeHook({ hookType: TriggerHookType.ON_DISABLE, isRepublish: false })

        expect(storeEntries.has('_seenVideoIds')).toBe(false)
    })

    it('lets a webhook trigger replace its webhook on a republish', async () => {
        storeEntries.set('webhookId', 'old-webhook')
        mockTrigger({
            type: TriggerStrategy.WEBHOOK,
            onDisable: async ({ store }) => {
                await store.delete('webhookId')
            },
            onEnable: async ({ store }) => {
                await store.put('webhookId', 'new-webhook')
            },
        })

        await executeHook({ hookType: TriggerHookType.ON_DISABLE, isRepublish: true })
        await executeHook({ hookType: TriggerHookType.ON_ENABLE, isRepublish: true })

        expect(storeEntries.get('webhookId')).toBe('new-webhook')
    })
})

function mockTrigger({ type, onEnable, onDisable }: { type: TriggerStrategy, onEnable?: (context: HookContext) => Promise<void>, onDisable?: (context: HookContext) => Promise<void> }): void {
    mockGetPieceAndTriggerOrThrow.mockResolvedValue({
        piece: { auth: undefined },
        pieceTrigger: { type, props: {}, requireAuth: false, onEnable, onDisable },
    })
}

async function executeHook({ hookType, isRepublish }: { hookType: TriggerHookType.ON_ENABLE | TriggerHookType.ON_DISABLE, isRepublish: boolean }): Promise<ExecuteTriggerResponse<TriggerHookType>> {
    const params = {
        hookType,
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
    } as unknown as ResolvedExecuteTriggerOperation<TriggerHookType>
    return triggerHelper.executeTrigger({ params, constants: EngineConstants.fromExecuteTriggerInput(params) })
}

const OLD_CHECKPOINT = 1000
const NEW_CHECKPOINT = 2000

type HookContext = {
    store: Store
    setSchedule: (request: { cronExpression: string }) => void
}
