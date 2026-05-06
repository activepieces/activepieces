import { memoryLock } from '@activepieces/server-utils'
import {
    ActivepiecesError,
    apId,
    AppConnectionScope,
    AppConnectionStatus,
    AppConnectionType,
    ConnectionAwaitingAuthorization,
    ConnectionOperationType,
    ConnectionState,
    FlowProjectOperationType,
    FolderOperationType,
    FolderState,
    InstalledPiece,
    isNil,
    PackageType,
    PieceInstallFailure,
    PieceScope,
    PlatformId,
    ProjectId,
    ProjectReplaceApplied,
    ProjectReplaceErrorKind,
    ProjectReplaceItemFailure,
    ProjectReplaceItemKind,
    ProjectReplaceItemOp,
    ProjectReplacePreflightError,
    ProjectReplaceRequest,
    ProjectReplaceResponse,
    ProjectState,
    RequiredPiece,
    TableOperationType,
    unique,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import semver from 'semver'
import { ArrayContains, In } from 'typeorm'
import { appConnectionsRepo } from '../../../app-connection/app-connection-service/app-connection-service'
import { flowFolderService } from '../../../flows/folder/folder.service'
import { encryptUtils } from '../../../helper/encryption'
import { apVersionUtil } from '../../../helper/system/system-props'
import { pieceMetadataService } from '../../../pieces/metadata/piece-metadata-service'
import { pieceInstallService } from '../../../pieces/piece-install-service'
import { fieldService } from '../../../tables/field/field.service'
import { tableService } from '../../../tables/table/table.service'
import { connectionDiffService } from '../project-release/project-state/diff/connection-diff.service'
import { flowDiffService } from '../project-release/project-state/diff/flow-diff.service'
import { tableDiffService } from '../project-release/project-state/diff/table-diff.service'
import { projectStateHelper } from '../project-release/project-state/project-state-helper'
import { projectStateService } from '../project-release/project-state/project-state.service'
import { folderDiffService } from './folder-diff.service'

export const projectReplaceService = {
    async replace({ projectId, platformId, request, log }: ReplaceParams): Promise<ReplaceOutcome> {
        const startedAt = Date.now()
        const lockKey = `project-replace:${projectId}`
        const lock = await memoryLock.tryAcquire(lockKey)
        if (isNil(lock)) {
            return {
                kind: 'LOCKED',
                durationMs: Date.now() - startedAt,
            }
        }
        try {
            const preflightErrors = await runPreflight({ platformId, projectId, request, log })
            if (preflightErrors.length > 0) {
                return {
                    kind: 'PREFLIGHT_FAILED',
                    errors: preflightErrors,
                    durationMs: Date.now() - startedAt,
                }
            }
            const { failures: installFailures, installed: piecesInstalled } = await runInstallPhase({ platformId, request, log })
            if (installFailures.length > 0) {
                return {
                    kind: 'INSTALL_FAILED',
                    failures: installFailures,
                    durationMs: Date.now() - startedAt,
                }
            }
            const response = await applyReplace({ projectId, platformId, request, log })
            return {
                kind: response.failed.length === 0 ? 'SUCCESS' : 'PARTIAL_FAILURE',
                response: { ...response, piecesInstalled, durationMs: Date.now() - startedAt },
                durationMs: Date.now() - startedAt,
            }
        }
        finally {
            await lock.release()
        }
    },
}

async function runInstallPhase({ platformId, request, log }: InstallPhaseParams): Promise<InstallPhaseResult> {
    const failures: PieceInstallFailure[] = []
    const installed: InstalledPiece[] = []
    for (const piece of request.requiredPieces) {
        const found = await pieceMetadataService(log).get({
            name: piece.name,
            version: piece.version,
            platformId,
        })
        if (!isNil(found) && found.version === piece.version) {
            continue
        }
        try {
            await pieceInstallService(log).installPiece(platformId, {
                packageType: PackageType.REGISTRY,
                scope: PieceScope.PLATFORM,
                pieceName: piece.name,
                pieceVersion: piece.version,
            })
            installed.push({
                name: piece.name,
                version: piece.version,
                pieceType: piece.pieceType,
            })
        }
        catch (e) {
            failures.push({
                pieceName: piece.name,
                version: piece.version,
                pieceType: piece.pieceType,
                message: errorMessage(e),
            })
        }
    }
    return { failures, installed }
}

async function runPreflight({ platformId, projectId, request, log }: PreflightParams): Promise<ProjectReplacePreflightError[]> {
    const errors: ProjectReplacePreflightError[] = []

    const destVersion = await apVersionUtil.getCurrentRelease()
    checkApVersion({ sourceVersion: request.sourceActivepiecesVersion, destVersion, errors })

    for (const piece of request.requiredPieces) {
        await checkPiece({ piece, platformId, log, errors })
    }

    await checkConnections({ projectId, platformId, request, errors })

    return errors
}

function checkApVersion({ sourceVersion, destVersion, errors }: CheckApVersionParams): void {
    const source = semver.parse(sourceVersion)
    const dest = semver.parse(destVersion)
    if (source === null || dest === null) {
        errors.push({
            kind: ProjectReplaceErrorKind.AP_VERSION_MISMATCH,
            sourceVersion,
            destVersion,
            message: `Cannot parse versions (source=${sourceVersion}, dest=${destVersion})`,
        })
        return
    }
    if (source.major !== dest.major) {
        errors.push({
            kind: ProjectReplaceErrorKind.AP_VERSION_MISMATCH,
            sourceVersion,
            destVersion,
            message: `Major version mismatch (source major=${source.major}, dest major=${dest.major})`,
        })
        return
    }
    if (semver.lt(destVersion, sourceVersion)) {
        errors.push({
            kind: ProjectReplaceErrorKind.AP_VERSION_MISMATCH,
            sourceVersion,
            destVersion,
            message: `Destination Activepieces version (${destVersion}) is older than source (${sourceVersion})`,
        })
    }
}

async function checkPiece({ piece, platformId, log, errors }: CheckPieceParams): Promise<void> {
    const found = await pieceMetadataService(log).get({
        name: piece.name,
        version: piece.version,
        platformId,
    })
    if (isNil(found)) {
        return
    }
    if (found.version !== piece.version) {
        errors.push({
            kind: ProjectReplaceErrorKind.PIECE_VERSION_MISMATCH,
            pieceName: piece.name,
            sourceVersion: piece.version,
            destVersion: found.version,
        })
    }
}

async function checkConnections({ projectId, platformId, request, errors }: CheckConnectionsParams): Promise<void> {
    if (request.connections.length === 0) {
        return
    }
    const externalIds = unique(request.connections.map((c) => c.externalId))
    const existing = await appConnectionsRepo().find({
        where: {
            projectIds: ArrayContains([projectId]),
            platformId,
            externalId: In(externalIds),
        },
        select: { externalId: true, pieceName: true },
    })
    const destByExternalId = new Map(existing.map((row) => [row.externalId, row.pieceName]))
    const seen = new Set<string>()
    for (const conn of request.connections) {
        if (seen.has(conn.externalId)) continue
        seen.add(conn.externalId)
        const destPieceName = destByExternalId.get(conn.externalId)
        if (!isNil(destPieceName) && destPieceName !== conn.pieceName) {
            errors.push({
                kind: ProjectReplaceErrorKind.CONNECTION_PIECE_MISMATCH,
                externalId: conn.externalId,
                expectedPieceName: conn.pieceName,
                foundPieceName: destPieceName,
            })
        }
    }
}

async function applyReplace({ projectId, platformId, request, log }: ApplyParams): Promise<ProjectReplaceResponse> {
    const newState: ProjectState = {
        flows: request.flows,
        tables: request.tables,
        folders: request.folders,
        connections: request.connections,
    }
    const currentState = await projectStateService(log).getProjectState(projectId, log)
    const currentFolders = await loadCurrentFolderStates({ projectId, log })

    const flowOps = await flowDiffService.diff({ newState, currentState })
    const tableOps = tableDiffService.diff({ newState, currentState })
    const folderOps = folderDiffService.diff({ newFolders: request.folders, currentFolders })
    const connectionOps = connectionDiffService.diff({ newState, currentState })

    const failed: ProjectReplaceItemFailure[] = []
    const applied: ProjectReplaceApplied = emptyAppliedCounts()

    const folderOpsCreateUpdate = folderOps.filter((op) =>
        op.type === FolderOperationType.CREATE_FOLDER || op.type === FolderOperationType.UPDATE_FOLDER,
    )
    const folderOpsDelete = folderOps.filter((op) => op.type === FolderOperationType.DELETE_FOLDER)
    const tableOpsCreateUpdate = tableOps.filter((op) =>
        op.type === TableOperationType.CREATE_TABLE || op.type === TableOperationType.UPDATE_TABLE,
    )
    const tableOpsDelete = tableOps.filter((op) => op.type === TableOperationType.DELETE_TABLE)
    const flowOpsCreateUpdate = flowOps.filter((op) =>
        op.type === FlowProjectOperationType.CREATE_FLOW || op.type === FlowProjectOperationType.UPDATE_FLOW,
    )
    const flowOpsDelete = flowOps.filter((op) => op.type === FlowProjectOperationType.DELETE_FLOW)

    for (const op of connectionOps) {
        await runConnectionOp({ op, projectId, platformId, log, applied, failed })
    }
    for (const op of folderOpsCreateUpdate) {
        await runFolderOp({ op, projectId, log, applied, failed })
    }
    for (const op of tableOpsCreateUpdate) {
        await runTableOp({ op, projectId, applied, failed })
    }
    for (const op of flowOpsCreateUpdate) {
        await runFlowOp({ op, projectId, log, applied, failed })
    }
    for (const op of flowOpsDelete) {
        await runFlowOp({ op, projectId, log, applied, failed })
    }
    for (const op of tableOpsDelete) {
        await runTableOp({ op, projectId, applied, failed })
    }
    for (const op of folderOpsDelete) {
        await runFolderOp({ op, projectId, log, applied, failed })
    }

    applied.flowsUnchanged = Math.max(0, request.flows.length - applied.flowsCreated - applied.flowsUpdated)
    applied.tablesUnchanged = Math.max(0, request.tables.length - applied.tablesCreated - applied.tablesUpdated)
    applied.foldersUnchanged = Math.max(0, request.folders.length - applied.foldersCreated - applied.foldersUpdated)
    applied.connectionsUnchanged = Math.max(0, request.connections.length - applied.connectionsCreated - applied.connectionsUpdated)

    const connectionsAwaitingAuthorization = await collectConnectionsAwaitingAuthorization({
        projectId,
        platformId,
        connections: request.connections,
    })

    return {
        applied,
        failed,
        connectionsAwaitingAuthorization,
        piecesInstalled: [],
        durationMs: 0,
    }
}

async function runConnectionOp({ op, projectId, platformId, applied, failed }: RunConnectionOpParams): Promise<void> {
    try {
        switch (op.type) {
            case ConnectionOperationType.CREATE_CONNECTION: {
                const encryptedNoAuth = await encryptUtils.encryptObject({ type: AppConnectionType.NO_AUTH })
                await appConnectionsRepo().insert({
                    id: apId(),
                    externalId: op.connectionState.externalId,
                    displayName: op.connectionState.displayName,
                    pieceName: op.connectionState.pieceName,
                    pieceVersion: '0.0.0',
                    platformId,
                    projectIds: [projectId],
                    scope: AppConnectionScope.PROJECT,
                    type: AppConnectionType.NO_AUTH,
                    status: AppConnectionStatus.MISSING,
                    value: encryptedNoAuth,
                })
                applied.connectionsCreated++
                break
            }
            case ConnectionOperationType.UPDATE_CONNECTION: {
                const existing = await appConnectionsRepo().findOne({
                    where: {
                        projectIds: ArrayContains([projectId]),
                        externalId: op.newConnectionState.externalId,
                        platformId,
                    },
                    select: { id: true },
                })
                if (!isNil(existing)) {
                    await appConnectionsRepo().update(existing.id, {
                        displayName: op.newConnectionState.displayName,
                    })
                }
                applied.connectionsUpdated++
                break
            }
        }
    }
    catch (e) {
        failed.push({
            kind: ProjectReplaceItemKind.CONNECTION,
            externalId: op.type === ConnectionOperationType.UPDATE_CONNECTION
                ? op.newConnectionState.externalId
                : op.connectionState.externalId,
            op: op.type === ConnectionOperationType.UPDATE_CONNECTION ? ProjectReplaceItemOp.UPDATE : ProjectReplaceItemOp.CREATE,
            error: errorMessage(e),
        })
    }
}

async function collectConnectionsAwaitingAuthorization({ projectId, platformId, connections }: CollectAwaitingParams): Promise<ConnectionAwaitingAuthorization[]> {
    if (connections.length === 0) return []
    const externalIds = unique(connections.map((c) => c.externalId))
    const rows = await appConnectionsRepo().find({
        where: {
            projectIds: ArrayContains([projectId]),
            platformId,
            externalId: In(externalIds),
        },
        select: { externalId: true, pieceName: true, displayName: true, status: true },
    })
    return rows
        .filter((row) => row.status !== AppConnectionStatus.ACTIVE)
        .map((row) => ({
            externalId: row.externalId,
            pieceName: row.pieceName,
            displayName: row.displayName,
        }))
}

async function loadCurrentFolderStates({ projectId, log }: LoadCurrentFolderStatesParams): Promise<FolderState[]> {
    const folders = await flowFolderService(log).listAllByProject({ projectId })
    return folders
        .filter((folder) => !isNil(folder.externalId))
        .map((folder) => ({
            externalId: folder.externalId as string,
            displayName: folder.displayName,
            displayOrder: folder.displayOrder,
        }))
}

async function runFolderOp({ op, projectId, log, applied, failed }: RunFolderOpParams): Promise<void> {
    try {
        switch (op.type) {
            case FolderOperationType.CREATE_FOLDER: {
                await flowFolderService(log).upsertByExternalId({
                    projectId,
                    externalId: op.folderState.externalId,
                    displayName: op.folderState.displayName,
                    displayOrder: op.folderState.displayOrder,
                })
                applied.foldersCreated++
                break
            }
            case FolderOperationType.UPDATE_FOLDER: {
                await flowFolderService(log).upsertByExternalId({
                    projectId,
                    externalId: op.newFolderState.externalId,
                    displayName: op.newFolderState.displayName,
                    displayOrder: op.newFolderState.displayOrder,
                })
                applied.foldersUpdated++
                break
            }
            case FolderOperationType.DELETE_FOLDER: {
                await flowFolderService(log).deleteByExternalId({
                    projectId,
                    externalId: op.folderState.externalId,
                })
                applied.foldersDeleted++
                break
            }
        }
    }
    catch (e) {
        failed.push({
            kind: ProjectReplaceItemKind.FOLDER,
            externalId: extractFolderExternalId(op),
            op: folderOpToOp(op.type),
            error: errorMessage(e),
        })
    }
}

function extractFolderExternalId(op: FolderOp): string {
    if (op.type === FolderOperationType.UPDATE_FOLDER) {
        return op.newFolderState.externalId
    }
    return op.folderState.externalId
}

function folderOpToOp(type: FolderOperationType): ProjectReplaceItemOp {
    switch (type) {
        case FolderOperationType.CREATE_FOLDER:
            return ProjectReplaceItemOp.CREATE
        case FolderOperationType.UPDATE_FOLDER:
            return ProjectReplaceItemOp.UPDATE
        case FolderOperationType.DELETE_FOLDER:
            return ProjectReplaceItemOp.DELETE
    }
}

async function runTableOp({ op, projectId, applied, failed }: RunTableOpParams): Promise<void> {
    try {
        switch (op.type) {
            case TableOperationType.CREATE_TABLE: {
                const table = await tableService.create({
                    projectId,
                    request: {
                        name: op.tableState.name,
                        externalId: op.tableState.externalId,
                        projectId,
                    },
                })
                for (const field of op.tableState.fields) {
                    await fieldService.createFromState({ projectId, field, tableId: table.id })
                }
                applied.tablesCreated++
                break
            }
            case TableOperationType.UPDATE_TABLE: {
                const updated = await tableService.update({
                    projectId,
                    id: op.tableState.id,
                    request: { name: op.newTableState.name },
                })
                const fields = await fieldService.getAll({ projectId, tableId: updated.id })
                for (const field of op.newTableState.fields) {
                    const existingField = fields.find((f) => f.externalId === field.externalId)
                    if (!isNil(existingField)) {
                        await fieldService.update({
                            projectId,
                            id: existingField.id,
                            request: field,
                        })
                    }
                    else {
                        await fieldService.createFromState({ projectId, field, tableId: updated.id })
                    }
                }
                const fieldsToDelete = fields.filter((f) =>
                    !op.newTableState.fields.some((nf) => nf.externalId === f.externalId),
                )
                for (const field of fieldsToDelete) {
                    await fieldService.delete({ id: field.id, projectId })
                }
                applied.tablesUpdated++
                break
            }
            case TableOperationType.DELETE_TABLE: {
                const table = await tableService.getOneByExternalIdOrThrow({
                    externalId: op.tableState.externalId,
                    projectId,
                })
                await tableService.delete({ id: table.id, projectId })
                applied.tablesDeleted++
                break
            }
        }
    }
    catch (e) {
        failed.push({
            kind: ProjectReplaceItemKind.TABLE,
            externalId: tableExternalId(op),
            op: tableOpToOp(op.type),
            error: errorMessage(e),
        })
    }
}

function tableExternalId(op: TableOp): string {
    if (op.type === TableOperationType.UPDATE_TABLE) {
        return op.newTableState.externalId
    }
    return op.tableState.externalId
}

function tableOpToOp(type: TableOperationType): ProjectReplaceItemOp {
    switch (type) {
        case TableOperationType.CREATE_TABLE:
            return ProjectReplaceItemOp.CREATE
        case TableOperationType.UPDATE_TABLE:
            return ProjectReplaceItemOp.UPDATE
        case TableOperationType.DELETE_TABLE:
            return ProjectReplaceItemOp.DELETE
    }
}

async function runFlowOp({ op, projectId, log, applied, failed }: RunFlowOpParams): Promise<void> {
    try {
        switch (op.type) {
            case FlowProjectOperationType.CREATE_FLOW: {
                const created = await projectStateHelper(log).createFlowInProject(op.flowState, projectId)
                await projectStateHelper(log).republishFlow({
                    flow: created,
                    projectId,
                    status: op.flowState.status,
                })
                applied.flowsCreated++
                break
            }
            case FlowProjectOperationType.UPDATE_FLOW: {
                const updated = await projectStateHelper(log).updateFlowInProject(op.flowState, op.newFlowState, projectId)
                // Mirror the source's published/disabled state — replace semantics are
                // "dest equals source", unlike project-releases which keeps dest's prior status.
                await projectStateHelper(log).republishFlow({
                    flow: updated,
                    projectId,
                    status: op.newFlowState.status,
                })
                applied.flowsUpdated++
                break
            }
            case FlowProjectOperationType.DELETE_FLOW: {
                await projectStateHelper(log).deleteFlowFromProject(op.flowState.id, projectId)
                applied.flowsDeleted++
                break
            }
        }
    }
    catch (e) {
        failed.push({
            kind: ProjectReplaceItemKind.FLOW,
            externalId: flowExternalId(op),
            op: flowOpToOp(op.type),
            error: errorMessage(e),
        })
    }
}

function flowExternalId(op: FlowOp): string {
    if (op.type === FlowProjectOperationType.UPDATE_FLOW) {
        return op.newFlowState.externalId ?? op.newFlowState.id
    }
    return op.flowState.externalId ?? op.flowState.id
}

function flowOpToOp(type: FlowProjectOperationType): ProjectReplaceItemOp {
    switch (type) {
        case FlowProjectOperationType.CREATE_FLOW:
            return ProjectReplaceItemOp.CREATE
        case FlowProjectOperationType.UPDATE_FLOW:
            return ProjectReplaceItemOp.UPDATE
        case FlowProjectOperationType.DELETE_FLOW:
            return ProjectReplaceItemOp.DELETE
    }
}

function emptyAppliedCounts(): ProjectReplaceApplied {
    return {
        flowsCreated: 0,
        flowsUpdated: 0,
        flowsDeleted: 0,
        flowsUnchanged: 0,
        tablesCreated: 0,
        tablesUpdated: 0,
        tablesDeleted: 0,
        tablesUnchanged: 0,
        foldersCreated: 0,
        foldersUpdated: 0,
        foldersDeleted: 0,
        foldersUnchanged: 0,
        connectionsCreated: 0,
        connectionsUpdated: 0,
        connectionsUnchanged: 0,
    }
}

function errorMessage(e: unknown): string {
    if (e instanceof ActivepiecesError) {
        return `${e.error.code}: ${JSON.stringify(e.error.params)}`
    }
    if (e instanceof Error) {
        return e.message
    }
    return String(e)
}

type ReplaceOutcome =
    | { kind: 'SUCCESS', response: ProjectReplaceResponse, durationMs: number }
    | { kind: 'PARTIAL_FAILURE', response: ProjectReplaceResponse, durationMs: number }
    | { kind: 'PREFLIGHT_FAILED', errors: ProjectReplacePreflightError[], durationMs: number }
    | { kind: 'INSTALL_FAILED', failures: PieceInstallFailure[], durationMs: number }
    | { kind: 'LOCKED', durationMs: number }

type ReplaceParams = {
    projectId: ProjectId
    platformId: PlatformId
    request: ProjectReplaceRequest
    log: FastifyBaseLogger
}

type PreflightParams = {
    projectId: ProjectId
    platformId: PlatformId
    request: ProjectReplaceRequest
    log: FastifyBaseLogger
}

type CheckApVersionParams = {
    sourceVersion: string
    destVersion: string
    errors: ProjectReplacePreflightError[]
}

type CheckPieceParams = {
    piece: RequiredPiece
    platformId: PlatformId
    log: FastifyBaseLogger
    errors: ProjectReplacePreflightError[]
}

type InstallPhaseParams = {
    platformId: PlatformId
    request: ProjectReplaceRequest
    log: FastifyBaseLogger
}

type InstallPhaseResult = {
    failures: PieceInstallFailure[]
    installed: InstalledPiece[]
}

type CheckConnectionsParams = {
    projectId: ProjectId
    platformId: PlatformId
    request: ProjectReplaceRequest
    errors: ProjectReplacePreflightError[]
}

type ApplyParams = {
    projectId: ProjectId
    platformId: PlatformId
    request: ProjectReplaceRequest
    log: FastifyBaseLogger
}

type LoadCurrentFolderStatesParams = {
    projectId: ProjectId
    log: FastifyBaseLogger
}

type FolderOp = ReturnType<typeof folderDiffService.diff>[number]
type TableOp = ReturnType<typeof tableDiffService.diff>[number]
type FlowOp = Awaited<ReturnType<typeof flowDiffService.diff>>[number]
type ConnectionOp = ReturnType<typeof connectionDiffService.diff>[number]

type RunFolderOpParams = {
    op: FolderOp
    projectId: ProjectId
    log: FastifyBaseLogger
    applied: ProjectReplaceApplied
    failed: ProjectReplaceItemFailure[]
}

type RunTableOpParams = {
    op: TableOp
    projectId: ProjectId
    applied: ProjectReplaceApplied
    failed: ProjectReplaceItemFailure[]
}

type RunFlowOpParams = {
    op: FlowOp
    projectId: ProjectId
    log: FastifyBaseLogger
    applied: ProjectReplaceApplied
    failed: ProjectReplaceItemFailure[]
}

type RunConnectionOpParams = {
    op: ConnectionOp
    projectId: ProjectId
    platformId: PlatformId
    log: FastifyBaseLogger
    applied: ProjectReplaceApplied
    failed: ProjectReplaceItemFailure[]
}

type CollectAwaitingParams = {
    projectId: ProjectId
    platformId: PlatformId
    connections: ConnectionState[]
}
