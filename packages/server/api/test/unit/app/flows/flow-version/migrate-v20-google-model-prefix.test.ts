import {
    AgentPieceProps,
    FlowActionType,
    flowStructureUtil,
    FlowTriggerType,
    FlowVersionState,
} from '@activepieces/shared'
import type { FlowVersion } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { migrateV20GoogleModelPrefix } from '../../../../../src/app/flows/flow-version/migrations/migrate-v20-google-model-prefix'

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
                name: 'ask_ai',
                valid: true,
                displayName: 'Ask AI',
                type: FlowActionType.PIECE,
                settings: {
                    pieceName: '@activepieces/piece-ai',
                    pieceVersion: '0.1.0',
                    actionName: 'askAi',
                    input: {
                        provider: 'GOOGLE',
                        model: 'models/gemini-2.5-flash',
                    },
                    propertySettings: {},
                },
                nextAction: {
                    name: 'run_agent',
                    valid: true,
                    displayName: 'Run Agent',
                    type: FlowActionType.PIECE,
                    settings: {
                        pieceName: '@activepieces/piece-ai',
                        pieceVersion: '0.1.0',
                        actionName: 'run_agent',
                        input: {
                            [AgentPieceProps.AI_PROVIDER_MODEL]: {
                                provider: 'GOOGLE',
                                model: 'models/gemini-2.5-pro',
                            },
                        },
                        propertySettings: {},
                    },
                    nextAction: {
                        name: 'run_agent_managed',
                        valid: true,
                        displayName: 'Run Agent Managed',
                        type: FlowActionType.PIECE,
                        settings: {
                            pieceName: '@activepieces/piece-ai',
                            pieceVersion: '0.1.0',
                            actionName: 'run_agent',
                            input: {
                                [AgentPieceProps.AI_PROVIDER_MODEL]: {
                                    provider: 'ACTIVEPIECES',
                                    model: 'google/gemini-2.5-flash',
                                },
                            },
                            propertySettings: {},
                        },
                    },
                },
            },
        },
        updatedBy: null,
        valid: true,
        schemaVersion: '20',
        agentIds: [],
        state: FlowVersionState.DRAFT,
        connectionIds: [],
        backupFiles: null,
        notes: [],
    }
}

function findStep(flowVersion: FlowVersion, name: string): Record<string, unknown> {
    const step = flowStructureUtil.getAllSteps(flowVersion.trigger).find((s) => s.name === name)
    return step?.settings.input as Record<string, unknown>
}

describe('migrateV20GoogleModelPrefix', () => {
    it('strips the models/ prefix from an askAi Google model id', async () => {
        const result = await migrateV20GoogleModelPrefix.migrate(makeFlowVersion())
        expect(findStep(result, 'ask_ai').model).toBe('gemini-2.5-flash')
    })

    it('strips the models/ prefix from a run_agent aiProviderModel.model', async () => {
        const result = await migrateV20GoogleModelPrefix.migrate(makeFlowVersion())
        const aiProviderModel = findStep(result, 'run_agent')[AgentPieceProps.AI_PROVIDER_MODEL] as Record<string, unknown>
        expect(aiProviderModel.model).toBe('gemini-2.5-pro')
    })

    it('leaves a non-prefixed managed model id untouched', async () => {
        const result = await migrateV20GoogleModelPrefix.migrate(makeFlowVersion())
        const aiProviderModel = findStep(result, 'run_agent_managed')[AgentPieceProps.AI_PROVIDER_MODEL] as Record<string, unknown>
        expect(aiProviderModel.model).toBe('google/gemini-2.5-flash')
    })

    it('bumps the schema version to 21', async () => {
        const result = await migrateV20GoogleModelPrefix.migrate(makeFlowVersion())
        expect(result.schemaVersion).toBe('21')
    })
})
