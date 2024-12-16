import fs from 'fs/promises'
import path from 'path'
import { ProjectSyncError } from '@activepieces/ee-shared'
import { fileExists } from '@activepieces/server-shared'
import { Flow, flowMigrations, FlowOperationType, flowStructureUtil, PopulatedFlow } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowRepo } from '../../flows/flow/flow.repo'
import { flowService } from '../../flows/flow/flow.service'
import { projectService } from '../../project/project-service'
import { GitFile } from './project-diff/project-diff.service'
import { ProjectMappingState } from './project-diff/project-mapping-state'

export const gitSyncHelper = (log: FastifyBaseLogger) => ({
    async getStateFromDB(projectId: string): Promise<PopulatedFlow[]> {
        const flows = await flowRepo().findBy({
            projectId,
        })
        return Promise.all(
            flows.map((f) => {
                return flowService(log).getOnePopulatedOrThrow({
                    id: f.id,
                    projectId,
                    removeConnectionsName: false,
                    removeSampleData: true,
                })
            }),
        )
    },

    async getMappingStateFromGit(
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
    },

    async getStateFromGit(flowPath: string): Promise<GitFile[]> {
        const flowFiles = await fs.readdir(flowPath)
        const parsedFlows: GitFile[] = []
        for (const file of flowFiles) {
            const flow: PopulatedFlow = JSON.parse(
                await fs.readFile(path.join(flowPath, file), 'utf-8'),
            )
            const migratedFlowVersion = flowMigrations.apply(flow.version)
            parsedFlows.push({
                flow: {
                    ...flow,
                    version: migratedFlowVersion,
                },
                baseFilename: path.basename(file, '.json'),
            })
        }
        return parsedFlows
    },

    async createFlowInProject(flow: PopulatedFlow, projectId: string): Promise<PopulatedFlow> {
        const createdFlow = await flowService(log).create({
            projectId,
            request: {
                displayName: flow.version.displayName,
                projectId,
            },
        })
        return this.updateFlowInProject(createdFlow, flow, projectId)
    },

    async updateFlowInProject(originalFlow: PopulatedFlow, newFlow: PopulatedFlow,
        projectId: string,
    ): Promise<PopulatedFlow> {
        const project = await projectService.getOneOrThrow(projectId)

        const newFlowVersion = flowStructureUtil.transferFlow(newFlow.version, (step) => {
            const oldStep = flowStructureUtil.getStep(step.name, originalFlow.version.trigger)
            if (oldStep?.settings?.input?.auth) {
                step.settings.input.auth = oldStep.settings.input.auth
            }
            return step
        })

        return flowService(log).update({
            id: originalFlow.id,
            projectId,
            platformId: project.platformId,
            lock: true,
            userId: project.ownerId,
            operation: {
                type: FlowOperationType.IMPORT_FLOW,
                request: {
                    displayName: newFlow.version.displayName,
                    trigger: newFlowVersion.trigger,
                    schemaVersion: newFlow.version.schemaVersion,
                },
            },
        })
    },

    async republishFlow(flowId: string, projectId: string): Promise<ProjectSyncError | null> {
        const project = await projectService.getOneOrThrow(projectId)
        const flow = await flowService(log).getOnePopulated({ id: flowId, projectId })
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
            await flowService(log).update({
                id: flowId,
                projectId,
                platformId: project.platformId,
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
    },

    async upsertFlowToGit(fileName: string, flow: Flow, flowFolderPath: string): Promise<void> {
        const flowJsonPath = path.join(flowFolderPath, `${fileName}.json`)
        await fs.writeFile(flowJsonPath, JSON.stringify(flow, null, 2))
    },

    async deleteFlowFromGit(flowId: string, flowFolderPath: string): Promise<boolean> {
        const flowJsonPath = path.join(flowFolderPath, `${flowId}.json`)
        const exists = await fileExists(flowJsonPath)
        if (exists) {
            await fs.unlink(flowJsonPath)
        }
        return exists
    },

    async deleteFlowFromProject(flowId: string, projectId: string): Promise<void> {
        const flow = await flowService(log).getOne({ id: flowId, projectId })
        if (!flow) {
            return
        }
        await flowService(log).delete({ id: flowId, projectId })
    },
})

type DeleteFlowFromProjectOperation = {
    type: 'delete_flow_from_project'
    flowId: string
}

type UpsertFlowIntoProjectOperation = {
    type: 'upsert_flow_into_project'
    flow: PopulatedFlow
}

export type FlowSyncOperation =
    | UpsertFlowIntoProjectOperation
    | DeleteFlowFromProjectOperation
