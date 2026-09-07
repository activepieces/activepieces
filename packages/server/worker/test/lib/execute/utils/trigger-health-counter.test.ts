import { EngineResponseStatus, FlowTriggerType, FlowVersion, FlowVersionState, LATEST_FLOW_SCHEMA_VERSION, TriggerRunStatus, WorkerToApiContract } from '@activepieces/shared'
import { describe, expect, it, vi } from 'vitest'
import { bumpTriggerHealthCounter } from '../../../../src/lib/execute/utils/trigger-health-counter'

function buildPieceFlowVersion(pieceName: string): FlowVersion {
    return {
        id: 'fv1',
        created: '2026-01-01T00:00:00.000Z',
        updated: '2026-01-01T00:00:00.000Z',
        flowId: 'flow1',
        displayName: 'Test Flow',
        updatedBy: null,
        valid: true,
        schemaVersion: LATEST_FLOW_SCHEMA_VERSION,
        agentIds: [],
        state: FlowVersionState.LOCKED,
        connectionIds: [],
        backupFiles: null,
        notes: [],
        trigger: {
            name: 'trigger',
            type: FlowTriggerType.PIECE,
            displayName: 'Trigger',
            valid: true,
            lastUpdatedDate: '2026-01-01T00:00:00.000Z',
            settings: {
                pieceName,
                pieceVersion: '0.0.1',
                propertySettings: {},
                input: {},
            },
        },
    } as unknown as FlowVersion
}

const log = { warn: vi.fn() } as unknown as Parameters<typeof bumpTriggerHealthCounter>[0]['log']

describe('bumpTriggerHealthCounter', () => {
    it('maps OK to COMPLETED', async () => {
        const bumpTriggerHealthCounterRpc = vi.fn(async () => undefined)
        const apiClient = { recordTriggerRun: bumpTriggerHealthCounterRpc } as unknown as WorkerToApiContract

        await bumpTriggerHealthCounter({ apiClient, log, flowVersion: buildPieceFlowVersion('@activepieces/piece-slack'), platformId: 'p1', status: EngineResponseStatus.OK })

        expect(bumpTriggerHealthCounterRpc).toHaveBeenCalledWith({ platformId: 'p1', pieceName: '@activepieces/piece-slack', status: TriggerRunStatus.COMPLETED })
    })

    it('maps non-OK statuses to FAILED', async () => {
        const bumpTriggerHealthCounterRpc = vi.fn(async () => undefined)
        const apiClient = { recordTriggerRun: bumpTriggerHealthCounterRpc } as unknown as WorkerToApiContract

        await bumpTriggerHealthCounter({ apiClient, log, flowVersion: buildPieceFlowVersion('@activepieces/piece-slack'), platformId: 'p1', status: EngineResponseStatus.INTERNAL_ERROR })

        expect(bumpTriggerHealthCounterRpc).toHaveBeenCalledWith({ platformId: 'p1', pieceName: '@activepieces/piece-slack', status: TriggerRunStatus.FAILED })
    })

    it('skips non-piece triggers', async () => {
        const bumpTriggerHealthCounterRpc = vi.fn(async () => undefined)
        const apiClient = { recordTriggerRun: bumpTriggerHealthCounterRpc } as unknown as WorkerToApiContract
        const emptyTriggerFlowVersion = { ...buildPieceFlowVersion('@activepieces/piece-slack'), trigger: { type: FlowTriggerType.EMPTY, settings: {} } } as unknown as FlowVersion

        await bumpTriggerHealthCounter({ apiClient, log, flowVersion: emptyTriggerFlowVersion, platformId: 'p1', status: EngineResponseStatus.OK })

        expect(bumpTriggerHealthCounterRpc).not.toHaveBeenCalled()
    })

    it('never throws when the rpc fails', async () => {
        const bumpTriggerHealthCounterRpc = vi.fn(async () => {
            throw new Error('rpc down')
        })
        const apiClient = { recordTriggerRun: bumpTriggerHealthCounterRpc } as unknown as WorkerToApiContract

        await expect(bumpTriggerHealthCounter({ apiClient, log, flowVersion: buildPieceFlowVersion('@activepieces/piece-slack'), platformId: 'p1', status: EngineResponseStatus.OK })).resolves.toBeUndefined()
    })
})
