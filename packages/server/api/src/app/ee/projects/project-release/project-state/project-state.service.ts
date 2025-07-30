import { AgentOperationType, AppConnectionScope, AppConnectionStatus, AppConnectionType, assertNotNullOrUndefined, ConnectionOperationType, DiffState, FieldState, FieldType, FileCompression, FileId, FileType, FlowProjectOperationType, FlowSyncError, isNil, McpOperationType, ProjectId, ProjectState, TableOperationType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { agentsService } from '../../../../agents/agents-service'
import { appConnectionService } from '../../../../app-connection/app-connection-service/app-connection-service'
import { fileService } from '../../../../file/file.service'
import { flowRepo } from '../../../../flows/flow/flow.repo'
import { flowService } from '../../../../flows/flow/flow.service'
import { mcpService } from '../../../../mcp/mcp-service'
import { fieldService } from '../../../../tables/field/field.service'
import { tableService } from '../../../../tables/table/table.service'
import { projectStateHelper } from './project-state-helper'

export const projectStateService = (log: FastifyBaseLogger) => ({
    async apply({ projectId, diffs, selectedFlowsIds, platformId }: ApplyProjectStateRequest): Promise<void> {
        const { flows, connections, tables, agents, mcps } = diffs
        const publishJobs: Promise<FlowSyncError | null>[] = []
        for (const state of connections) {
            switch (state.type) {
                case ConnectionOperationType.CREATE_CONNECTION: {
                    await appConnectionService(log).upsert({
                        scope: AppConnectionScope.PROJECT,
                        platformId,
                        projectIds: [projectId],
                        externalId: state.connectionState.externalId,
                        displayName: state.connectionState.displayName,
                        pieceName: state.connectionState.pieceName,
                        type: AppConnectionType.NO_AUTH,
                        status: AppConnectionStatus.MISSING,
                        value: {
                            type: AppConnectionType.NO_AUTH,
                        },
                        ownerId: null,
                    })
                    break
                }
                case ConnectionOperationType.UPDATE_CONNECTION: {
                    const existingConnection = await appConnectionService(log).getOne({
                        externalId: state.newConnectionState.externalId,
                        platformId,
                        projectId,
                    })
                    if (!isNil(existingConnection)) {
                        await appConnectionService(log).update({
                            projectIds: [projectId],
                            platformId,
                            id: existingConnection.id,
                            scope: AppConnectionScope.PROJECT,
                            request: {
                                displayName: state.newConnectionState.displayName,
                                projectIds: null,
                            },
                        })
                    }
                    break
                }
            }
        }

        for (const operation of tables) {
            switch (operation.type) {
                case TableOperationType.CREATE_TABLE: {
                    const table = await tableService.create({
                        projectId,
                        request: {
                            name: operation.tableState.name,
                            externalId: operation.tableState.externalId,
                        },
                    })

                    await Promise.all(operation.tableState.fields.map(async (field) => {
                        await handleCreateField(projectId, field, table.id)
                    }))
                    break
                }
                case TableOperationType.UPDATE_TABLE: {
                    const table = await tableService.update({
                        projectId,
                        id: operation.tableState.id,
                        request: {
                            name: operation.newTableState.name,
                        },
                    })

                    const fields = await fieldService.getAll({
                        projectId,
                        tableId: table.id,
                    })

                    await Promise.all(operation.newTableState.fields.map(async (field) => {
                        const existingField = fields.find((f) => f.externalId === field.externalId)
                        if (!isNil(existingField)) {
                            await fieldService.update({
                                projectId,
                                id: existingField.id,
                                request: field,
                            })
                        }
                        else {
                            await handleCreateField(projectId, field, table.id)
                        }
                    }))

                    const fieldsToDelete = fields.filter((f) => !operation.newTableState.fields.some((nf) => nf.externalId === f.externalId))

                    await Promise.all(fieldsToDelete.map(async (field) => {
                        await fieldService.delete({
                            id: field.id,
                            projectId,
                        })
                    }))
                    break
                }
            }
        }

        for (const operation of flows) {
            switch (operation.type) {
                case FlowProjectOperationType.UPDATE_FLOW: {
                    if (!isNil(selectedFlowsIds) && !selectedFlowsIds.includes(operation.newFlowState.id)) {
                        continue
                    }
                    const flowUpdated = await projectStateHelper(log).updateFlowInProject(operation.flowState, operation.newFlowState, projectId)
                    publishJobs.push(projectStateHelper(log).republishFlow({ flow: flowUpdated, projectId }))
                    break
                }
                case FlowProjectOperationType.CREATE_FLOW: {
                    if (!isNil(selectedFlowsIds) && !selectedFlowsIds.includes(operation.flowState.id)) {
                        continue
                    }
                    const flowCreated = await projectStateHelper(log).createFlowInProject(operation.flowState, projectId)
                    publishJobs.push(projectStateHelper(log).republishFlow({ flow: flowCreated, projectId }))
                    break
                }
                case FlowProjectOperationType.DELETE_FLOW: {
                    if (!isNil(selectedFlowsIds) && !selectedFlowsIds.includes(operation.flowState.id)) {
                        continue
                    }
                    await projectStateHelper(log).deleteFlowFromProject(operation.flowState.id, projectId)
                    break
                }
            }
        }

        for (const operation of mcps) {
            switch (operation.type) {
                case McpOperationType.CREATE_MCP: {
                    const createdMcp = await mcpService(log).create({
                        name: operation.mcpState.name,
                        projectId,
                        externalId: operation.mcpState.externalId,
                    })

                    // Update the MCP with the exact tools from the state
                    await mcpService(log).update({
                        mcpId: createdMcp.id,
                        name: operation.mcpState.name,
                        tools: operation.mcpState.tools,
                    })
                    break
                }
                case McpOperationType.UPDATE_MCP: {
                    const existingMcp = await mcpService(log).getOneByExternalIdOrThrow({
                        externalId: operation.newMcpState.externalId,
                        projectId,
                    })
                    
                    await mcpService(log).update({
                        mcpId: existingMcp.id,
                        name: operation.newMcpState.name,
                        tools: operation.newMcpState.tools,
                    })
                    break
                }
            }
        }

        for (const operation of agents) {
            switch (operation.type) {
                case AgentOperationType.CREATE_AGENT: {
                    // Create the agent with all properties (agentsService.create already creates and associates an MCP)
                    const createdAgent = await agentsService(log).create({
                        displayName: operation.agentState.displayName,
                        description: operation.agentState.description,
                        profilePictureUrl: operation.agentState.profilePictureUrl,
                        systemPrompt: operation.agentState.systemPrompt,
                        testPrompt: operation.agentState.testPrompt,
                        outputType: operation.agentState.outputType,
                        outputFields: operation.agentState.outputFields,
                        platformId,
                        projectId,
                        externalId: operation.agentState.externalId,
                        mcpExternalId: operation.agentState.mcp.externalId,
                    })
                    
                    // Update the MCP with the exact tools from the state
                    const mcpState = operation.agentState.mcp
                    await mcpService(log).update({
                        mcpId: createdAgent.mcpId,
                        name: mcpState.name,
                        tools: mcpState.tools,
                    })
                    break
                }
                case AgentOperationType.UPDATE_AGENT: {
                    const existingAgent = await agentsService(log).getOneByExternalIdOrThrow({
                        externalId: operation.newAgentState.externalId,
                        projectId,
                    })
                    
                    // Update the agent
                    await agentsService(log).update({
                        id: existingAgent.id,
                        displayName: operation.newAgentState.displayName,
                        systemPrompt: operation.newAgentState.systemPrompt,
                        description: operation.newAgentState.description,
                        testPrompt: operation.newAgentState.testPrompt,
                        outputType: operation.newAgentState.outputType,
                        outputFields: operation.newAgentState.outputFields,
                        projectId,
                    })
                    
                    // Update the associated MCP with new tools
                    const mcpState = operation.newAgentState.mcp
                    await mcpService(log).update({
                        mcpId: existingAgent.mcpId,
                        name: mcpState.name,
                        tools: mcpState.tools,
                    })
                    break
                }
            }
        }

        
    },
    async save(projectId: ProjectId, name: string, log: FastifyBaseLogger): Promise<FileId> {
        const fileToSave: ProjectState = await this.getCurrentState(projectId, log)

        const fileData = Buffer.from(JSON.stringify(fileToSave))

        const file = await fileService(log).save({
            projectId,
            type: FileType.PROJECT_RELEASE,
            fileName: `${name}.json`,
            size: fileData.byteLength,
            data: fileData,
            compression: FileCompression.NONE,
        })
        return file.id
    },
    async getStateFromRelease(projectId: ProjectId, fileId: FileId, log: FastifyBaseLogger): Promise<ProjectState> {
        const file = await fileService(log).getFileOrThrow({
            projectId,
            fileId,
            type: FileType.PROJECT_RELEASE,
        })
        return JSON.parse(file.data.toString()) as ProjectState
    },
    async getCurrentState(projectId: ProjectId, log: FastifyBaseLogger): Promise<ProjectState> {
        const flows = await flowRepo().find({
            where: {
                projectId,
            },
        })
        const allPopulatedFlows = await Promise.all(flows.map(async (flow) => {
            return flowService(log).getOnePopulatedOrThrow({
                id: flow.id,
                projectId,
            })
        }))
        const connections = await appConnectionService(log).getManyConnectionStates({
            projectId,
        })

        const tables = await tableService.list({
            projectId,
            cursor: undefined,
            limit: 1000,
            name: undefined,
            externalIds: undefined,
        })
        const allPopulatedTables = await Promise.all(tables.data.map(async (table) => {
            const fields = await fieldService.getAll({
                projectId,
                tableId: table.id,
            })
            return {
                ...table,
                fields,
            }
        }))

        const agents = await agentsService(log).getAllPopulated(projectId)
        const mcps = await mcpService(log).list({
            projectId,
            limit: 1000,
            cursorRequest: null,
            name: undefined,
        })

        return {
            flows: allPopulatedFlows,
            connections,
            tables: allPopulatedTables,
            agents,
            mcps: mcps.data,
        }
    },
})

async function handleCreateField(projectId: ProjectId, field: FieldState, tableId: string) {
    switch (field.type) {
        case FieldType.STATIC_DROPDOWN: {
            assertNotNullOrUndefined(field.data, 'Data is required for static dropdown field')
            await fieldService.create({
                projectId,
                request: {
                    name: field.name,
                    type: field.type,
                    tableId,
                    data: field.data,
                    externalId: field.externalId,
                },
            })
            break
        }
        case FieldType.DATE:
        case FieldType.NUMBER:
        case FieldType.TEXT: {
            await fieldService.create({
                projectId,
                request: {
                    name: field.name,
                    type: field.type,
                    tableId,
                    externalId: field.externalId,
                },
            })
            break
        }
    }
}

type ApplyProjectStateRequest = {
    projectId: string
    diffs: DiffState
    selectedFlowsIds: string[] | null
    log: FastifyBaseLogger
    platformId: string
}
