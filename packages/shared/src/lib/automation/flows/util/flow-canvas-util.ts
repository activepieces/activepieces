import { CodeAction, FlowAction, FlowActionType, PieceAction } from '../actions/action'
import { FlowTrigger } from '../triggers/trigger'

export const FLOW_CANVAS_STEP_HEIGHT = 60
export const FLOW_CANVAS_STEP_WIDTH = 232
export const FLOW_CANVAS_VSPACE = 60
export const FLOW_CANVAS_ARC = 15
export const FLOW_CANVAS_LOOP_VOFFSET = FLOW_CANVAS_VSPACE * 1.5 + 2 * FLOW_CANVAS_ARC // 120
export const FLOW_CANVAS_ROUTER_VOFFSET = FLOW_CANVAS_LOOP_VOFFSET + 30 // 150
export const FLOW_CANVAS_HSPACE = 80

type Step = FlowAction | FlowTrigger

type CanvasBoundingBox = { minX: number, maxX: number, height: number }

function getFlowBoundingBox(step: Step | FlowAction | null | undefined, forBranch = false): CanvasBoundingBox {
    if (!step) {
        return forBranch
            ? { minX: 0, maxX: FLOW_CANVAS_STEP_WIDTH, height: FLOW_CANVAS_STEP_HEIGHT + FLOW_CANVAS_VSPACE }
            : { minX: 0, maxX: FLOW_CANVAS_STEP_WIDTH, height: 0 }
    }

    let withChildMinX = 0
    let withChildMaxX = FLOW_CANVAS_STEP_WIDTH
    let withChildHeight = FLOW_CANVAS_STEP_HEIGHT + FLOW_CANVAS_VSPACE

    if (step.type === FlowActionType.LOOP_ON_ITEMS) {
        const childBoundingBox = getFlowBoundingBox(step.firstLoopAction, true)
        const childWidth = childBoundingBox.maxX - childBoundingBox.minX
        const childLeft = -childBoundingBox.minX + FLOW_CANVAS_STEP_WIDTH / 2
        const childRight = childBoundingBox.maxX - FLOW_CANVAS_STEP_WIDTH / 2
        const deltaLeftX = -(childWidth + FLOW_CANVAS_STEP_WIDTH + FLOW_CANVAS_HSPACE - FLOW_CANVAS_STEP_WIDTH / 2 - childRight) / 2 - FLOW_CANVAS_STEP_WIDTH / 2
        const childOffsetX = deltaLeftX + FLOW_CANVAS_STEP_WIDTH + FLOW_CANVAS_HSPACE + childLeft
        const subgraphEndY = FLOW_CANVAS_STEP_HEIGHT + FLOW_CANVAS_LOOP_VOFFSET + childBoundingBox.height + FLOW_CANVAS_ARC + FLOW_CANVAS_VSPACE
        withChildMinX = Math.min(0, deltaLeftX, childOffsetX + childBoundingBox.minX)
        withChildMaxX = Math.max(FLOW_CANVAS_STEP_WIDTH, deltaLeftX + FLOW_CANVAS_STEP_WIDTH, childOffsetX + childBoundingBox.maxX)
        withChildHeight = Math.max(FLOW_CANVAS_STEP_HEIGHT + FLOW_CANVAS_VSPACE, subgraphEndY)
    }
    else if (step.type === FlowActionType.ROUTER) {
        const children = step.children
        if (children.length > 0) {
            const childBoundingBoxes = children.map(c => getFlowBoundingBox(c, true))
            const merged = mergeBranchedChildBoundingBoxes(childBoundingBoxes)
            withChildMinX = merged.minX
            withChildMaxX = merged.maxX
            withChildHeight = merged.height
        }
    }
    else if (hasContinueOnFailureBranches(step)) {
        const branches = getContinueOnFailureBranchPair(step)
        const childBoundingBoxes = branches.map(b => getFlowBoundingBox(b, true))
        const merged = mergeBranchedChildBoundingBoxes(childBoundingBoxes)
        withChildMinX = merged.minX
        withChildMaxX = merged.maxX
        withChildHeight = merged.height
    }

    const nextBoundingBox = getFlowBoundingBox(step.nextAction, false)
    return {
        minX: Math.min(withChildMinX, nextBoundingBox.minX),
        maxX: Math.max(withChildMaxX, nextBoundingBox.maxX),
        height: withChildHeight + nextBoundingBox.height,
    }
}

