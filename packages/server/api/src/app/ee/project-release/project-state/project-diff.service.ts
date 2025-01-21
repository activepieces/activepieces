import { Action, ActionType, apId, assertNotNullOrUndefined, ConnectionOperation, ConnectionOperationType, ConnectionState, DEFAULT_SAMPLE_DATA_SETTINGS, DiffState, FlowDiffState, flowPieceUtil, FlowState, flowStructureUtil, FlowVersion, GroupState, GroupStatus, isNil, LoopOnItemsAction, PopulatedFlow, ProjectOperation, ProjectOperationType, ProjectState, Step, Trigger, TriggerType } from '@activepieces/shared'

export const projectDiffService = {
    diff({ newState, currentState }: DiffParams): DiffState {
        const createFlowOperation = findFlowsToCreate({ newState, currentState })
        const deleteFlowOperation = findFlowsToDelete({ newState, currentState })
        const updateFlowOperations = findFlowsToUpdate({ newState, currentState })
        const operations = [...deleteFlowOperation, ...createFlowOperation, ...updateFlowOperations]
        const connections = getFlowConnections(currentState, newState)
        return {
            operations,
            connections,
        }
    },
    findGroups({ newFlow, currentFlow }: FlowDiffParams): FlowDiffState {
        const steps = new Map<string, Action | Trigger>()
        const newFlowNodes = getFlowNodes(newFlow.version.trigger, steps)
        const currentFlowNodes = getFlowNodes(currentFlow.version.trigger, steps)
        const nodeMap = new Map<string, GroupStatus>()

        for (const nodeIdentity of newFlowNodes) {
            const existingNode = currentFlowNodes.find((n) => n.name === nodeIdentity.name && n.pieceName === nodeIdentity.pieceName)
            if (!isNil(existingNode)) {
                if (steps.get(getFlowDiffPattern(nodeIdentity.name, nodeIdentity.pieceName)) !== steps.get(getFlowDiffPattern(existingNode.name, existingNode.pieceName))) {
                    nodeMap.set(getFlowDiffPattern(nodeIdentity.name, nodeIdentity.pieceName), GroupStatus.UPDATED)
                } else {
                    nodeMap.set(getFlowDiffPattern(nodeIdentity.name, nodeIdentity.pieceName), GroupStatus.NO_CHANGE)
                }
            } else {
                nodeMap.set(getFlowDiffPattern(nodeIdentity.name, nodeIdentity.pieceName), GroupStatus.ADDED)
            }
        }

        for (const nodeIdentity of currentFlowNodes) {
            const isExistingNode = newFlowNodes.find((n) => n.name === nodeIdentity.name && n.pieceName === nodeIdentity.pieceName)
            if (!isExistingNode) {
                nodeMap.set(getFlowDiffPattern(nodeIdentity.name, nodeIdentity.pieceName), GroupStatus.DELETED)
            }
        }

        return groupingNodes({ nodeMap, currentFlow: currentFlow, newFlow: newFlow })
    },
}

function getFlowNodes(action: Action | Trigger | undefined, steps: Map<string, Action | Trigger>): StepIdentity[] {
    if (isNil(action)) {
        return []
    }
    const stepsIdentity: StepIdentity[] = []
    stepsIdentity.push({ name: action.name, pieceName: action.settings.pieceName })
    steps.set(getFlowDiffPattern(action.name, action.settings.pieceName), action)
    switch (action.type) {
        case ActionType.LOOP_ON_ITEMS:
            stepsIdentity.push(...getFlowNodes(action.firstLoopAction, steps))
            break
        case ActionType.ROUTER:
            action.children.forEach((child) => {
                if (!isNil(child)) {
                    stepsIdentity.push(...getFlowNodes(child, steps))
                }
            })
            break
    }
    stepsIdentity.push(...getFlowNodes(action.nextAction, steps))
    return stepsIdentity
}

function isLinear(action: Action | Trigger): boolean {
    return action.type !== ActionType.LOOP_ON_ITEMS && action.type !== ActionType.ROUTER
}

