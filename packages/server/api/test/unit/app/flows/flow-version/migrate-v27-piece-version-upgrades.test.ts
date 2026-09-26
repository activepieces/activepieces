import {
    FlowActionType,
    flowStructureUtil,
    FlowTriggerType,
    FlowVersionState,
} from '@activepieces/shared'
import type { FlowAction, FlowTrigger, FlowVersion } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { migrateV27PieceVersionUpgrades } from '../../../../../src/app/flows/flow-version/migrations/migrate-v27-piece-version-upgrades'

function makePieceStep({ name, pieceName, pieceVersion, actionName = 'send_channel_message', input = {}, nextAction }: { name: string, pieceName: string, pieceVersion: string, actionName?: string, input?: Record<string, unknown>, nextAction?: FlowAction }): FlowAction {
    return {
        name,
        valid: true,
        displayName: name,
        type: FlowActionType.PIECE,
        settings: {
            pieceName,
            pieceVersion,
            actionName,
            input,
            propertySettings: {},
        },
        nextAction,
    }
}

function makePieceTrigger({ name, pieceName, pieceVersion, triggerName = 'new_message' }: { name: string, pieceName: string, pieceVersion: string, triggerName?: string }): FlowTrigger {
    return {
        name,
        valid: true,
        displayName: name,
        type: FlowTriggerType.PIECE,
        settings: {
            pieceName,
            pieceVersion,
            triggerName,
            input: {},
            propertySettings: {},
        },
    }
}

