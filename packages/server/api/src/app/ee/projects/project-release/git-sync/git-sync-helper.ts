import fs from 'fs/promises'
import path from 'path'
import { fileSystemUtils } from '@activepieces/server-utils'
import { AppConnectionScope, ConnectionState, FlowState, GitRepo, PopulatedFlow, PopulatedTable, ProjectState, TableState } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { SimpleGit } from 'simple-git'
import { appConnectionService } from '../../../../app-connection/app-connection-service/app-connection-service'
import { projectStateService } from '../project-state/project-state.service'
import { gitHelper } from './git-helper'

export const gitSyncHelper = (log: FastifyBaseLogger) => ({
    async getStateFromGit({ flowPath, connectionsFolderPath, tablesFolderPath }: GetStateFromGitParams): Promise<ProjectState> {
        try {
            const [flows, connections, tables] = await Promise.all([
                readFlowsFromGit(flowPath, log),
                readConnectionsFromGit(connectionsFolderPath),
                readTablesFromGit(tablesFolderPath, log),
            ])
            return { flows, connections, tables }
        }
        catch (error) {
            log.error({ err: error }, '[gitSyncHelper#getStateFromGit] Failed to read flow files')
            throw error
        }
    },

    async upsertFlowToGit({ fileName, flow, flowFolderPath }: UpsertFlowIntoProjectParams): Promise<void> {
        try {
            const flowJsonPath = resolveSafeJsonPath({ fileName, baseDir: flowFolderPath })
            await fileSystemUtils.assertPathInside({ baseDir: flowFolderPath, targetPath: flowJsonPath })
            await fs.mkdir(path.dirname(flowJsonPath), { recursive: true })
            const flowState = await projectStateService(log).getFlowState(flow)
            await fs.writeFile(flowJsonPath, JSON.stringify(flowState, null, 2))
        }
        catch (error) {
            log.error({ err: error, fileName }, '[gitSyncHelper#upsertFlowToGit] Failed to write flow file')
            throw error
        }
    },

    async upsertTableToGit({ fileName, table, tablesFolderPath }: UpsertTableIntoProjectParams): Promise<void> {
        const tableJsonPath = resolveSafeJsonPath({ fileName, baseDir: tablesFolderPath })
        await fileSystemUtils.assertPathInside({ baseDir: tablesFolderPath, targetPath: tableJsonPath })
        await fs.mkdir(path.dirname(tableJsonPath), { recursive: true })
        const tableState = projectStateService(log).getTableState(table)
        await fs.writeFile(tableJsonPath, JSON.stringify(tableState, null, 2))
    },

    async upsertConnectionToGit({ fileName, connection, folderPath }: UpsertConnectionIntoProjectParams): Promise<void> {
        const connectionJsonPath = resolveSafeJsonPath({ fileName, baseDir: folderPath })
        await fileSystemUtils.assertPathInside({ baseDir: folderPath, targetPath: connectionJsonPath })
        await fs.mkdir(path.dirname(connectionJsonPath), { recursive: true })
        await fs.writeFile(connectionJsonPath, JSON.stringify(connection, null, 2))
    },

    async deleteFromGit({ fileName, folderPath }: DeleteFromProjectParams): Promise<boolean> {
        const jsonPath = resolveSafeJsonPath({ fileName, baseDir: folderPath })
        await fileSystemUtils.assertPathInside({ baseDir: folderPath, targetPath: jsonPath })
        const exists = await fileSystemUtils.fileExists(jsonPath)
        if (exists) {
            await fs.unlink(jsonPath)
        }
        return exists
    },

    async updateConectionStateOnGit({ flowFolderPath, connectionsFolderPath, git, gitRepo, platformId, log }: ClearUnusedConnectionsFromGitParams): Promise<void> {
        const oldConnections = await readConnectionsFromGit(connectionsFolderPath)
        await Promise.all(oldConnections.map((connection) => this.deleteFromGit({ fileName: connection.externalId, folderPath: connectionsFolderPath })))

        const flows = await readFlowsFromGit(flowFolderPath, log)
        const connectionsInFlows = flows.flatMap((flow) => flow.version.connectionIds)
        const currentConnections = await appConnectionService(log).list({
            projectId: gitRepo.projectId,
            externalIds: connectionsInFlows,
            platformId,
            scope: AppConnectionScope.PROJECT,
            cursorRequest: null,
            limit: 10000,
            pieceName: undefined,
            displayName: undefined,
            status: undefined,
        })
        await Promise.all(currentConnections.data.map(async (connection) => {
            await this.upsertConnectionToGit({
                fileName: connection.externalId,
                connection: {
                    externalId: connection.externalId,
                    displayName: connection.displayName,
                    pieceName: connection.pieceName,
                },
                folderPath: connectionsFolderPath,
            })
        }))

        await gitHelper.commitAndPush(git, gitRepo, 'chore: update and remove unused connections')
    },

})

