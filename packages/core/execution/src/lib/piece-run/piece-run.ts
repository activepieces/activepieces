import { ApId, BaseModelSchema, Nullable } from '@activepieces/core-utils'
import { z } from 'zod'
import { FlowRunStatus } from '../flow-run/execution/flow-execution'

export enum PieceRunSource {
    MCP = 'MCP',
    CHAT = 'CHAT',
    API = 'API',
}

export enum PieceRunKind {
    PIECE = 'PIECE',
    CODE = 'CODE',
}

export const PieceRun = z.object({
    ...BaseModelSchema,
    projectId: z.string(),
    platformId: z.string(),
    userId: Nullable(z.string()),
    kind: z.enum(PieceRunKind),
    pieceName: Nullable(z.string()),
    pieceVersion: Nullable(z.string()),
    actionName: Nullable(z.string()),
    connectionExternalId: Nullable(z.string()),
    conversationId: Nullable(z.string()),
    source: z.enum(PieceRunSource),
    status: z.enum(FlowRunStatus),
    input: z.unknown(),
    output: Nullable(z.unknown()),
    logs: Nullable(z.string()),
    errorMessage: Nullable(z.string()),
    startTime: Nullable(z.string()),
    finishTime: Nullable(z.string()),
    logsFileId: Nullable(z.string()),
    archivedAt: Nullable(z.string()),
})

export const PopulatedPieceRun = PieceRun.extend({
    connectionDisplayName: Nullable(z.string()),
    userName: Nullable(z.string()),
    userEmail: Nullable(z.string()),
    userImageUrl: Nullable(z.string()),
})

// The heavy fields (input/output/logs) are offloaded to the file table and never
// returned in list responses; the list carries only the summary. Fetch a single run
// to hydrate the payload from its file.
export const PieceRunListItem = PopulatedPieceRun.omit({ input: true, output: true, logs: true })

export const BulkArchivePieceRunsRequestBody = z.object({
    projectId: ApId,
    pieceRunIds: z.array(ApId).optional(),
    excludePieceRunIds: z.array(ApId).optional(),
    status: z.array(z.enum(FlowRunStatus)).optional(),
    source: z.array(z.enum(PieceRunSource)).optional(),
    userId: z.array(ApId).optional(),
    createdAfter: z.string().optional(),
    createdBefore: z.string().optional(),
})

export type PieceRun = z.infer<typeof PieceRun>
export type PopulatedPieceRun = z.infer<typeof PopulatedPieceRun>
export type PieceRunListItem = z.infer<typeof PieceRunListItem>
export type BulkArchivePieceRunsRequestBody = z.infer<typeof BulkArchivePieceRunsRequestBody>
