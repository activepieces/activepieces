import { AgentPieceProps } from '@activepieces/core-piece-types'
import { describe, expect, it } from 'vitest'
import { AI_PIECE_NAME, FlowActionType, FlowTriggerType, FlowVersion, FlowVersionState, flowStructureUtil, PropertyExecutionType } from '../../src'

function flowVersionWithAgentStep(input: Record<string, unknown>): FlowVersion {
    return {
        id: 'version-1',
        created: '2026-08-19T00:00:00.000Z',
        updated: '2026-08-19T00:00:00.000Z',
        flowId: 'flow-1',
        updatedBy: '',
        displayName: 'Sort the inbox',
        agentIds: [],
        notes: [],
        valid: true,
        state: FlowVersionState.DRAFT,
        schemaVersion: null,
        connectionIds: [],
        trigger: {
            name: 'trigger',
            type: FlowTriggerType.PIECE,
            valid: true,
            displayName: 'Every hour',
            settings: {
                input: {},
                pieceName: 'schedule',
                pieceVersion: '0.0.2',
                propertySettings: {},
                triggerName: 'every_hour',
            },
            nextAction: {
                name: 'step_1',
                type: FlowActionType.PIECE,
                valid: true,
                displayName: 'Ask an agent',
                settings: {
                    input,
                    pieceName: AI_PIECE_NAME,
                    pieceVersion: '0.1.0',
                    actionName: 'run_agent',
                    propertySettings: { [AgentPieceProps.AGENT_ID]: { type: PropertyExecutionType.MANUAL } },
                },
            },
        },
    } as unknown as FlowVersion
}

describe('which agents a flow version references', () => {
    it('finds the agent a linked step runs', () => {
        const version = flowVersionWithAgentStep({ [AgentPieceProps.AGENT_ID]: 'agent-external-1', prompt: 'clear my inbox' })

        expect(flowStructureUtil.extractAgentIds(version)).toEqual(['agent-external-1'])
    })

    it('finds nothing for a step that carries its own tools', () => {
        const version = flowVersionWithAgentStep({ prompt: 'clear my inbox', agentTools: [] })

        expect(flowStructureUtil.extractAgentIds(version)).toEqual([])
    })

    it('treats a cleared picker as no reference, not as an agent named empty', () => {
        const version = flowVersionWithAgentStep({ [AgentPieceProps.AGENT_ID]: '', prompt: 'clear my inbox' })

        expect(flowStructureUtil.extractAgentIds(version)).toEqual([])
    })
})
