import { AgentMcpTool, AgentPieceTool, AgentToolType, FlowAction, FlowActionType, flowStructureUtil, McpAuthType, McpProtocol, FlowTriggerType, FlowVersion, FlowVersionState, PieceAction } from '../../src'

function pieceStep({ name, auth, nextAction }: { name: string, auth?: string, nextAction?: FlowAction }): PieceAction {
    return {
        name,
        type: FlowActionType.PIECE,
        valid: true,
        displayName: name,
        lastUpdatedDate: '2026-10-20T00:00:00.000Z',
        settings: {
            pieceName: '@activepieces/piece-slack',
            pieceVersion: '0.0.1',
            actionName: 'send_message',
            input: { auth, channel: 'general' },
            propertySettings: {},
        },
        nextAction,
    }
}

function flowWith(head: FlowAction): FlowVersion {
    return {
        id: 'version',
        created: '2026-10-20T00:00:00.000Z',
        updated: '2026-10-20T00:00:00.000Z',
        flowId: 'flow',
        displayName: 'Flow',
        updatedBy: null,
        valid: true,
        schemaVersion: null,
        agentIds: [],
        state: FlowVersionState.DRAFT,
        connectionIds: [],
        backupFiles: null,
        notes: [],
        trigger: {
            name: 'trigger',
            type: FlowTriggerType.EMPTY,
            valid: true,
            displayName: 'Trigger',
            lastUpdatedDate: '2026-10-20T00:00:00.000Z',
            settings: {},
            nextAction: head,
        },
    }
}

function authOf(flowVersion: FlowVersion, stepName: string): unknown {
    return flowStructureUtil.getStepOrThrow(stepName, flowVersion.trigger).settings.input.auth
}

describe('flowStructureUtil.replaceConnection', () => {
    it('points every step that uses the source connection at the target connection and leaves the rest alone', () => {
        const flowVersion = flowWith(pieceStep({
            name: 'step_1',
            auth: "{{connections['old']}}",
            nextAction: pieceStep({
                name: 'step_2',
                auth: "{{connections['other']}}",
                nextAction: pieceStep({ name: 'step_3', auth: "{{connections['old']}}" }),
            }),
        }))

        const result = flowStructureUtil.replaceConnection({ flowVersion: flowVersion, sourceExternalId: 'old', targetExternalId: 'new' })

        expect(authOf(result, 'step_1')).toBe("{{connections['new']}}")
        expect(authOf(result, 'step_2')).toBe("{{connections['other']}}")
        expect(authOf(result, 'step_3')).toBe("{{connections['new']}}")
        expect(flowStructureUtil.getStepOrThrow('step_1', result.trigger).settings.input.channel).toBe('general')
        expect(flowStructureUtil.extractConnectionIds(result)).toEqual(['new', 'other'])
    })

    it('does not change a step whose auth points at a connection that only starts with the source name', () => {
        const flowVersion = flowWith(pieceStep({ name: 'step_1', auth: "{{connections['old-2']}}" }))

        const result = flowStructureUtil.replaceConnection({ flowVersion: flowVersion, sourceExternalId: 'old', targetExternalId: 'new' })

        expect(authOf(result, 'step_1')).toBe("{{connections['old-2']}}")
    })

    it('points agent tools that use the source connection at the target connection, in plain or wrapped form', () => {
        const agentStep: PieceAction = {
            ...pieceStep({ name: 'step_1' }),
            settings: {
                pieceName: '@activepieces/piece-ai',
                pieceVersion: '0.6.0',
                actionName: 'run_agent',
                input: {
                    agentTools: [
                        slackTool({ toolName: 'send', auth: 'old' }),
                        slackTool({ toolName: 'reply', auth: "{{connections['old']}}" }),
                        slackTool({ toolName: 'read', auth: 'other' }),
                        mcpTool,
                    ],
                },
                propertySettings: {},
            },
        }
        const flowVersion = flowWith(agentStep)
        expect(flowStructureUtil.extractAgentToolConnectionIds(flowVersion)).toEqual(['old', 'other'])
        expect(flowStructureUtil.extractConnectionIds(flowVersion)).toEqual(['old', 'other'])

        const result = flowStructureUtil.replaceConnection({ flowVersion, sourceExternalId: 'old', targetExternalId: 'new' })

        expect(flowStructureUtil.getStepOrThrow('step_1', result.trigger).settings.input.agentTools).toEqual([
            slackTool({ toolName: 'send', auth: 'new' }),
            slackTool({ toolName: 'reply', auth: 'new' }),
            slackTool({ toolName: 'read', auth: 'other' }),
            mcpTool,
        ])
    })

    it('ignores agentTools on a step that is not the AI piece', () => {
        const step = pieceStep({ name: 'step_1' })
        const otherPieceStep: PieceAction = {
            ...step,
            settings: { ...step.settings, input: { agentTools: [slackTool({ toolName: 'send', auth: 'old' })] } },
        }
        const flowVersion = flowWith(otherPieceStep)
        expect(flowStructureUtil.extractAgentToolConnectionIds(flowVersion)).toEqual([])

        const result = flowStructureUtil.replaceConnection({ flowVersion, sourceExternalId: 'old', targetExternalId: 'new' })

        expect(flowStructureUtil.getStepOrThrow('step_1', result.trigger).settings.input.agentTools).toEqual([slackTool({ toolName: 'send', auth: 'old' })])
    })
})

describe('flowStructureUtil.replaceAgentToolConnection', () => {
    it('points a piece tool that uses the source connection, in plain or wrapped form, at the target connection', () => {
        const tools = [
            slackTool({ toolName: 'send', auth: 'old' }),
            slackTool({ toolName: 'reply', auth: "{{connections['old']}}" }),
            slackTool({ toolName: 'read', auth: 'other' }),
            mcpTool,
        ]

        const result = tools.map((tool) => flowStructureUtil.replaceAgentToolConnection({ tool, sourceExternalId: 'old', targetExternalId: 'new' }))

        expect(result).toEqual([
            slackTool({ toolName: 'send', auth: 'new' }),
            slackTool({ toolName: 'reply', auth: 'new' }),
            slackTool({ toolName: 'read', auth: 'other' }),
            mcpTool,
        ])
    })
})

function slackTool({ toolName, auth }: { toolName: string, auth: string }): AgentPieceTool {
    return {
        type: AgentToolType.PIECE,
        toolName,
        pieceMetadata: {
            pieceName: '@activepieces/piece-slack',
            pieceVersion: '0.0.1',
            actionName: 'send_message',
            predefinedInput: { auth, fields: {} },
        },
    }
}

const mcpTool: AgentMcpTool = {
    type: AgentToolType.MCP,
    toolName: 'mcp',
    serverUrl: 'https://example.com',
    protocol: McpProtocol.STREAMABLE_HTTP,
    auth: { type: McpAuthType.NONE },
}
