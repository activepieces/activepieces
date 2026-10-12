import { EngineResponseStatus, FlowTriggerType, FlowVersion, FlowVersionState, LATEST_FLOW_SCHEMA_VERSION, TriggerRunStatus, WorkerToApiContract } from '@activepieces/shared'
import { formatPieceError } from '@activepieces/core-utils'
import { describe, expect, it, vi } from 'vitest'
import { recordTriggerRun } from '../../../../src/lib/execute/utils/trigger-run-recorder'

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

const log = { warn: vi.fn() } as unknown as Parameters<typeof recordTriggerRun>[0]['log']

describe('recordTriggerRun', () => {
    it('maps OK to COMPLETED', async () => {
        const recordTriggerRunRpc = vi.fn(async () => undefined)
        const apiClient = { recordTriggerRun: recordTriggerRunRpc } as unknown as WorkerToApiContract

        await recordTriggerRun({ apiClient, log, flowVersion: buildPieceFlowVersion('@activepieces/piece-slack'), platformId: 'p1', status: EngineResponseStatus.OK })

        expect(recordTriggerRunRpc).toHaveBeenCalledWith({ platformId: 'p1', pieceName: '@activepieces/piece-slack', status: TriggerRunStatus.COMPLETED })
    })

    it('maps non-OK statuses to FAILED', async () => {
        const recordTriggerRunRpc = vi.fn(async () => undefined)
        const apiClient = { recordTriggerRun: recordTriggerRunRpc } as unknown as WorkerToApiContract

        await recordTriggerRun({ apiClient, log, flowVersion: buildPieceFlowVersion('@activepieces/piece-slack'), platformId: 'p1', status: EngineResponseStatus.INTERNAL_ERROR })

        expect(recordTriggerRunRpc).toHaveBeenCalledWith({ platformId: 'p1', pieceName: '@activepieces/piece-slack', status: TriggerRunStatus.FAILED })
    })

    it('skips non-piece triggers', async () => {
        const recordTriggerRunRpc = vi.fn(async () => undefined)
        const apiClient = { recordTriggerRun: recordTriggerRunRpc } as unknown as WorkerToApiContract
        const emptyTriggerFlowVersion = { ...buildPieceFlowVersion('@activepieces/piece-slack'), trigger: { type: FlowTriggerType.EMPTY, settings: {} } } as unknown as FlowVersion

        await recordTriggerRun({ apiClient, log, flowVersion: emptyTriggerFlowVersion, platformId: 'p1', status: EngineResponseStatus.OK })

        expect(recordTriggerRunRpc).not.toHaveBeenCalled()
    })

    it('never throws when the rpc fails', async () => {
        const recordTriggerRunRpc = vi.fn(async () => {
            throw new Error('rpc down')
        })
        const apiClient = { recordTriggerRun: recordTriggerRunRpc } as unknown as WorkerToApiContract

        await expect(recordTriggerRun({ apiClient, log, flowVersion: buildPieceFlowVersion('@activepieces/piece-slack'), platformId: 'p1', status: EngineResponseStatus.OK })).resolves.toBeUndefined()
    })

    it('logs only the failure message with the flow id, never the raw error', async () => {
        const apiClient = { recordTriggerRun: vi.fn(async () => undefined) } as unknown as WorkerToApiContract
        const engineError = JSON.stringify(formatPieceError(new Error('Webhook authentication failed'), { raw: 'headers: { Authorization: Bearer SECRET123 }' }))

        await recordTriggerRun({ apiClient, log, flowVersion: buildPieceFlowVersion('@activepieces/piece-webhook'), platformId: 'p1', status: EngineResponseStatus.USER_FAILURE, error: engineError })

        expect(log.warn).toHaveBeenCalledWith(expect.objectContaining({ error: 'Webhook authentication failed', flow: { id: 'flow1' }, status: EngineResponseStatus.USER_FAILURE }), 'Trigger run did not complete successfully')
        expect(JSON.stringify(vi.mocked(log.warn).mock.calls)).not.toContain('SECRET123')
    })
})
