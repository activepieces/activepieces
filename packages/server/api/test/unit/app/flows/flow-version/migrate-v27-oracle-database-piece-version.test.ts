import { readFileSync } from 'node:fs'
import path from 'node:path'
import {
    FlowActionType,
    flowStructureUtil,
    FlowTriggerType,
    FlowVersionState,
} from '@activepieces/shared'
import type { FlowAction, FlowTrigger, FlowVersion } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { migrateV27OracleDatabasePieceVersion } from '../../../../../src/app/flows/flow-version/migrations/migrate-v27-oracle-database-piece-version'

function makeActionStep({ name, pieceName, pieceVersion, nextAction }: { name: string, pieceName: string, pieceVersion: string, nextAction?: FlowAction }): FlowAction {
    return {
        name,
        valid: true,
        displayName: name,
        type: FlowActionType.PIECE,
        settings: {
            pieceName,
            pieceVersion,
            actionName: 'run_custom_sql',
            input: {},
            propertySettings: {},
        },
        nextAction,
    }
}

function makeTrigger({ pieceVersion, nextAction }: { pieceVersion: string, nextAction?: FlowAction }): FlowTrigger {
    return {
        name: 'trigger',
        valid: true,
        displayName: 'New Row',
        type: FlowTriggerType.PIECE,
        settings: {
            pieceName: ORACLE_PIECE_NAME,
            pieceVersion,
            triggerName: 'new_row',
            input: {},
            propertySettings: {},
        },
        nextAction,
    }
}

function makeFlowVersion({ triggerVersion }: { triggerVersion: string }): FlowVersion {
    const steps = [
        { name: 'oracle_first_broken', pieceName: ORACLE_PIECE_NAME, pieceVersion: '0.1.11' },
        { name: 'oracle_second_broken', pieceName: ORACLE_PIECE_NAME, pieceVersion: '0.1.12' },
        { name: 'oracle_before_broken', pieceName: ORACLE_PIECE_NAME, pieceVersion: '0.1.10' },
        { name: 'oracle_fixed', pieceName: ORACLE_PIECE_NAME, pieceVersion: '0.1.13' },
        { name: 'oracle_latest', pieceName: ORACLE_PIECE_NAME, pieceVersion: '0.1.15' },
        { name: 'other_piece', pieceName: '@activepieces/piece-slack', pieceVersion: '0.1.11' },
    ]
    const chain = steps.reduceRight<FlowAction | undefined>((nextAction, step) => makeActionStep({ ...step, nextAction }), undefined)
    return {
        id: 'fv-1',
        created: '2024-01-01T00:00:00Z',
        updated: '2024-01-01T00:00:00Z',
        flowId: 'flow-1',
        displayName: 'Test Flow',
        trigger: makeTrigger({ pieceVersion: triggerVersion, nextAction: chain }),
        updatedBy: null,
        valid: true,
        schemaVersion: '27',
        agentIds: [],
        state: FlowVersionState.DRAFT,
        connectionIds: [],
        backupFiles: null,
        notes: [],
    }
}

function findStepVersion({ flowVersion, name }: { flowVersion: FlowVersion, name: string }): string | undefined {
    const step = flowStructureUtil.getAllSteps(flowVersion.trigger).find((s) => s.name === name)
    if (step?.type !== FlowActionType.PIECE && step?.type !== FlowTriggerType.PIECE) {
        return undefined
    }
    return step.settings.pieceVersion
}

describe('migrateV27OracleDatabasePieceVersion', () => {
    it.each([
        ['oracle_first_broken'],
        ['oracle_second_broken'],
    ])('moves an oracle step pinned to a build without the forked runner to 0.1.15 (%s)', async (stepName) => {
        const result = await migrateV27OracleDatabasePieceVersion.migrate(makeFlowVersion({ triggerVersion: '0.1.13' }))
        expect(findStepVersion({ flowVersion: result, name: stepName })).toBe('0.1.15')
    })

    it('moves an oracle trigger pinned to a broken build to 0.1.15', async () => {
        const result = await migrateV27OracleDatabasePieceVersion.migrate(makeFlowVersion({ triggerVersion: '0.1.11' }))
        expect(findStepVersion({ flowVersion: result, name: 'trigger' })).toBe('0.1.15')
    })

    it.each([
        ['oracle_before_broken', '0.1.10'],
        ['oracle_fixed', '0.1.13'],
        ['oracle_latest', '0.1.15'],
    ])('leaves oracle steps on working builds untouched (%s)', async (stepName, version) => {
        const result = await migrateV27OracleDatabasePieceVersion.migrate(makeFlowVersion({ triggerVersion: '0.1.13' }))
        expect(findStepVersion({ flowVersion: result, name: stepName })).toBe(version)
    })

    it('leaves other pieces on the same version untouched', async () => {
        const result = await migrateV27OracleDatabasePieceVersion.migrate(makeFlowVersion({ triggerVersion: '0.1.13' }))
        expect(findStepVersion({ flowVersion: result, name: 'other_piece' })).toBe('0.1.11')
    })

    it('bumps the schema version to 28', async () => {
        const result = await migrateV27OracleDatabasePieceVersion.migrate(makeFlowVersion({ triggerVersion: '0.1.13' }))
        expect(result.schemaVersion).toBe('28')
    })

    it('never lets the v23 upgrade register target an oracle build without the forked runner', () => {
        const register: { pieces: Record<string, Record<string, { target: string }>> } = JSON.parse(readFileSync(path.resolve('packages/server/api/src/assets/piece-upgrade-register.json'), 'utf-8'))
        const targets = Object.values(register.pieces[ORACLE_PIECE_NAME] ?? {}).map((entry) => entry.target)
        expect(targets.length).toBeGreaterThan(0)
        expect(targets.filter((target) => ['0.1.11', '0.1.12'].includes(target))).toEqual([])
    })
})

const ORACLE_PIECE_NAME = '@activepieces/piece-oracle-database'