const SAFE_FILENAME_PATTERN = /^[A-Za-z0-9._-]{1,128}$/

function resolveSafeJsonPath({ fileName, baseDir }: { fileName: string, baseDir: string }): string {
    if (!SAFE_FILENAME_PATTERN.test(fileName) || fileName === '.' || fileName === '..') {
        throw new Error(`invalid fileName "${fileName}": only alphanumeric, dot, dash and underscore are allowed`)
    }
    return path.join(baseDir, `${fileName}.json`)
}

async function readFlowsFromGit(flowFolderPath: string, log: FastifyBaseLogger): Promise<FlowState[]> {
    const flowFiles = await fs.readdir(flowFolderPath)
    const stateService = projectStateService(log)
    return Promise.all(flowFiles.map(async (file) => {
        const flow: PopulatedFlow = JSON.parse(await fs.readFile(path.join(flowFolderPath, file), 'utf-8'))
        return stateService.getFlowState(flow)
    }))
}

async function readConnectionsFromGit(connectionsFolderPath: string): Promise<ConnectionState[]> {
    const connectionFiles = await fs.readdir(connectionsFolderPath)
    return Promise.all(connectionFiles.map(async (file) => {
        return JSON.parse(await fs.readFile(path.join(connectionsFolderPath, file), 'utf-8')) as ConnectionState
    }))
}

async function readTablesFromGit(tablesFolderPath: string, log: FastifyBaseLogger): Promise<TableState[]> {
    const tableFiles = await fs.readdir(tablesFolderPath)
    const stateService = projectStateService(log)
    return Promise.all(tableFiles.map(async (file) => {
        const table = JSON.parse(await fs.readFile(path.join(tablesFolderPath, file), 'utf-8'))
        return stateService.getTableState(table)
    }))
}

type GetStateFromGitParams = {
    flowPath: string
    connectionsFolderPath: string
    tablesFolderPath: string
}

type UpsertFlowIntoProjectParams = {
    fileName: string
    flow: FlowState
    flowFolderPath: string
}

type UpsertConnectionIntoProjectParams = {
    fileName: string
    connection: ConnectionState
    folderPath: string
}

type UpsertTableIntoProjectParams = {
    fileName: string
    table: PopulatedTable
    tablesFolderPath: string
}

type DeleteFromProjectParams = {
    fileName: string
    folderPath: string
}

type DeleteFlowFromProjectOperation = {
    type: 'delete_flow_from_project'
    fileName: string
}

type UpsertFlowIntoProjectOperation = {
    type: 'upsert_flow_into_project'
    flow: PopulatedFlow
}

export type FlowSyncOperation =
    | UpsertFlowIntoProjectOperation
    | DeleteFlowFromProjectOperation

type ClearUnusedConnectionsFromGitParams = {
    flowFolderPath: string
    connectionsFolderPath: string
    platformId: string
    git: SimpleGit
    gitRepo: GitRepo
    log: FastifyBaseLogger
}
