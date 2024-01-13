import { Flow, FlowOperationType, PopulatedFlow } from '@activepieces/shared'
import { flowService } from '../../flows/flow/flow.service'
import fs from 'fs/promises'
import path from 'path'
import { projectService } from '../../project/project-service'
import { flowRepo } from '../../flows/flow/flow.repo'

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

export type FlowSyncOperation = DeleteFlowFromGitOperation | UpsertFlowIntoProjectOperation | DeleteFlowFromProjectOperation | UpsertFlowOperation

async function fetchFlowsForProject(projectId: string): Promise<PopulatedFlow[]> {
    const flows = await flowRepo.findBy({
        projectId,
    })
    return Promise.all(flows.map(f => {
        return flowService.getOnePopulatedOrThrow({
            id: f.id,
            projectId,
            removeSecrets: false,
        })
    }))
}

async function parseFlowsFromDirectory(flowPath: string): Promise<PopulatedFlow[]> {
    const flowFiles = await fs.readdir(flowPath)
    const parsedFlows = []
    for (const file of flowFiles) {
        const flow: PopulatedFlow = JSON.parse(await fs.readFile(path.join(flowPath, file), 'utf-8'))
        parsedFlows.push(flow)
    }
    return parsedFlows
}

async function applyFlowOperations({ projectId, flowFolderPath, operations }: { projectId: string, flowFolderPath: string, operations: FlowSyncOperation[] }): Promise<void> {
    for (const operation of operations) {
        switch (operation.type) {
            case 'upsert_flow_into_git':
            {
                await upsertFlowToGit(operation.flow, flowFolderPath)
                break
            }
            case 'delete_flow_from_git':
            {
                await deleteFlowFromGit(operation.flowId, flowFolderPath)
                break
            }
            case 'upsert_flow_into_project':
            {
                await upsertFlowToProject(operation.flow, projectId)
                break
            }
            case 'delete_flow_from_project':
            {
                await deleteFlowFromProject(operation.flowId, projectId)
                break
            }
        }
    }
}

async function upsertFlowToProject(flow: PopulatedFlow, projectId: string): Promise<void> {
    const existingFlow = await flowService.getOne({ id: flow.id, projectId })
    let flowId = flow.id
    if (!existingFlow) {
        const newFlow = await flowService.create({
            projectId,
            request: {
                displayName: flow.version.displayName,
                folderId: flow.folderId ?? undefined,
                projectId,
            },
        })
        flowId = newFlow.id
    }
    const project = await projectService.getOneOrThrow(projectId)
    await flowService.update({
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

async function upsertFlowToGit(flow: Flow, flowFolderPath: string): Promise<void> {
    const flowJsonPath = path.join(flowFolderPath, `${flow.id}.json`)
    await fs.writeFile(flowJsonPath, JSON.stringify(flow, null, 2))
}

async function deleteFlowFromGit(flowId: string, flowFolderPath: string): Promise<void> {
    const flowJsonPath = path.join(flowFolderPath, `${flowId}.json`)
    await fs.unlink(flowJsonPath)
}

async function deleteFlowFromProject(flowId: string, projectId: string): Promise<void> {
    await flowService.delete({ id: flowId, projectId })
}

export const gitSyncHelper = {
    fetchFlowsForProject,
    parseFlowsFromDirectory,
    applyFlowOperations,
}
