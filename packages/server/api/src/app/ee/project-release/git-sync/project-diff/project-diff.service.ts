import { ProjectOperationType } from '@activepieces/ee-shared'
import { ActionType, assertNotNullOrUndefined, DEFAULT_SAMPLE_DATA_SETTINGS, flowPieceUtil, flowStructureUtil, FlowVersion, isNil, PopulatedFlow, Step, TriggerType } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'
import { ProjectMappingState } from './project-mapping-state'

export const projectDiffService = {
    diff({ gitFiles, projectFlows, mapping }: DiffParams): ProjectOperation[] {
        const createFlowOperation = findFlowsToCreate({ gitFiles, projectFlows, mapping })
        const deleteFlowOperation = findFlowsToDelete({ gitFiles, projectFlows, mapping })
        const updateFlowOperations = findFlowsToUpdate({ gitFiles, projectFlows, mapping })
        return [...deleteFlowOperation, ...createFlowOperation, ...updateFlowOperations]
    },
}

function findFlowsToCreate({ gitFiles, projectFlows, mapping }: DiffParams): ProjectOperation[] {
    return gitFiles.filter((gitFile) => {
        const targetId = mapping.findTargetId(gitFile.baseFilename)
        return isNil(targetId) || isNil(projectFlows.find((fl) => fl.id === targetId))
    }).map((gitFile) => ({
        type: ProjectOperationType.CREATE_FLOW,
        gitFile,
    }))
}
function findFlowsToDelete({ gitFiles, projectFlows, mapping }: DiffParams): ProjectOperation[] {
    return projectFlows.filter((f) => {
        const sourceId = mapping.findSourceId(f.id)
        return isNil(sourceId) || isNil(gitFiles.find((gitFlow) => gitFlow.baseFilename === sourceId))
    }).map((projectFlow) => ({
        type: ProjectOperationType.DELETE_FLOW,
        projectFlow,
    }))
}

function findFlowsToUpdate({ gitFiles, projectFlows, mapping }: DiffParams): ProjectOperation[] {
    return gitFiles.filter((gitFile) => {
        const targetId = mapping.findTargetId(gitFile.baseFilename)
        return !isNil(targetId) && !isNil(projectFlows.find((fl) => fl.id === targetId))
    }).map((gitFile) => {
        const destFlowId = mapping.findTargetId(gitFile.baseFilename)
        const projectFlow = projectFlows.find((fl) => fl.id === destFlowId)!
        assertNotNullOrUndefined(projectFlow, `Could not find target flow for source flow ${gitFile.baseFilename}`)
        return {
            type: ProjectOperationType.UPDATE_FLOW,
            gitFile,
            projectFlow,
        }
    }).filter((op) => isFlowChanged(op.gitFile.flow, op.projectFlow))
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
    gitFiles: GitFile[]
    projectFlows: PopulatedFlow[]
    mapping: ProjectMappingState
}

export const GitFile = Type.Object({
    flow: PopulatedFlow,
    baseFilename: Type.String(),
})
export type GitFile = Static<typeof GitFile>

export const ProjectOperation = Type.Union([
    Type.Object({
        type: Type.Literal(ProjectOperationType.UPDATE_FLOW),
        gitFile: GitFile,
        projectFlow: PopulatedFlow,
    }),
    Type.Object({
        type: Type.Literal(ProjectOperationType.CREATE_FLOW),
        gitFile: GitFile,
    }),
    Type.Object({
        type: Type.Literal(ProjectOperationType.DELETE_FLOW),
        projectFlow: PopulatedFlow,
    }),
])

export type ProjectOperation = Static<typeof ProjectOperation>
