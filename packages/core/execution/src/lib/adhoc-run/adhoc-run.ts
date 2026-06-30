import { ApId, BaseModelSchema, Nullable } from '@activepieces/core-utils'
import { z } from 'zod'
import { FlowRunStatus } from '../flow-run/execution/flow-execution'

export enum AdhocRunSource {
    MCP = 'MCP',
    CHAT = 'CHAT',
    API = 'API',
}

export enum AdhocRunKind {
    PIECE = 'PIECE',
    CODE = 'CODE',
}

export const AdhocRun = z.object({
    ...BaseModelSchema,
    projectId: z.string(),
    platformId: z.string(),
    userId: Nullable(z.string()),
    kind: z.nativeEnum(AdhocRunKind),
    pieceName: Nullable(z.string()),
    pieceVersion: Nullable(z.string()),
    actionName: Nullable(z.string()),
    connectionExternalId: Nullable(z.string()),
    source: z.nativeEnum(AdhocRunSource),
    status: z.nativeEnum(FlowRunStatus),
    input: z.unknown(),
    output: Nullable(z.unknown()),
    logs: Nullable(z.string()),
    errorMessage: Nullable(z.string()),
    startTime: Nullable(z.string()),
    finishTime: Nullable(z.string()),
    logsFileId: Nullable(z.string()),
    archivedAt: Nullable(z.string()),
})

export const PopulatedAdhocRun = AdhocRun.extend({
    connectionDisplayName: Nullable(z.string()),
    userName: Nullable(z.string()),
})

export const BulkArchiveAdhocRunsRequestBody = z.object({
    projectId: ApId,
    adhocRunIds: z.array(ApId).optional(),
    excludeAdhocRunIds: z.array(ApId).optional(),
    status: z.array(z.nativeEnum(FlowRunStatus)).optional(),
    source: z.array(z.nativeEnum(AdhocRunSource)).optional(),
    createdAfter: z.string().optional(),
    createdBefore: z.string().optional(),
})

export type AdhocRun = z.infer<typeof AdhocRun>
export type PopulatedAdhocRun = z.infer<typeof PopulatedAdhocRun>
export type BulkArchiveAdhocRunsRequestBody = z.infer<typeof BulkArchiveAdhocRunsRequestBody>
