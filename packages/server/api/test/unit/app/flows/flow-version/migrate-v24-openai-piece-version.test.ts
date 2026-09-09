import {
    FlowActionType,
    flowStructureUtil,
    FlowTriggerType,
    FlowVersionState,
} from '@activepieces/shared'
import type { FlowVersion } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { migrateV24OpenaiPieceVersion } from '../../../../../src/app/flows/flow-version/migrations/migrate-v24-openai-piece-version'

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
                name: 'openai_broken',
                valid: true,
                displayName: 'Extract Structured Data',
                type: FlowActionType.PIECE,
                settings: {
                    pieceName: '@activepieces/piece-openai',
                    pieceVersion: '0.10.0',
                    actionName: 'extract-structured-data',
                    input: {},
                    propertySettings: {},
                },
                nextAction: {
                    name: 'openai_newer',
                    valid: true,
                    displayName: 'Ask ChatGPT',
                    type: FlowActionType.PIECE,
                    settings: {
                        pieceName: '@activepieces/piece-openai',
                        pieceVersion: '0.10.5',
                        actionName: 'ask_chatgpt',
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
                            pieceVersion: '0.10.0',
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
        schemaVersion: '24',
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

describe('migrateV24OpenaiPieceVersion', () => {
    it('bumps an openai step pinned to the broken 0.10.0 bundle to 0.10.1', async () => {
        const result = await migrateV24OpenaiPieceVersion.migrate(makeFlowVersion())
        expect(findStepVersion(result, 'openai_broken')).toBe('0.10.1')
    })

    it('leaves openai steps on other versions untouched', async () => {
        const result = await migrateV24OpenaiPieceVersion.migrate(makeFlowVersion())
        expect(findStepVersion(result, 'openai_newer')).toBe('0.10.5')
    })

    it('leaves non-openai steps on 0.10.0 untouched', async () => {
        const result = await migrateV24OpenaiPieceVersion.migrate(makeFlowVersion())
        expect(findStepVersion(result, 'other_piece')).toBe('0.10.0')
    })

    it('bumps the schema version to 25', async () => {
        const result = await migrateV24OpenaiPieceVersion.migrate(makeFlowVersion())
        expect(result.schemaVersion).toBe('25')
    })
})