function getContigousAction(params: GetGroupParams): Action | Trigger | undefined {
    if (isNil(params.flowPointer) || getFlowDiffPattern(params.flowPointer.name, params.flowPointer.settings.pieceName) !== params.status) {
        return undefined
    }
    switch (params.flowPointer.type) {
        case ActionType.LOOP_ON_ITEMS:
            const loopAction = getContigousAction({
                flowPointer: params.flowPointer.firstLoopAction,
                nodeMap: params.nodeMap,
                status: params.status,
            })
            if (params.flowPointer.type === ActionType.LOOP_ON_ITEMS) {
                params.flowPointer.firstLoopAction = isNil(loopAction) ? undefined : loopAction as Action
            }
            break
        case ActionType.ROUTER:
            const routerActions = params.flowPointer.children.map((child) => {
                return getContigousAction({
                    flowPointer: child,
                    nodeMap: params.nodeMap,
                    status: params.status,
                })
            })
            if (params.flowPointer.type === ActionType.ROUTER) {
                params.flowPointer.children = routerActions.map((action) => action as Action ?? null)
            }
            break
    }
    params.flowPointer.nextAction = getContigousAction({
        flowPointer: params.flowPointer.nextAction,
        nodeMap: params.nodeMap,
        status: params.status,
    })
    return params.flowPointer 
}

function getContigousGroup(params: GetGroupParams): GroupState[] {
    if (isNil(params.flowPointer)) {
        return []
    }

    let status = params.status

    // GOING LINEAR AS MUCH AS POSSIBLE
    const group: GroupState = {
        status: status,
        id: apId(),
        nodes: []
    }
    while (!isNil(params.flowPointer) && isLinear(params.flowPointer) 
        && params.nodeMap.get(getFlowDiffPattern(params.flowPointer.name, params.flowPointer.settings.pieceName)) === status) {
        group.nodes.push(params.flowPointer.name)
        params.flowPointer = params.flowPointer.nextAction
    }

    // GET SPLITTED BRANCHES AS LOOP OR ROUTER
    if (!isNil(params.flowPointer)) {
        status = params.nodeMap.get(getFlowDiffPattern(params.flowPointer.name, params.flowPointer.settings.pieceName)) ?? GroupStatus.NO_CHANGE
    }
    const groups: GroupState[] = [group]
    while (params.flowPointer && !isLinear(params.flowPointer)) {
        const branchedGroups = getBranchedGroup({ flowPointer: params.flowPointer, nodeMap: params.nodeMap, status })
        groups.push(...branchedGroups)
        params.flowPointer = params.flowPointer.nextAction
    }

    // IF THERE IS STILL AFTER THEM RUN THE SAME LOGIC AGAIN
    if (!isNil(params.flowPointer)) {
        status = params.nodeMap.get(getFlowDiffPattern(params.flowPointer.name, params.flowPointer.settings.pieceName)) ?? GroupStatus.NO_CHANGE
        const remainingGroup = getContigousGroup({ flowPointer: params.flowPointer, nodeMap: params.nodeMap, status })
        groups.push(...remainingGroup)
    }

    return groups
}

function getBranchedGroup(params: GetGroupParams): GroupState[] {
    if (isNil(params.flowPointer)) {
        return []
    }
    const groups: GroupState[] = [{
        status: params.status,
        id: apId(),
        nodes: [params.flowPointer.name]
    }]
    switch (params.flowPointer.type) {
        case ActionType.LOOP_ON_ITEMS:
            groups.push(...getContigousGroup({ flowPointer: params.flowPointer.firstLoopAction, nodeMap: params.nodeMap, status: params.status }))
            break
        case ActionType.ROUTER:
            params.flowPointer.children.forEach((child) => groups.push(...getContigousGroup({ flowPointer: child, nodeMap: params.nodeMap, status: params.status })))
            break
    }
    return groups
}

function getFlowDiffPattern(name: string, pieceName: string): string {
    return `${name}.${pieceName}`;
}

function groupingNodes({ nodeMap, currentFlow, newFlow }: GroupingNodeParams): FlowDiffState {
    let currentFlowPointer: Action | Trigger | undefined = currentFlow.version.trigger
    let newFlowPointer: Action | Trigger | undefined = newFlow.version.trigger
    const status = nodeMap.get(getFlowDiffPattern(newFlowPointer.name, newFlowPointer.settings.pieceName)) ?? GroupStatus.NO_CHANGE
    const groups: GroupState[] = getContigousGroup({ flowPointer: newFlowPointer, nodeMap, status })
    return {
        groups,
        // TODO WE NEED TO RETURN FLOW THAT MERGED WITH NEW FLOW
        flow: currentFlow,
    }
}