function buildPositions({ step, offsetX, offsetY, positions }: {
    step: Step | FlowAction | null | undefined
    offsetX: number
    offsetY: number
    positions: Map<string, { x: number, y: number }>
}): void {
    if (!step) return

    positions.set(step.name, { x: offsetX + FLOW_CANVAS_STEP_WIDTH / 2, y: offsetY })

    if (step.type === FlowActionType.LOOP_ON_ITEMS) {
        const childBoundingBox = getFlowBoundingBox(step.firstLoopAction, true)
        const childLeft = -childBoundingBox.minX + FLOW_CANVAS_STEP_WIDTH / 2
        const childRight = childBoundingBox.maxX - FLOW_CANVAS_STEP_WIDTH / 2
        const childWidth = childBoundingBox.maxX - childBoundingBox.minX
        const deltaLeftX = -(childWidth + FLOW_CANVAS_STEP_WIDTH + FLOW_CANVAS_HSPACE - FLOW_CANVAS_STEP_WIDTH / 2 - childRight) / 2 - FLOW_CANVAS_STEP_WIDTH / 2
        const childOffsetX = offsetX + deltaLeftX + FLOW_CANVAS_STEP_WIDTH + FLOW_CANVAS_HSPACE + childLeft
        const childOffsetY = offsetY + FLOW_CANVAS_STEP_HEIGHT + FLOW_CANVAS_LOOP_VOFFSET
        if (step.firstLoopAction) {
            buildPositions({ step: step.firstLoopAction, offsetX: childOffsetX, offsetY: childOffsetY, positions })
        }
        const subgraphEndY = FLOW_CANVAS_STEP_HEIGHT + FLOW_CANVAS_LOOP_VOFFSET + childBoundingBox.height + FLOW_CANVAS_ARC + FLOW_CANVAS_VSPACE
        buildPositions({ step: step.nextAction, offsetX, offsetY: offsetY + subgraphEndY, positions })
    }
    else if (step.type === FlowActionType.ROUTER) {
        const subgraphEndY = positionBranchedChildren({ children: step.children, offsetX, offsetY, positions })
        buildPositions({ step: step.nextAction, offsetX, offsetY: offsetY + subgraphEndY, positions })
    }
    else if (hasContinueOnFailureBranches(step)) {
        const subgraphEndY = positionBranchedChildren({ children: getContinueOnFailureBranchPair(step), offsetX, offsetY, positions })
        buildPositions({ step: step.nextAction, offsetX, offsetY: offsetY + subgraphEndY, positions })
    }
    else {
        buildPositions({ step: step.nextAction, offsetX, offsetY: offsetY + FLOW_CANVAS_STEP_HEIGHT + FLOW_CANVAS_VSPACE, positions })
    }
}

function computeRouterChildOffsets(
    boundingBoxes: ReadonlyArray<{ width: number, left: number, right: number }>,
): number[] {
    if (boundingBoxes.length === 0) return []
    const totalWidth = boundingBoxes.reduce((sum, b) => sum + b.width, 0)
        + FLOW_CANVAS_HSPACE * (boundingBoxes.length - 1)
    let deltaLeftX = -(totalWidth - boundingBoxes[0].left - boundingBoxes[boundingBoxes.length - 1].right) / 2
        - boundingBoxes[0].left
    return boundingBoxes.map(b => {
        const x = deltaLeftX + b.left
        deltaLeftX += b.width + FLOW_CANVAS_HSPACE
        return x
    })
}

