import { Action, ActionType, BranchAction, LoopOnItemsAction } from '../actions/action'
import { Trigger } from '../triggers/trigger'
import {
    SPACE_BETWEEN_VERTICAL_STEP,
    FLOW_ITEM_HEIGHT,
    FLOW_ITEM_WIDTH,
    SPACE_ON_EMPTY_LOOP_SIDE,
    SPACE_BETWEEN_TWO_BRANCH,
    PositionButton,
} from './draw-common'
import { SvgDrawer, drawLine } from './svg-drawer'
import { Position, PositionedStep } from './step-card'

export const ARC_LENGTH = 15
export const EMPTY_LOOP_ADD_BUTTON_WIDTH = 40
export const EMPTY_LOOP_ADD_BUTTON_HEIGHT = 40


export class FlowDrawer {
    readonly steps: readonly PositionedStep[]
    readonly svg: SvgDrawer
    readonly bgBtns: readonly PositionButton[]

    constructor({
        svg = SvgDrawer.empty(),
        steps = [],
        bgBtns = [],
    }: {
        svg: SvgDrawer
        bgBtns: readonly PositionButton[]
        steps: readonly PositionedStep[]
    }) {
        this.svg = svg
        this.steps = steps
        this.bgBtns = bgBtns
    }

    appendSvg(svg: SvgDrawer): FlowDrawer {
        return new FlowDrawer({
            svg: this.svg.merge(svg),
            steps: [...this.steps],
            bgBtns: [...this.bgBtns],
        })
    }
    mergeChild(child: FlowDrawer): FlowDrawer {
        return new FlowDrawer({
            svg: this.svg.merge(child.svg),
            steps: [...this.steps, ...child.steps],
            bgBtns: [...this.bgBtns],
        })
    }

    boundingBox(): { width: number, height: number } {
        if (this.steps.length === 0) {
            return {
                width: 0,
                height: 0,
            }
        }
        const minX = this.steps.reduce(
            (min, positionedStep) => Math.min(min, positionedStep.x),
            this.steps[0].x,
        )
        const minY = this.steps.reduce(
            (min, positionedStep) => Math.min(min, positionedStep.y),
            this.steps[0].y,
        )
        const maxX = this.steps.reduce(
            (max, positionedStep) => Math.max(max, positionedStep.x + FLOW_ITEM_WIDTH),
            this.steps[0].x + FLOW_ITEM_WIDTH,
        )
        const maxY = this.steps.reduce(
            (max, positionedStep) => Math.max(max, positionedStep.y + FLOW_ITEM_HEIGHT),
            this.steps[0].y + FLOW_ITEM_HEIGHT,
        )
        return {
            width: Math.max(maxX, this.svg.maximumX()) - Math.min(minX, this.svg.minimumX()),
            height: Math.max(maxY, this.svg.maximumY()) - Math.min(minY, this.svg.minimumY()),
        }
    }

    offset(x: number, y: number): FlowDrawer {
        return new FlowDrawer({
            svg: this.svg.offset(x, y),
            bgBtns: [...this.bgBtns],
            steps: this.steps.map((step) => (new PositionedStep({
                ...step,
                x: step.x + x,
                y: step.y + y,
            }))),
        })
    }

    static construct(step: Action | Trigger): FlowDrawer {
        const currentPostionedStep = new PositionedStep({
            x: 0,
            y: 0,
            content: step,
        })
        let flowDrawer = new FlowDrawer({
            svg: SvgDrawer.empty(),
            bgBtns: [],
            steps: [currentPostionedStep],
        })
        const centerBottom = currentPostionedStep.center('bottom')
        let childHeight = 0
        switch (step.type) {
            case ActionType.LOOP_ON_ITEMS: {
                const loopDrawer = handleLoopAction(step, centerBottom)
                childHeight = loopDrawer.boundingBox().height
                flowDrawer = flowDrawer.mergeChild(loopDrawer)
                break
            }
            case ActionType.BRANCH: {
                const branchDrawer = handleBranchAction(step, centerBottom)
                childHeight = branchDrawer.boundingBox().height
                flowDrawer = flowDrawer.mergeChild(branchDrawer)
                break
            }
            default: {
                break
            }
        }

        if (step.nextAction) {
            const nextActionDrawer = handleNextAction(step.nextAction, {
                x: centerBottom.x,
                y: centerBottom.y + childHeight,
            })
            flowDrawer = flowDrawer.mergeChild(nextActionDrawer)
        }
        return flowDrawer
    }
}

