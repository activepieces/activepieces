import { z } from 'zod'
import { PieceType } from '../pieces/piece'
import { ConnectionState, FolderState, ProjectState, TableState } from './project-state'

export const PROJECT_REPLACE_SCHEMA_VERSION = 1

export const RequiredPiece = z.object({
    name: z.string(),
    version: z.string(),
    pieceType: z.nativeEnum(PieceType),
})
export type RequiredPiece = z.infer<typeof RequiredPiece>

export const ProjectReplaceRequest = z.object({
    schemaVersion: z.literal(PROJECT_REPLACE_SCHEMA_VERSION),
    sourceActivepiecesVersion: z.string(),
    flows: ProjectState.shape.flows,
    tables: z.array(TableState),
    folders: z.array(FolderState),
    connections: z.array(ConnectionState),
    requiredPieces: z.array(RequiredPiece),
})
export type ProjectReplaceRequest = z.infer<typeof ProjectReplaceRequest>

export enum ProjectReplaceErrorKind {
    AP_VERSION_MISMATCH = 'AP_VERSION_MISMATCH',
    PIECE_VERSION_MISMATCH = 'PIECE_VERSION_MISMATCH',
    CONNECTION_PIECE_MISMATCH = 'CONNECTION_PIECE_MISMATCH',
}

export const ProjectReplacePreflightError = z.discriminatedUnion('kind', [
    z.object({
        kind: z.literal(ProjectReplaceErrorKind.AP_VERSION_MISMATCH),
        sourceVersion: z.string(),
        destVersion: z.string(),
        message: z.string(),
    }),
    z.object({
        kind: z.literal(ProjectReplaceErrorKind.PIECE_VERSION_MISMATCH),
        pieceName: z.string(),
        sourceVersion: z.string(),
        destVersion: z.string(),
    }),
    z.object({
        kind: z.literal(ProjectReplaceErrorKind.CONNECTION_PIECE_MISMATCH),
        externalId: z.string(),
        expectedPieceName: z.string(),
        foundPieceName: z.string(),
    }),
])
export type ProjectReplacePreflightError = z.infer<typeof ProjectReplacePreflightError>

export const PieceInstallFailure = z.object({
    pieceName: z.string(),
    version: z.string(),
    pieceType: z.nativeEnum(PieceType),
    message: z.string(),
})
export type PieceInstallFailure = z.infer<typeof PieceInstallFailure>

export const ProjectReplacePreflightFailure = z.object({
    errors: z.array(ProjectReplacePreflightError),
})
export type ProjectReplacePreflightFailure = z.infer<typeof ProjectReplacePreflightFailure>

export enum ProjectReplaceItemKind {
    FLOW = 'flow',
    TABLE = 'table',
    FOLDER = 'folder',
    CONNECTION = 'connection',
}

export enum ProjectReplaceItemOp {
    CREATE = 'CREATE',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
}

export const ProjectReplaceItemFailure = z.object({
    kind: z.nativeEnum(ProjectReplaceItemKind),
    externalId: z.string(),
    op: z.nativeEnum(ProjectReplaceItemOp),
    error: z.string(),
})
export type ProjectReplaceItemFailure = z.infer<typeof ProjectReplaceItemFailure>

export const ProjectReplaceApplied = z.object({
    flowsCreated: z.number(),
    flowsUpdated: z.number(),
    flowsDeleted: z.number(),
    flowsUnchanged: z.number(),
    tablesCreated: z.number(),
    tablesUpdated: z.number(),
    tablesDeleted: z.number(),
    tablesUnchanged: z.number(),
    foldersCreated: z.number(),
    foldersUpdated: z.number(),
    foldersDeleted: z.number(),
    foldersUnchanged: z.number(),
    connectionsCreated: z.number(),
    connectionsUpdated: z.number(),
    connectionsUnchanged: z.number(),
})
export type ProjectReplaceApplied = z.infer<typeof ProjectReplaceApplied>

export const ConnectionAwaitingAuthorization = z.object({
    externalId: z.string(),
    pieceName: z.string(),
    displayName: z.string(),
})
export type ConnectionAwaitingAuthorization = z.infer<typeof ConnectionAwaitingAuthorization>

export const InstalledPiece = z.object({
    name: z.string(),
    version: z.string(),
    pieceType: z.nativeEnum(PieceType),
})
export type InstalledPiece = z.infer<typeof InstalledPiece>

export const ProjectReplaceResponse = z.object({
    applied: ProjectReplaceApplied,
    failed: z.array(ProjectReplaceItemFailure),
    connectionsAwaitingAuthorization: z.array(ConnectionAwaitingAuthorization),
    piecesInstalled: z.array(InstalledPiece),
    durationMs: z.number(),
})
export type ProjectReplaceResponse = z.infer<typeof ProjectReplaceResponse>