function makeFlowVersion({ trigger }: { trigger: FlowTrigger }): FlowVersion {
    const actions = [
        { name: 'http_pre_fix_8', pieceName: '@activepieces/piece-http', pieceVersion: '0.11.8' },
        { name: 'http_pre_fix_9', pieceName: '@activepieces/piece-http', pieceVersion: '0.11.9' },
        { name: 'http_pre_fix_10', pieceName: '@activepieces/piece-http', pieceVersion: '0.11.10' },
        { name: 'http_pre_fix_min', pieceName: '@activepieces/piece-http', pieceVersion: '0.8.4' },
        { name: 'http_uncovered', pieceName: '@activepieces/piece-http', pieceVersion: '0.10.0' },
        { name: 'http_fixed', pieceName: '@activepieces/piece-http', pieceVersion: '0.11.21' },
        {
            name: 'http_get_with_body',
            pieceName: '@activepieces/piece-http',
            pieceVersion: '0.11.8',
            actionName: 'send_request',
            input: { method: 'GET', body: { foo: 'bar' } },
        },
        {
            name: 'http_get_with_empty_body',
            pieceName: '@activepieces/piece-http',
            pieceVersion: '0.11.8',
            actionName: 'send_request',
            input: { method: 'GET', body: {} },
        },
        {
            name: 'http_post_with_body',
            pieceName: '@activepieces/piece-http',
            pieceVersion: '0.11.8',
            actionName: 'send_request',
            input: { method: 'POST', body: { foo: 'bar' } },
        },
        {
            name: 'http_dynamic_method_with_body',
            pieceName: '@activepieces/piece-http',
            pieceVersion: '0.11.8',
            actionName: 'send_request',
            input: { method: '{{ trigger.method }}', body: { foo: 'bar' } },
        },
        {
            name: 'http_dynamic_method_no_body',
            pieceName: '@activepieces/piece-http',
            pieceVersion: '0.11.8',
            actionName: 'send_request',
            input: { method: '{{ trigger.method }}', body: {} },
        },
        { name: 'slack_150_action', pieceName: '@activepieces/piece-slack', pieceVersion: '0.15.0' },
        { name: 'slack_163_action', pieceName: '@activepieces/piece-slack', pieceVersion: '0.16.3' },
        { name: 'slack_126_action', pieceName: '@activepieces/piece-slack', pieceVersion: '0.12.6' },
        { name: 'slack_fixed_action', pieceName: '@activepieces/piece-slack', pieceVersion: '0.17.9' },
        { name: 'other_piece', pieceName: '@activepieces/piece-gmail', pieceVersion: '0.12.4' },
    ]
    const chain = actions.reduceRight<FlowAction | undefined>((nextAction, step) => makePieceStep({ ...step, nextAction }), undefined)
    return {
        id: 'fv-1',
        created: '2024-01-01T00:00:00Z',
        updated: '2024-01-01T00:00:00Z',
        flowId: 'flow-1',
        displayName: 'Test Flow',
        trigger: { ...trigger, nextAction: chain },
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

function findStepVersion(flowVersion: FlowVersion, name: string): string {
    const step = flowStructureUtil.getAllSteps(flowVersion.trigger).find((s) => s.name === name)
    return step?.settings.pieceVersion as string
}

describe('migrateV27PieceVersionUpgrades', () => {
    it.each([
        ['http_pre_fix_8', '0.11.21'],
        ['http_pre_fix_9', '0.11.21'],
        ['http_pre_fix_10', '0.11.21'],
        ['http_pre_fix_min', '0.11.21'],
    ])('bumps a covered http pre-fix version to 0.11.21 (%s -> %s)', async (stepName, expected) => {
        const trigger = makePieceTrigger({ name: 'trigger', pieceName: '@activepieces/piece-schedule', pieceVersion: '0.1.0' })
        const result = await migrateV27PieceVersionUpgrades.migrate(makeFlowVersion({ trigger }))
        expect(findStepVersion(result, stepName)).toBe(expected)
    })

    it.each([
        ['slack_150_action', '0.17.9'],
        ['slack_163_action', '0.17.9'],
    ])('bumps a covered slack action version to 0.17.9 (%s -> %s)', async (stepName, expected) => {
        const trigger = makePieceTrigger({ name: 'trigger', pieceName: '@activepieces/piece-schedule', pieceVersion: '0.1.0' })
        const result = await migrateV27PieceVersionUpgrades.migrate(makeFlowVersion({ trigger }))
        expect(findStepVersion(result, stepName)).toBe(expected)
    })

    it.each([
        ['0.15.0'],
        ['0.16.0'],
        ['0.16.3'],
        ['0.16.4'],
    ])('bumps a covered slack trigger version to 0.17.9 (from %s)', async (sourceVersion) => {
        const trigger = makePieceTrigger({ name: 'slack_trigger', pieceName: '@activepieces/piece-slack', pieceVersion: sourceVersion })
        const result = await migrateV27PieceVersionUpgrades.migrate(makeFlowVersion({ trigger }))
        expect(findStepVersion(result, 'slack_trigger')).toBe('0.17.9')
    })

    it('leaves slack trigger on 0.12.6 untouched (excluded from map)', async () => {
        const trigger = makePieceTrigger({ name: 'slack_trigger', pieceName: '@activepieces/piece-slack', pieceVersion: '0.12.6' })
        const result = await migrateV27PieceVersionUpgrades.migrate(makeFlowVersion({ trigger }))
        expect(findStepVersion(result, 'slack_trigger')).toBe('0.12.6')
    })

    it('leaves http versions not in the upgrade map untouched (0.10.0 had unsafeSteps in the old register)', async () => {
        const trigger = makePieceTrigger({ name: 'trigger', pieceName: '@activepieces/piece-schedule', pieceVersion: '0.1.0' })
        const result = await migrateV27PieceVersionUpgrades.migrate(makeFlowVersion({ trigger }))
        expect(findStepVersion(result, 'http_uncovered')).toBe('0.10.0')
    })

    it('leaves slack@0.12.6 action untouched (auth shape and new_mention.user prop change)', async () => {
        const trigger = makePieceTrigger({ name: 'trigger', pieceName: '@activepieces/piece-schedule', pieceVersion: '0.1.0' })
        const result = await migrateV27PieceVersionUpgrades.migrate(makeFlowVersion({ trigger }))
        expect(findStepVersion(result, 'slack_126_action')).toBe('0.12.6')
    })

    it('leaves http send_request GET-with-body untouched (target 0.11.21 drops the body)', async () => {
        const trigger = makePieceTrigger({ name: 'trigger', pieceName: '@activepieces/piece-schedule', pieceVersion: '0.1.0' })
        const result = await migrateV27PieceVersionUpgrades.migrate(makeFlowVersion({ trigger }))
        expect(findStepVersion(result, 'http_get_with_body')).toBe('0.11.8')
    })

    it('still upgrades http send_request GET with empty body', async () => {
        const trigger = makePieceTrigger({ name: 'trigger', pieceName: '@activepieces/piece-schedule', pieceVersion: '0.1.0' })
        const result = await migrateV27PieceVersionUpgrades.migrate(makeFlowVersion({ trigger }))
        expect(findStepVersion(result, 'http_get_with_empty_body')).toBe('0.11.21')
    })

    it('still upgrades http send_request POST with body (guard is GET-specific)', async () => {
        const trigger = makePieceTrigger({ name: 'trigger', pieceName: '@activepieces/piece-schedule', pieceVersion: '0.1.0' })
        const result = await migrateV27PieceVersionUpgrades.migrate(makeFlowVersion({ trigger }))
        expect(findStepVersion(result, 'http_post_with_body')).toBe('0.11.21')
    })

    it('leaves http send_request with a dynamic method + non-empty body untouched (could resolve to GET at runtime)', async () => {
        const trigger = makePieceTrigger({ name: 'trigger', pieceName: '@activepieces/piece-schedule', pieceVersion: '0.1.0' })
        const result = await migrateV27PieceVersionUpgrades.migrate(makeFlowVersion({ trigger }))
        expect(findStepVersion(result, 'http_dynamic_method_with_body')).toBe('0.11.8')
    })

    it('still upgrades http send_request with a dynamic method but empty body (guard only triggers on GET-with-body)', async () => {
        const trigger = makePieceTrigger({ name: 'trigger', pieceName: '@activepieces/piece-schedule', pieceVersion: '0.1.0' })
        const result = await migrateV27PieceVersionUpgrades.migrate(makeFlowVersion({ trigger }))
        expect(findStepVersion(result, 'http_dynamic_method_no_body')).toBe('0.11.21')
    })

    it('leaves fixed versions and unrelated pieces untouched', async () => {
        const trigger = makePieceTrigger({ name: 'trigger', pieceName: '@activepieces/piece-schedule', pieceVersion: '0.1.0' })
        const result = await migrateV27PieceVersionUpgrades.migrate(makeFlowVersion({ trigger }))
        expect(findStepVersion(result, 'http_fixed')).toBe('0.11.21')
        expect(findStepVersion(result, 'slack_fixed_action')).toBe('0.17.9')
        expect(findStepVersion(result, 'other_piece')).toBe('0.12.4')
    })

    it('bumps the schema version to 28', async () => {
        const trigger = makePieceTrigger({ name: 'trigger', pieceName: '@activepieces/piece-schedule', pieceVersion: '0.1.0' })
        const result = await migrateV27PieceVersionUpgrades.migrate(makeFlowVersion({ trigger }))
        expect(result.schemaVersion).toBe('28')
    })
})
