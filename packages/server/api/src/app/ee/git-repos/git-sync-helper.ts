import { Flow, FlowOperationType, PopulatedFlow } from '@activepieces/shared'
import fs from 'fs/promises'
import path from 'path'
import { projectService } from '../../project/project-service'
import { flowRepo } from '../../flows/flow/flow.repo'
import { flowService } from '../../flows/flow/flow.service'
import { ProjectMappingState } from './operations/sync-operations'
import { ProjectSyncError } from '@activepieces/ee-shared'


async function getStateFromDB(projectId: string): Promise<PopulatedFlow[]> {
    const flows = await flowRepo().findBy({
        projectId,
    })
    return Promise.all(
        flows.map((f) => {
            return flowService.getOnePopulatedOrThrow({
                id: f.id,
                projectId,
                removeSecrets: false,
            })
        }),
    )
}

async function getMappingStateFromGit(
    stateFolderPath: string,
    projectId: string,
): Promise<ProjectMappingState> {
    const _statePath = path.join(stateFolderPath, projectId + '.json')    
    try {
        const state = await fs.readFile(_statePath, 'utf-8')
        return new ProjectMappingState(JSON.parse(state))
    }
    catch (e) {
        return ProjectMappingState.empty()
    }
}

async function getStateFromGit(
    flowPath: string,
): Promise<PopulatedFlow[]> {
    const flowFiles = await fs.readdir(flowPath)
    const parsedFlows = []
    for (const file of flowFiles) {
        const flow: PopulatedFlow = JSON.parse(
            await fs.readFile(path.join(flowPath, file), 'utf-8'),
        )
        parsedFlows.push(flow)
    }
    return parsedFlows
}

async function createFlowInProject(flow: PopulatedFlow, projectId: string): Promise<PopulatedFlow> {
    return flowService.create({
        projectId,
        request: {
            displayName: flow.version.displayName,
            folderId: flow.folderId ?? undefined,
            projectId,
        },
    })
}

async function updateFlowInProject(flowId: string, flow: PopulatedFlow,
    projectId: string,
): Promise<PopulatedFlow> {
    const project = await projectService.getOneOrThrow(projectId)
    return flowService.update({
        id: flowId,
        projectId,
        lock: true,
        userId: project.ownerId,
        operation: {
            type: FlowOperationType.IMPORT_FLOW,
            request: {
                displayName: flow.version.displayName,
                trigger: flow.version.trigger,
            },
        },
    })
}

async function republishFlow(flowId: string, projectId: string): Promise<ProjectSyncError |  null> {
    const project = await projectService.getOneOrThrow(projectId)
    const flow = await flowService.getOnePopulated({ id: flowId, projectId })
    if (!flow) {
        return null
    }
    if (!flow.version.valid) {
        return {
            flowId,
            message: `Flow ${flow.version.displayName} #${flow.id} is not valid`,
        }
    }
    try {
        await flowService.update({
            id: flowId,
            projectId,
            lock: true,
            userId: project.ownerId,
            operation: {
                type: FlowOperationType.LOCK_AND_PUBLISH,
                request: {},
            },
        })
        return null
    }
    catch (e) {
        return {
            flowId,
            message: `Failed to publish flow ${flow.version.displayName} #${flow.id}`,
        }
    }

}

async function upsertFlowToGit(flow: Flow, flowFolderPath: string): Promise<void> {
    const flowJsonPath = path.join(flowFolderPath, `${flow.id}.json`)
    await fs.writeFile(flowJsonPath, JSON.stringify(flow, null, 2))
}

async function saveStateToGit(
    stateFolderPath: string,
    projectId: string,
    mappingState: ProjectMappingState,
): Promise<void> {
    const statePath = path.join(stateFolderPath, projectId + '.json')
    await fs.writeFile(statePath, JSON.stringify(mappingState, null, 2))
}

async function deleteFlowFromGit(flowId: string, flowFolderPath: string): Promise<void> {
    const flowJsonPath = path.join(flowFolderPath, `${flowId}.json`)
    await fs.unlink(flowJsonPath)
}

async function deleteFlowFromProject(flowId: string, projectId: string): Promise<void> {
    const flow = await flowService.getOne({ id: flowId, projectId })
    if (!flow) {
        return
    }
    await flowService.delete({ id: flowId, projectId })
}

export const gitSyncHelper = {
    getStateFromDB,
    getStateFromGit,
    getMappingStateFromGit,
    upsertFlowToGit,
    deleteFlowFromGit,
    deleteFlowFromProject,
    createFlowInProject,
    updateFlowInProject,
    republishFlow,
    saveStateToGit,
}

type DeleteFlowFromGitOperation = {
    type: 'delete_flow_from_git'
    flowId: string
}

type DeleteFlowFromProjectOperation = {
    type: 'delete_flow_from_project'
    flowId: string
}

type UpsertFlowIntoProjectOperation = {
    type: 'upsert_flow_into_project'
    flow: PopulatedFlow
}

type UpsertFlowOperation = {
    type: 'upsert_flow_into_git'
    flow: PopulatedFlow
}

export type FlowSyncOperation =
    | DeleteFlowFromGitOperation
    | UpsertFlowIntoProjectOperation
    | DeleteFlowFromProjectOperation
    | UpsertFlowOperation