function handleLoopAction(step: LoopOnItemsAction, centerBottom: Position): FlowDrawer {
    let firstLoopDrawer = FlowDrawer.construct(step.firstLoopAction!)
    const sideLength = (firstLoopDrawer.boundingBox().width / 2.0 + SPACE_ON_EMPTY_LOOP_SIDE) / 2.0
    firstLoopDrawer = firstLoopDrawer.offset(sideLength, FLOW_ITEM_HEIGHT + SPACE_BETWEEN_VERTICAL_STEP)
    const stepToFirstLoopStepLine = drawLine(centerBottom, firstLoopDrawer.steps[0].center('top'))
    const firstLoopStepClosingLine = SvgDrawer.empty().move(firstLoopDrawer.steps[0]
        .center('top').x, firstLoopDrawer.steps[0].center('top').y + firstLoopDrawer.boundingBox().height)
        .drawVerticalLine(SPACE_BETWEEN_VERTICAL_STEP / 2.0)
        .drawHorizontalLine(-sideLength)
        .drawVerticalLine(SPACE_BETWEEN_VERTICAL_STEP / 2.0)

    const emptyLoopLine = SvgDrawer.empty().move(centerBottom.x, centerBottom.y)
        .drawVerticalLine(SPACE_BETWEEN_VERTICAL_STEP / 2.0)
        .drawHorizontalLine(-sideLength)
        .drawVerticalLine(SPACE_BETWEEN_VERTICAL_STEP + firstLoopDrawer.boundingBox().height)
        .drawHorizontalLine(sideLength)
        .drawVerticalLine(SPACE_BETWEEN_VERTICAL_STEP / 2.0)

    return firstLoopDrawer.appendSvg(stepToFirstLoopStepLine).appendSvg(emptyLoopLine).appendSvg(firstLoopStepClosingLine)

}
function handleBranchAction(step: BranchAction, centerBottom: Position): FlowDrawer {
    let resultDrawer = new FlowDrawer({
        svg: SvgDrawer.empty(),
        bgBtns: [],
        steps: [],
    })
    const actions = [step.onSuccessAction, step.onFailureAction]
    const sides: FlowDrawer[] = actions.map((action) => {
        if (action) {
            return FlowDrawer.construct(action)
        }
        return new FlowDrawer({
            svg: SvgDrawer.empty(),
            bgBtns: [ {
                x: 0,
                y: 0,
                type: 'big',
            }],
            steps: [],
        })
    })
    const { summationWidth, maximumHeight } = calculateDimensions(sides)

    const sideLength = (summationWidth / 4.0) + (SPACE_BETWEEN_TWO_BRANCH * (sides.length - 1)) / 2.0
    sides.forEach((side, index) => {
        const sideOffset = index === 0 ? -sideLength : sideLength
        const stepPosition = {
            x: sideOffset,
            y: FLOW_ITEM_HEIGHT + SPACE_BETWEEN_VERTICAL_STEP,
        }
        const sideDrawer = side.offset(stepPosition.x, stepPosition.y)
        const line = drawLine( centerBottom, {
            x: stepPosition.x + FLOW_ITEM_WIDTH / 2.0,
            y: stepPosition.y,
        })
        const secondLine = drawLine({
            x: sideDrawer.steps[0].center('bottom').x,
            y: sideDrawer.steps[0].y + sideDrawer.boundingBox().height,
        },
        {
            x: centerBottom.x,
            y: centerBottom.y + SPACE_BETWEEN_VERTICAL_STEP + maximumHeight + SPACE_BETWEEN_VERTICAL_STEP,
        })
        resultDrawer = resultDrawer.mergeChild(sideDrawer).appendSvg(line).appendSvg(secondLine)
    })
    return resultDrawer
}

function calculateDimensions(sides: FlowDrawer[]): { summationWidth: number, maximumHeight: number } {
    const summationWidth: number = sides.reduce(
        (sum: number, side: FlowDrawer) => sum + side.boundingBox().width,
        0,
    )
    const maximumHeight: number = sides.reduce(
        (max: number, side: FlowDrawer) => Math.max(max, side.boundingBox().height),
        0,
    )
    return { summationWidth, maximumHeight }
}

function handleNextAction(nextAction: Action, pointToConnectNextActionFrom: Position): FlowDrawer {
    const nextFlowDrawer = FlowDrawer.construct(nextAction).offset(0, pointToConnectNextActionFrom.y + SPACE_BETWEEN_VERTICAL_STEP)
    const line = drawLine(pointToConnectNextActionFrom, nextFlowDrawer.steps[0].center('top'))
    return nextFlowDrawer.appendSvg(line)
}
