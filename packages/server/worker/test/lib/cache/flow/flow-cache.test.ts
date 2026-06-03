import {
    ActivepiecesError,
    ErrorCode,
    FlowActionType,
    FlowTriggerType,
    FlowVersionState,
    LATEST_FLOW_SCHEMA_VERSION,
} from '@activepieces/shared'
import type { FlowVersion } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../../src/lib/cache/cache-paths', () => ({
    getGlobalCacheFlowsPath: () => '/tmp/flow-cache-test',
}))

vi.mock('../../../../src/lib/cache/cache-state', () => ({
    cacheState: () => ({
        getOrSetCache: async ({ installFn }: { installFn: () => Promise<string> }) => ({
            state: await installFn(),
        }),
    }),
}))

import { flowCache } from '../../../../src/lib/cache/flow/flow-cache'

function makeFlowVersion(schemaVersion: string | null): FlowVersion {
    return {
        id: 'fv-1',
        created: '2024-01-01T00:00:00Z',
        updated: '2024-01-01T00:00:00Z',
        flowId: 'flow-1',
        displayName: 'Test Flow',
        trigger: {
            name: 'trigger_1',
            valid: true,
            displayName: 'Trigger',
            lastUpdatedDate: '2024-01-01T00:00:00Z',
            type: FlowTriggerType.PIECE,
            settings: {
                pieceName: '@activepieces/piece-gmail',
                pieceVersion: '~0.1.0',
                triggerName: 'new_email',
                input: {},
                propertySettings: {},
            },
            nextAction: {
                name: 'step_1',
                valid: true,
                displayName: 'Action',
                lastUpdatedDate: '2024-01-01T00:00:00Z',
                type: FlowActionType.PIECE,
                settings: {
                    pieceName: '@activepieces/piece-slack',
                    pieceVersion: '~0.2.0',
                    actionName: 'send_message',
                    input: {},
                    propertySettings: {},
                },
            },
        },
        updatedBy: null,
        valid: true,
        schemaVersion,
        agentIds: [],
        state: FlowVersionState.LOCKED,
        connectionIds: [],
        backupFiles: null,
        notes: [],
    }
}

function makeCache(flowVersion: FlowVersion | null) {
    const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
    const apiClient = { getFlowVersion: vi.fn().mockResolvedValue(flowVersion) }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return flowCache(log as any, apiClient as any)
}

describe('flowCache.getVersion — schema-version skew guard', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns the flow version when its schemaVersion matches the worker LATEST', async () => {
        const flowVersion = makeFlowVersion(LATEST_FLOW_SCHEMA_VERSION)

        const result = await makeCache(flowVersion).getVersion({ flowVersionId: 'fv-1' })

        expect(result?.id).toBe('fv-1')
        expect(result?.schemaVersion).toBe(LATEST_FLOW_SCHEMA_VERSION)
    })

    it('throws FLOW_VERSION_SCHEMA_MISMATCH when the served schemaVersion differs from the worker LATEST', async () => {
        const staleVersion = `${Number(LATEST_FLOW_SCHEMA_VERSION) - 1}`
        const flowVersion = makeFlowVersion(staleVersion)

        await expect(makeCache(flowVersion).getVersion({ flowVersionId: 'fv-1' }))
            .rejects.toMatchObject({
                error: {
                    code: ErrorCode.FLOW_VERSION_SCHEMA_MISMATCH,
                    params: {
                        flowVersionId: 'fv-1',
                        expectedSchemaVersion: LATEST_FLOW_SCHEMA_VERSION,
                        actualSchemaVersion: staleVersion,
                    },
                },
            })
    })

    it('throws FLOW_VERSION_SCHEMA_MISMATCH (actual undefined) when schemaVersion is null', async () => {
        const flowVersion = makeFlowVersion(null)

        const error = await makeCache(flowVersion).getVersion({ flowVersionId: 'fv-1' }).catch((e: unknown) => e)

        expect(error).toBeInstanceOf(ActivepiecesError)
        expect((error as ActivepiecesError).error.code).toBe(ErrorCode.FLOW_VERSION_SCHEMA_MISMATCH)
        expect((error as ActivepiecesError).error.params).toMatchObject({ actualSchemaVersion: undefined })
    })

    it('returns null without throwing when the flow version is not found', async () => {
        const result = await makeCache(null).getVersion({ flowVersionId: 'missing' })

        expect(result).toBeNull()
    })
})
