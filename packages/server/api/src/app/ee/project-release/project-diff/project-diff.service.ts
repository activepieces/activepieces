import { ProjectOperationType } from '@activepieces/ee-shared'
import { ActionType, assertNotNullOrUndefined, DEFAULT_SAMPLE_DATA_SETTINGS, flowPieceUtil, flowStructureUtil, FlowVersion, isNil, PopulatedFlow, Step, TriggerType } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'
import { ProjectMappingState } from './project-mapping-state'

export const projectDiffService = {
    diff({ newState, oldState, mapping }: DiffParams): ProjectOperation[] {
        const createFlowOperation = findFlowsToCreate({ newState, oldState, mapping })
        const deleteFlowOperation = findFlowsToDelete({ newState, oldState, mapping })
        const updateFlowOperations = findFlowsToUpdate({ newState, oldState, mapping })
        return [...deleteFlowOperation, ...createFlowOperation, ...updateFlowOperations]
    },
}

function findFlowsToCreate({ newState, oldState, mapping }: DiffParams): ProjectOperation[] {
    return newState.filter((newFile) => {
        const targetId = mapping.findTargetId(newFile.baseFilename)
        return isNil(targetId) || isNil(oldState.find((oldFile) => oldFile.flow.id === targetId))
    }).map((state) => ({
        type: ProjectOperationType.CREATE_FLOW,
        state,
    }))
}
function findFlowsToDelete({ newState, oldState, mapping }: DiffParams): ProjectOperation[] {
    return oldState.filter((f) => {
        const sourceId = mapping.findSourceId(f.flow.id)
        return isNil(sourceId) || isNil(newState.find((newFile) => newFile.baseFilename === sourceId))
    }).map((oldFile) => ({
        type: ProjectOperationType.DELETE_FLOW,
        state: oldFile,
    }))
}

function findFlowsToUpdate({ newState, oldState, mapping }: DiffParams): ProjectOperation[] {
    const operations: ProjectOperation[] = []

    const newStateFiles = newState.filter((state) => {
        const targetId = mapping.findTargetId(state.baseFilename)
        return !isNil(targetId) && !isNil(oldState.find((oldFile) => oldFile.flow.id === targetId))
    })

    newStateFiles.forEach((ns) => {
        const destFlowId = mapping.findTargetId(ns.baseFilename)
        const oldStateFile = oldState.find((os) => os.flow.id === destFlowId)!
        assertNotNullOrUndefined(oldStateFile, `Could not find target flow for source flow ${ns.baseFilename}`)
        if (isFlowChanged(ns.flow, oldStateFile.flow)) {
            operations.push({
                type: ProjectOperationType.UPDATE_FLOW,
                newStateFile: ns,
                oldStateFile,
            })
        }
    })
    return operations
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
    newState: StateFile[]
    oldState: StateFile[]
    mapping: ProjectMappingState
}

export const StateFile = Type.Object({
    flow: PopulatedFlow,
    baseFilename: Type.String(),
})
export type StateFile = Static<typeof StateFile>

export const ProjectOperation = Type.Union([
    Type.Object({
        type: Type.Literal(ProjectOperationType.UPDATE_FLOW),
        newStateFile: StateFile,
        oldStateFile: StateFile,
    }),
    Type.Object({
        type: Type.Literal(ProjectOperationType.CREATE_FLOW),
        state: StateFile,
    }),
    Type.Object({
        type: Type.Literal(ProjectOperationType.DELETE_FLOW),
        state: StateFile,
    }),
])

export type ProjectOperation = Static<typeof ProjectOperation>
