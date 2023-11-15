import { ActionType, FlowDrawer, Trigger, Action, TriggerType } from '../../../src'
import { FLOW_ITEM_HEIGHT, FLOW_ITEM_WIDTH, SPACE_BETWEEN_VERTICAL_STEP, SPACE_BETWEEN_TWO_BRANCH } from '../../../src/lib/flows/drawing/draw-common'

const codeStep: Action =  {
    type: ActionType.CODE,
    displayName: 'code',
    name: 'code',
    settings: {
        sourceCode: {
            packageJson: 'javascript',
            code: 'console.log("Hello world")',
        },
        input: {},
        inputUiInfo: {},
    },
    valid: true,
}

const simpleFlow: Trigger = {
    type: TriggerType.EMPTY,
    displayName: 'http',
    name: 'http',
    settings: {
    },
    valid: false,
    nextAction: codeStep,
}


const simpleBranch: Trigger = {
    type: TriggerType.EMPTY,
    displayName: 'http',
    name: 'http',
    settings: {
    },
    valid: false,
    nextAction: {
        type: ActionType.BRANCH,
        displayName: 'branch',
        name: 'branch',
        onSuccessAction: codeStep,
        onFailureAction: codeStep,
        settings: {
            conditions: [],
            inputUiInfo: {
                currentSelectedData: 'data',
            },
        },
        valid: true,
    },
}


const nestedBranching: Trigger = {
    type: TriggerType.EMPTY,
    displayName: 'http',
    name: 'http',
    settings: {
    },
    valid: false,
    nextAction: {
        type: ActionType.BRANCH,
        displayName: 'branch',
        name: 'branch',
        onSuccessAction: {
            type: ActionType.BRANCH,
            displayName: 'branch',
            name: 'branch',
            onSuccessAction: codeStep,
            onFailureAction: codeStep,
            settings: {
                conditions: [],
                inputUiInfo: {
                    currentSelectedData: 'data',
                },
            },
            valid: true,
        },
        onFailureAction: codeStep,
        settings: {
            conditions: [],
            inputUiInfo: {
                currentSelectedData: 'data',
            },
        },
        valid: true,
    },
}



describe('FlowDrawer', () => {
    it('should render two steps flow', () => {
        const flowDrawer = FlowDrawer.construct({
            step: simpleFlow,
        })
        expect(flowDrawer.steps.length).toBe(2)
        expect(flowDrawer.steps[0].x).toBe(0)
        expect(flowDrawer.steps[0].y).toBe(0)
        expect(flowDrawer.steps[1].x).toBe(0)
        expect(flowDrawer.steps[1].y).toBe(FLOW_ITEM_HEIGHT + SPACE_BETWEEN_VERTICAL_STEP)

    })

    it('should render two steps flow with branch', () => {
        const flowDrawer = FlowDrawer.construct({
            step: simpleBranch,
        })
        expect(flowDrawer.steps.length).toBe(4)
        expect(flowDrawer.steps[0].x).toBe(0)
        expect(flowDrawer.steps[0].y).toBe(0)
        expect(flowDrawer.steps[1].x).toBe(0)
        expect(flowDrawer.steps[1].y).toBe(FLOW_ITEM_HEIGHT + SPACE_BETWEEN_VERTICAL_STEP)

        const secondStep = FLOW_ITEM_HEIGHT + SPACE_BETWEEN_VERTICAL_STEP + FLOW_ITEM_HEIGHT + SPACE_BETWEEN_VERTICAL_STEP
        const secondStepX = FLOW_ITEM_WIDTH / 2 + SPACE_BETWEEN_TWO_BRANCH / 2.0
        expect(flowDrawer.steps[2].x).toBe(-secondStepX)
        expect(flowDrawer.steps[2].y).toBe(secondStep)

        expect(flowDrawer.steps[3].x).toBe(secondStepX)
        expect(flowDrawer.steps[3].y).toBe(secondStep)
    })

    it('should render two steps flow with nested branching', () => {
        const flowDrawer = FlowDrawer.construct({
            step: nestedBranching,
        })

        expect(flowDrawer.steps.length).toBe(6)

        const thirdStep = (FLOW_ITEM_HEIGHT + SPACE_BETWEEN_VERTICAL_STEP) * 3
        // expect(flowDrawer.steps[4].x).toBe(-FLOW_ITEM_WIDTH / 2)
        expect(flowDrawer.steps[4].y).toBe(thirdStep)

        // expect(flowDrawer.steps[5].x).toBe(FLOW_ITEM_WIDTH / 2)
        expect(flowDrawer.steps[5].y).toBe(thirdStep)
    })

})