function findFlowsToCreate({ newState, currentState }: DiffParams): ProjectOperation[] {
    return newState.flows.filter((newFlow) => {
        const flow = searchInFlowForFlowByIdOrExternalId(currentState.flows, newFlow.id)
        return isNil(flow)
    }).map((flowState) => ({
        type: ProjectOperationType.CREATE_FLOW,
        flowState,
    }))
}
function findFlowsToDelete({ newState, currentState }: DiffParams): ProjectOperation[] {
    return currentState.flows.filter((currentFlowFromState) => {
        const flow = newState.flows.find((flowFromNewState) => currentFlowFromState.externalId === flowFromNewState.id || currentFlowFromState.id === flowFromNewState.id)
        return isNil(flow)
    }).map((flowState) => ({
        type: ProjectOperationType.DELETE_FLOW,
        flowState,
    }))
}
function findFlowsToUpdate({ newState, currentState }: DiffParams): ProjectOperation[] {
    const newStateFiles = newState.flows.filter((state) => {
        const flow = searchInFlowForFlowByIdOrExternalId(currentState.flows, state.id)
        return !isNil(flow)
    })
    return newStateFiles.map((flowFromNewState) => {
        const os = searchInFlowForFlowByIdOrExternalId(currentState.flows, flowFromNewState.id)
        assertNotNullOrUndefined(os, `Could not find target flow for source flow ${flowFromNewState.id}`)
        if (isFlowChanged(os, flowFromNewState)) {
            return {
                type: ProjectOperationType.UPDATE_FLOW,
                flowState: os,
                newFlowState: flowFromNewState,
            } as ProjectOperation
        }
        return null
    }).filter((op): op is ProjectOperation => op !== null)
}

function isConnectionChanged(stateOne: ConnectionState, stateTwo: ConnectionState): boolean {
    return stateOne.displayName !== stateTwo.displayName || stateOne.pieceName !== stateTwo.pieceName
}

function getFlowConnections(currentState: ProjectState, newState: ProjectState): ConnectionOperation[] {

    const connectionOperations: ConnectionOperation[] = []

    currentState.connections?.forEach(connection => {
        const connectionState = newState.connections?.find((c) => c.externalId === connection.externalId)
        if (!isNil(connectionState) && isConnectionChanged(connectionState, connection)) {
            connectionOperations.push({
                type: ConnectionOperationType.UPDATE_CONNECTION,
                connectionState: connection,
                newConnectionState: connectionState,
            })
        }
    })

    newState.connections?.forEach(connection => {
        const isExistingConnection = currentState.connections?.find((c) => c.externalId === connection.externalId)
        if (isNil(isExistingConnection)) {
            connectionOperations.push({
                type: ConnectionOperationType.CREATE_CONNECTION,
                connectionState: connection,
            })
        }
    })

    return connectionOperations
}

function searchInFlowForFlowByIdOrExternalId(flows: PopulatedFlow[], id: string): PopulatedFlow | undefined {
    return flows.find((flow) => flow.id === id || flow.externalId === id)
}

function isFlowChanged(fromFlow: PopulatedFlow, targetFlow: PopulatedFlow): boolean {

    const normalizedFromFlow = normalize(fromFlow.version)
    const normalizedTargetFlow = normalize(targetFlow.version)
    return normalizedFromFlow.displayName !== normalizedTargetFlow.displayName
        || JSON.stringify(normalizedFromFlow.trigger) !== JSON.stringify(normalizedTargetFlow.trigger)
}


function normalize(flowVersion: FlowVersion): FlowVersion {
    const flowUpgradable = flowPieceUtil.makeFlowAutoUpgradable(flowVersion)
    return flowStructureUtil.transferFlow(flowUpgradable, (step) => {
        const clonedStep: Step = JSON.parse(JSON.stringify(step))
        clonedStep.settings.inputUiInfo = DEFAULT_SAMPLE_DATA_SETTINGS
        const authExists = clonedStep?.settings?.input?.auth
        if (authExists && [ActionType.PIECE, TriggerType.PIECE].includes(step.type)) {
            clonedStep.settings.input.auth = ''
        }
        return clonedStep
    })
}


type DiffParams = {
    currentState: {
        flows: PopulatedFlow[]
        connections?: ConnectionState[]
    }
    newState: ProjectState
}

type FlowDiffParams = {
    newFlow: PopulatedFlow
    currentFlow: PopulatedFlow
}

type StepIdentity = {
    name: string
    pieceName: string
}

type GroupingNodeParams = {
    nodeMap: Map<string, GroupStatus>
    currentFlow: PopulatedFlow
    newFlow: PopulatedFlow
}

type GetGroupParams = {
    nodeMap: Map<string, GroupStatus>
    flowPointer: Action | Trigger | undefined | null
    status: GroupStatus
}