function mergeBranchedChildBoundingBoxes(
    childBoundingBoxes: CanvasBoundingBox[],
): { minX: number, maxX: number, height: number } {
    const offsets = computeRouterChildOffsets(childBoundingBoxes.map(boundingBoxToLayoutDimensions))
    let mergedMinX = 0
    let mergedMaxX = FLOW_CANVAS_STEP_WIDTH
    let maxChildHeight = 0
    for (let i = 0; i < childBoundingBoxes.length; i++) {
        const bbox = childBoundingBoxes[i]
        const x = offsets[i]
        mergedMinX = Math.min(mergedMinX, x + bbox.minX)
        mergedMaxX = Math.max(mergedMaxX, x + bbox.maxX)
        maxChildHeight = Math.max(maxChildHeight, bbox.height)
    }
    const subgraphEndY = FLOW_CANVAS_STEP_HEIGHT + FLOW_CANVAS_ROUTER_VOFFSET + maxChildHeight + FLOW_CANVAS_ARC + FLOW_CANVAS_VSPACE
    return {
        minX: mergedMinX,
        maxX: mergedMaxX,
        height: Math.max(FLOW_CANVAS_STEP_HEIGHT + FLOW_CANVAS_VSPACE, subgraphEndY),
    }
}

function boundingBoxToLayoutDimensions(b: CanvasBoundingBox): { width: number, left: number, right: number } {
    return {
        width: b.maxX - b.minX,
        left: -b.minX + FLOW_CANVAS_STEP_WIDTH / 2,
        right: b.maxX - FLOW_CANVAS_STEP_WIDTH / 2,
    }
}

function positionBranchedChildren({ children, offsetX, offsetY, positions }: {
    children: ReadonlyArray<FlowAction | null | undefined>
    offsetX: number
    offsetY: number
    positions: Map<string, { x: number, y: number }>
}): number {
    let maxChildHeight = 0
    if (children.length > 0) {
        const childBoundingBoxes = children.map(c => getFlowBoundingBox(c, true))
        const offsets = computeRouterChildOffsets(childBoundingBoxes.map(boundingBoxToLayoutDimensions))
        const childOffsetY = offsetY + FLOW_CANVAS_STEP_HEIGHT + FLOW_CANVAS_ROUTER_VOFFSET
        for (let i = 0; i < children.length; i++) {
            const child = children[i]
            if (child) {
                buildPositions({ step: child, offsetX: offsetX + offsets[i], offsetY: childOffsetY, positions })
            }
            maxChildHeight = Math.max(maxChildHeight, childBoundingBoxes[i].height)
        }
    }
    return FLOW_CANVAS_STEP_HEIGHT + FLOW_CANVAS_ROUTER_VOFFSET + maxChildHeight + FLOW_CANVAS_ARC + FLOW_CANVAS_VSPACE
}

function hasContinueOnFailureBranches(step: Step | FlowAction): step is CodeAction | PieceAction {
    if (step.type !== FlowActionType.CODE && step.type !== FlowActionType.PIECE) {
        return false
    }
    return step.settings.errorHandlingOptions?.continueOnFailure?.value ?? false
}

function getContinueOnFailureBranchPair(step: CodeAction | PieceAction): (FlowAction | undefined)[] {
    const branches = step.settings.errorHandlingOptions?.continueOnFailureBranches
    return [branches?.onSuccess, branches?.onFailure]
}

export const flowCanvasUtils = {
    /**
     * Compute canvas (x, y) positions for every step in a flow.
     * Positions match the frontend canvas layout algorithm.
     */
    computeStepPositions(trigger: FlowTrigger): Map<string, { x: number, y: number }> {
        const positions = new Map<string, { x: number, y: number }>()
        buildPositions({ step: trigger, offsetX: 0, offsetY: 0, positions })
        return positions
    },
    hasContinueOnFailureBranches,
    getContinueOnFailureBranchPair,
    computeRouterChildOffsets,
}
