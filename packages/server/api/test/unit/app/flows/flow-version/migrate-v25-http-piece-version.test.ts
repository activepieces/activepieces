import {
    FlowActionType,
    flowStructureUtil,
    FlowTriggerType,
    FlowVersionState,
} from '@activepieces/shared'
import type { FlowAction, FlowVersion } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { migrateV25HttpPieceVersion } from '../../../../../src/app/flows/flow-version/migrations/migrate-v25-http-piece-version'

function makeHttpStep({ name, pieceName, pieceVersion, nextAction }: { name: string, pieceName: string, pieceVersion: string, nextAction?: FlowAction }): FlowAction {
    return {
        name,
        valid: true,
        displayName: name,
        type: FlowActionType.PIECE,
        settings: {
            pieceName,
            pieceVersion,
            actionName: 'send_request',
            input: {},
            propertySettings: {},
        },
        nextAction,
    }
}

function makeFlowVersion(): FlowVersion {
    const steps = [
        { name: 'http_first_broken', pieceName: '@activepieces/piece-http', pieceVersion: '0.11.11' },
        { name: 'http_last_broken', pieceName: '@activepieces/piece-http', pieceVersion: '0.11.20' },
        { name: 'http_mid_broken', pieceName: '@activepieces/piece-http', pieceVersion: '0.11.16' },
        { name: 'http_before_range', pieceName: '@activepieces/piece-http', pieceVersion: '0.11.10' },
        { name: 'http_fixed', pieceName: '@activepieces/piece-http', pieceVersion: '0.11.21' },
        { name: 'other_piece', pieceName: '@activepieces/piece-slack', pieceVersion: '0.11.11' },
    ]
    const chain = steps.reduceRight<FlowAction | undefined>((nextAction, step) => makeHttpStep({ ...step, nextAction }), undefined)
    return {
        id: 'fv-1',
        created: '2024-01-01T00:00:00Z',
        updated: '2024-01-01T00:00:00Z',
        flowId: 'flow-1',
        displayName: 'Test Flow',
        trigger: {
            name: 'trigger',
            valid: true,
            displayName: 'Trigger',
            type: FlowTriggerType.EMPTY,
            settings: {},
            nextAction: chain,
        },
        updatedBy: null,
        valid: true,
        schemaVersion: '25',
        agentIds: [],
        state: FlowVersionState.DRAFT,
        connectionIds: [],
        backupFiles: null,
        notes: [],
    }
}

function findStepVersion(flowVersion: FlowVersion, name: string): string {
    const step = flowStructureUtil.getAllSteps(flowVersion.trigger).find((s) => s.name === name)
    return step?.settings.pieceVersion as string
}

describe('migrateV25HttpPieceVersion', () => {
    it.each([
        ['http_first_broken', '0.11.11'],
        ['http_mid_broken', '0.11.16'],
        ['http_last_broken', '0.11.20'],
    ])('bumps an http step pinned to a broken version to 0.11.21 (%s, %s)', async (stepName) => {
        const result = await migrateV25HttpPieceVersion.migrate(makeFlowVersion())
        expect(findStepVersion(result, stepName)).toBe('0.11.21')
    })

    it('leaves http steps below the broken range untouched', async () => {
        const result = await migrateV25HttpPieceVersion.migrate(makeFlowVersion())
        expect(findStepVersion(result, 'http_before_range')).toBe('0.11.10')
    })

    it('leaves http steps already on the fixed version untouched', async () => {
        const result = await migrateV25HttpPieceVersion.migrate(makeFlowVersion())
        expect(findStepVersion(result, 'http_fixed')).toBe('0.11.21')
    })

    it('leaves non-http steps on broken-range versions untouched', async () => {
        const result = await migrateV25HttpPieceVersion.migrate(makeFlowVersion())
        expect(findStepVersion(result, 'other_piece')).toBe('0.11.11')
    })

    it('bumps the schema version to 26', async () => {
        const result = await migrateV25HttpPieceVersion.migrate(makeFlowVersion())
        expect(result.schemaVersion).toBe('26')
    })
})
