import {
    FlowActionKind,
    FlowOperationRequest,
    flowOperations,
    FlowOperationType,
    FlowVersion,
} from '../../src'
import {
    createEmptyFlowVersion,
    createCodeAction,
    createFlowVersionWithLoop,
    createFlowVersionWithRouter,
    createFlowVersionWithSimpleAction,
} from './test-utils'

function getNodeData(flow: FlowVersion, id: string) {
    const node = flow.graph.nodes.find(n => n.id === id)
    return node?.data as Record<string, unknown> | undefined
}

describe('Update Action', () => {
    it('should update code action settings', () => {
        const flow = createFlowVersionWithSimpleAction()
        const op: FlowOperationRequest = {
            type: FlowOperationType.UPDATE_ACTION,
            request: {
                id: 'step_1',
                action: {
                    displayName: 'Updated Code',
                    kind: FlowActionKind.CODE,
                    valid: true,
                    settings: {
                        sourceCode: {
                            code: 'export const code = async () => { return { updated: true }; }',
                            packageJson: '{}',
                        },
                        input: {},
                    },
                },
            },
        }
        const result = flowOperations.apply(flow, op)
        const data = getNodeData(result, 'step_1')!
        expect(data.displayName).toBe('Updated Code')
        expect((data.settings as Record<string, unknown>).sourceCode).toEqual(
            expect.objectContaining({ code: expect.stringContaining('updated: true') }),
        )
    })

    it('should update piece action settings', () => {
        let flow = createEmptyFlowVersion()
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: {
                id: 'step_1',
                parentStep: 'trigger',
                action: {
                    displayName: 'Send Email',
                    kind: FlowActionKind.PIECE,
                    valid: true,
                    settings: {
                        pieceName: '@activepieces/piece-gmail',
                        pieceVersion: '~0.5.0',
                        actionName: 'send_email',
                        input: {},
                        propertySettings: {},
                    },
                },
            },
        })
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.UPDATE_ACTION,
            request: {
                id: 'step_1',
                action: {
                    displayName: 'Send Slack Message',
                    kind: FlowActionKind.PIECE,
                    valid: true,
                    settings: {
                        pieceName: '@activepieces/piece-slack',
                        pieceVersion: '~0.3.0',
                        actionName: 'send_message',
                        input: { channel: '#general' },
                        propertySettings: {},
                    },
                },
            },
        })
        const data = getNodeData(result, 'step_1')!
        expect(data.displayName).toBe('Send Slack Message')
        expect((data.settings as Record<string, unknown>).pieceName).toBe('@activepieces/piece-slack')
    })

    it('should update action displayName', () => {
        const flow = createFlowVersionWithSimpleAction()
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.UPDATE_ACTION,
            request: {
                id: 'step_1',
                action: {
                    displayName: 'My Custom Step Name',
                    kind: FlowActionKind.CODE,
                    valid: true,
                    settings: {
                        sourceCode: { code: 'test', packageJson: '{}' },
                        input: {},
                    },
                },
            },
        })
        expect(getNodeData(result, 'step_1')!.displayName).toBe('My Custom Step Name')
    })

    it('should update loop action settings', () => {
        const flow = createFlowVersionWithLoop()
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.UPDATE_ACTION,
            request: {
                id: 'step_1',
                action: {
                    displayName: 'Updated Loop',
                    kind: FlowActionKind.LOOP_ON_ITEMS,
                    valid: true,
                    settings: {
                        items: '{{trigger.newItems}}',
                    },
                },
            },
        })
        const data = getNodeData(result, 'step_1')!
        expect(data.displayName).toBe('Updated Loop')
        expect((data.settings as Record<string, unknown>).items).toBe('{{trigger.newItems}}')
    })

    it('should update router action settings', () => {
        const flow = createFlowVersionWithRouter()
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.UPDATE_ACTION,
            request: {
                id: 'step_1',
                action: {
                    displayName: 'Updated Router',
                    kind: FlowActionKind.ROUTER,
                    valid: true,
                    settings: {
                        executionType: 'EXECUTE_ALL_MATCH',
                    },
                },
            },
        })
        const data = getNodeData(result, 'step_1')!
        expect(data.displayName).toBe('Updated Router')
    })

    it('should update skip flag', () => {
        const flow = createFlowVersionWithSimpleAction()
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.UPDATE_ACTION,
            request: {
                id: 'step_1',
                action: {
                    displayName: 'Code',
                    kind: FlowActionKind.CODE,
                    valid: true,
                    skip: true,
                    settings: {
                        sourceCode: { code: 'test', packageJson: '{}' },
                        input: {},
                    },
                },
            },
        })
        expect(getNodeData(result, 'step_1')!.skip).toBe(true)
    })

    it('should recalculate valid flag after update', () => {
        const flow = createFlowVersionWithSimpleAction()
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.UPDATE_ACTION,
            request: {
                id: 'step_1',
                action: {
                    displayName: 'Code',
                    kind: FlowActionKind.CODE,
                    valid: false,
                    settings: {
                        sourceCode: { code: 'test', packageJson: '{}' },
                        input: {},
                    },
                },
            },
        })
        expect(result.valid).toBe(false)
    })
})
