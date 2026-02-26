import {
    FlowActionType,
    FlowOperationRequest,
    flowOperations,
    FlowOperationType,
    LoopOnItemsAction,
    RouterAction,
} from '../../src'
import {
    createEmptyFlowVersion,
    createCodeAction,
    createFlowVersionWithLoop,
    createFlowVersionWithRouter,
    createFlowVersionWithSimpleAction,
} from './test-utils'

describe('Update Action', () => {
    it('should update code action settings', () => {
        const flow = createFlowVersionWithSimpleAction()
        const op: FlowOperationRequest = {
            type: FlowOperationType.UPDATE_ACTION,
            request: {
                name: 'step_1',
                displayName: 'Updated Code',
                type: FlowActionType.CODE,
                valid: true,
                settings: {
                    sourceCode: {
                        code: 'export const code = async () => { return { updated: true }; }',
                        packageJson: '{}',
                    },
                    input: {},
                },
            },
        }
        const result = flowOperations.apply(flow, op)
        const step = result.steps.find(s => s.name === 'step_1')!
        expect(step.displayName).toBe('Updated Code')
        expect(step.settings.sourceCode.code).toContain('updated: true')
    })

    it('should update piece action settings', () => {
        let flow = createEmptyFlowVersion()
        flow = flowOperations.apply(flow, {
            type: FlowOperationType.ADD_ACTION,
            request: {
                parentStep: 'trigger',
                action: {
                    name: 'step_1',
                    displayName: 'Send Email',
                    type: FlowActionType.PIECE,
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
                name: 'step_1',
                displayName: 'Send Slack Message',
                type: FlowActionType.PIECE,
                valid: true,
                settings: {
                    pieceName: '@activepieces/piece-slack',
                    pieceVersion: '~0.3.0',
                    actionName: 'send_message',
                    input: { channel: '#general' },
                    propertySettings: {},
                },
            },
        })
        const step = result.steps.find(s => s.name === 'step_1')!
        expect(step.displayName).toBe('Send Slack Message')
        expect(step.settings.pieceName).toBe('@activepieces/piece-slack')
    })

    it('should update action displayName', () => {
        const flow = createFlowVersionWithSimpleAction()
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.UPDATE_ACTION,
            request: {
                name: 'step_1',
                displayName: 'My Custom Step Name',
                type: FlowActionType.CODE,
                valid: true,
                settings: {
                    sourceCode: { code: 'test', packageJson: '{}' },
                    input: {},
                },
            },
        })
        expect(result.steps.find(s => s.name === 'step_1')!.displayName).toBe('My Custom Step Name')
    })

    it('should update loop action while preserving children refs', () => {
        const flow = createFlowVersionWithLoop()
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.UPDATE_ACTION,
            request: {
                name: 'step_1',
                displayName: 'Updated Loop',
                type: FlowActionType.LOOP_ON_ITEMS,
                valid: true,
                settings: {
                    items: '{{trigger.newItems}}',
                },
            },
        })
        const loopStep = result.steps.find(s => s.name === 'step_1') as LoopOnItemsAction
        expect(loopStep.displayName).toBe('Updated Loop')
        expect(loopStep.settings.items).toBe('{{trigger.newItems}}')
        expect(loopStep.children).toEqual(['step_2'])
    })

    it('should update router action while preserving branches refs', () => {
        const flow = createFlowVersionWithRouter()
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.UPDATE_ACTION,
            request: {
                name: 'step_1',
                displayName: 'Updated Router',
                type: FlowActionType.ROUTER,
                valid: true,
                settings: {
                    executionType: 'EXECUTE_ALL_MATCH',
                },
            },
        })
        const routerStep = result.steps.find(s => s.name === 'step_1') as RouterAction
        expect(routerStep.displayName).toBe('Updated Router')
        expect(routerStep.branches).toHaveLength(2)
        expect(routerStep.branches![0].steps).toContain('step_2')
        expect(routerStep.branches![1].steps).toContain('step_3')
    })

    it('should update skip flag', () => {
        const flow = createFlowVersionWithSimpleAction()
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.UPDATE_ACTION,
            request: {
                name: 'step_1',
                displayName: 'Code',
                type: FlowActionType.CODE,
                valid: true,
                skip: true,
                settings: {
                    sourceCode: { code: 'test', packageJson: '{}' },
                    input: {},
                },
            },
        })
        expect(result.steps.find(s => s.name === 'step_1')!.skip).toBe(true)
    })

    it('should recalculate valid flag after update', () => {
        const flow = createFlowVersionWithSimpleAction()
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.UPDATE_ACTION,
            request: {
                name: 'step_1',
                displayName: 'Code',
                type: FlowActionType.CODE,
                valid: false,
                settings: {
                    sourceCode: { code: 'test', packageJson: '{}' },
                    input: {},
                },
            },
        })
        expect(result.valid).toBe(false)
    })
})
