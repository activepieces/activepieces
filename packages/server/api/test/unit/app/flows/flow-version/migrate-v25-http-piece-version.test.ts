import {
    FlowActionType,
    flowStructureUtil,
    FlowTriggerType,
    FlowVersionState,
} from '@activepieces/shared'
import type { FlowVersion } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { migrateV25HttpPieceVersion } from '../../../../../src/app/flows/flow-version/migrations/migrate-v25-http-piece-version'

function makeFlowVersion(): FlowVersion {
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
            nextAction: {
                name: 'http_broken',
                valid: true,
                displayName: 'Send HTTP Request',
                type: FlowActionType.PIECE,
                settings: {
                    pieceName: '@activepieces/piece-http',
                    pieceVersion: '0.11.11',
                    actionName: 'send_request',
                    input: {},
                    propertySettings: {},
                },
                nextAction: {
                    name: 'http_newer',
                    valid: true,
                    displayName: 'Send HTTP Request',
                    type: FlowActionType.PIECE,
                    settings: {
                        pieceName: '@activepieces/piece-http',
                        pieceVersion: '0.11.12',
                        actionName: 'send_request',
                        input: {},
                        propertySettings: {},
                    },
                    nextAction: {
                        name: 'other_piece',
                        valid: true,
                        displayName: 'Send Message',
                        type: FlowActionType.PIECE,
                        settings: {
                            pieceName: '@activepieces/piece-slack',
                            pieceVersion: '0.11.11',
                            actionName: 'send_channel_message',
                            input: {},
                            propertySettings: {},
                        },
                    },
                },
            },
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
    it('bumps an http step pinned to 0.11.11 to 0.11.16', async () => {
        const result = await migrateV25HttpPieceVersion.migrate(makeFlowVersion())
        expect(findStepVersion(result, 'http_broken')).toBe('0.11.16')
    })

    it('leaves http steps on other versions untouched', async () => {
        const result = await migrateV25HttpPieceVersion.migrate(makeFlowVersion())
        expect(findStepVersion(result, 'http_newer')).toBe('0.11.12')
    })

    it('leaves non-http steps on 0.11.11 untouched', async () => {
        const result = await migrateV25HttpPieceVersion.migrate(makeFlowVersion())
        expect(findStepVersion(result, 'other_piece')).toBe('0.11.11')
    })

    it('bumps the schema version to 26', async () => {
        const result = await migrateV25HttpPieceVersion.migrate(makeFlowVersion())
        expect(result.schemaVersion).toBe('26')
    })
})
