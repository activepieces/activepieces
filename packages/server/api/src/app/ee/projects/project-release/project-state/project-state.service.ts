import { AppConnectionScope, AppConnectionStatus, AppConnectionType, assertNotNullOrUndefined, ConnectionOperationType, ConnectionState, DiffState, FieldState, FieldType, FileCompression, FileId, FileType, FlowAction, FlowProjectOperationType, FlowState, FlowStatus, FlowSyncError, isNil, PopulatedFlow, PopulatedTable, ProjectId, ProjectState, TableOperationType, TableState } from '@activepieces/shared'
import { Value } from '@sinclair/typebox/value'
import { FastifyBaseLogger } from 'fastify'
import { appConnectionService } from '../../../../app-connection/app-connection-service/app-connection-service'
import { fileService } from '../../../../file/file.service'
import { flowRepo } from '../../../../flows/flow/flow.repo'
import { flowService } from '../../../../flows/flow/flow.service'
import { flowMigrations } from '../../../../flows/flow-version/migrations'
import { fieldService } from '../../../../tables/field/field.service'
import { tableService } from '../../../../tables/table/table.service'
import { projectStateHelper } from './project-state-helper'

export const projectStateService = (log: FastifyBaseLogger) => ({
    async apply({ projectId, diffs, platformId }: ApplyProjectStateRequest): Promise<void> {
        const { flows, connections, tables } = diffs
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
                            projectId,
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
                case TableOperationType.DELETE_TABLE: {
                    const table = await tableService.getOneByExternalIdOrThrow({
                        externalId: operation.tableState.externalId,
                        projectId,
                    })
                    await tableService.delete({
                        id: table.id,
                        projectId,
                    })
                    break
                }
            }
        }

        for (const operation of flows) {
            switch (operation.type) {
                case FlowProjectOperationType.UPDATE_FLOW: {
                    const flowUpdated = await projectStateHelper(log).updateFlowInProject(operation.flowState, operation.newFlowState, projectId)
                    const keepOriginalState = projectStateHelper(log).republishFlow({ flow: flowUpdated, projectId, status: operation.flowState.status })
                    publishJobs.push(keepOriginalState)
                    break
                }
                case FlowProjectOperationType.CREATE_FLOW: {
                    const flowCreated = await projectStateHelper(log).createFlowInProject(operation.flowState, projectId)
                    const alwaysEnableNewFlow = projectStateHelper(log).republishFlow({ flow: flowCreated, projectId, status: FlowStatus.ENABLED })
                    publishJobs.push(alwaysEnableNewFlow)
                    break
                }
                case FlowProjectOperationType.DELETE_FLOW: {
                    await projectStateHelper(log).deleteFlowFromProject(operation.flowState.id, projectId)
                    break
                }
            }
        }
    },
    async save(projectId: ProjectId, name: string, log: FastifyBaseLogger): Promise<FileId> {
        const fileToSave: ProjectState = await this.getProjectState(projectId, log)

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
    async getProjectState(projectId: ProjectId, log: FastifyBaseLogger): Promise<ProjectState> {
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

        const connections: ConnectionState[] = await appConnectionService(log).getManyConnectionStates({
            projectId,
        })

        const tables = await tableService.list({
            projectId,
            cursor: undefined,
            limit: 1000,
            name: undefined,
            externalIds: undefined,
        })
        const populatedTables = await Promise.all(tables.data.map(async (table) => {
            const fields = await fieldService.getAll({
                projectId,
                tableId: table.id,
            })
            return { ...table, fields }
        }))

        return toProjectState({
            flows: allPopulatedFlows,
            connections,
            tables: populatedTables,
            log,
        })
    },
    async getFlowState(flow: PopulatedFlow): Promise<FlowState> {
        const flowState: FlowState = {
            ...flow,
            externalId: flow.externalId ?? flow.id,
            version: await flowMigrations.apply(flow.version),
        }
        const cleanedFlowState = Value.Clean(FlowState, flowState) as FlowState
        cleanedFlowState.version.trigger.nextAction = isNil(cleanedFlowState.version.trigger.nextAction) ? undefined : Value.Clean(FlowAction, cleanedFlowState.version.trigger.nextAction)
        return cleanedFlowState
    },
    getTableState(table: PopulatedTable): TableState {
        const fields: FieldState[] = table.fields.map((field) => ({
            name: field.name,
            type: field.type,
            externalId: field.externalId,
            data: field.type === FieldType.STATIC_DROPDOWN ? field.data : undefined,
        }))
        const tableState: TableState = {
            id: table.id,
            externalId: table.externalId ?? table.id,
            name: table.name,
            fields,
        }
        return Value.Clean(TableState, tableState) as TableState
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

async function toProjectState({ flows, connections, tables, log }: ToProjectStateParams): Promise<ProjectState> {
    const flowsInProjectState: FlowState[] = await Promise.all(flows.map(async (flow) => projectStateService(log).getFlowState(flow)))

    const tablesInProjectState: TableState[] = tables.map((table) => projectStateService(log).getTableState(table))

    return {
        flows: flowsInProjectState,
        connections,
        tables: tablesInProjectState,
    }
}

type ApplyProjectStateRequest = {
    projectId: string
    diffs: DiffState
    log: FastifyBaseLogger
    platformId: string
}

type ToProjectStateParams = {
    flows: PopulatedFlow[]
    connections: ConnectionState[]
    tables: PopulatedTable[]
    log: FastifyBaseLogger
}