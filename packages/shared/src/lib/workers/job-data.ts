
import { Static, Type } from '@sinclair/typebox'
import { ProgressUpdateType, TriggerHookType, TriggerPayload } from '../engine'
import { ExecutionType } from '../flow-run/execution/execution-output'
import { RunEnvironment } from '../flow-run/flow-run'
import { FlowVersion } from '../flows/flow-version'
import { FlowTriggerType } from '../flows/triggers/trigger'
import { PackageType, PiecePackage, PieceType } from '../pieces/piece'

export const LATEST_JOB_DATA_SCHEMA_VERSION = 4


export enum WorkerJobType {
    RENEW_WEBHOOK = 'RENEW_WEBHOOK',
    EXECUTE_POLLING = 'EXECUTE_POLLING',
    EXECUTE_WEBHOOK = 'EXECUTE_WEBHOOK',
    EXECUTE_FLOW = 'EXECUTE_FLOW',
    EXECUTE_AGENT = 'EXECUTE_AGENT',
    EXECUTE_VALIDATION = 'EXECUTE_VALIDATION',
    EXECUTE_TRIGGER_HOOK = 'EXECUTE_TRIGGER_HOOK',
    EXECUTE_PROPERTY = 'EXECUTE_PROPERTY',
    EXECUTE_EXTRACT_PIECE_INFORMATION = 'EXECUTE_EXTRACT_PIECE_INFORMATION',
    EXECUTE_TOOL = 'EXECUTE_TOOL',
}

// Never change without increasing LATEST_JOB_DATA_SCHEMA_VERSION, and adding a migration
export const RenewWebhookJobData = Type.Object({
    schemaVersion: Type.Number(),
    projectId: Type.String(),
    platformId: Type.String(),
    flowVersionId: Type.String(),
    flowId: Type.String(),
    jobType: Type.Literal(WorkerJobType.RENEW_WEBHOOK),
})
export type RenewWebhookJobData = Static<typeof RenewWebhookJobData>

// Never change without increasing LATEST_JOB_DATA_SCHEMA_VERSION, and adding a migration
export const PollingJobData = Type.Object({
    projectId: Type.String(),
    platformId: Type.String(),
    schemaVersion: Type.Number(),
    flowVersionId: Type.String(),
    flowId: Type.String(),
    triggerType: Type.Enum(FlowTriggerType),
    jobType: Type.Literal(WorkerJobType.EXECUTE_POLLING),
})
export type PollingJobData = Static<typeof PollingJobData>


export const ExecuteFlowJobData = Type.Object({
    projectId: Type.String(),
    platformId: Type.String(),
    jobType: Type.Literal(WorkerJobType.EXECUTE_FLOW),
    environment: Type.Enum(RunEnvironment),
    flowVersionId: Type.String(),
    runId: Type.String(),
    synchronousHandlerId: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    httpRequestId: Type.Optional(Type.String()),
    payload: Type.Any(),
    executeTrigger: Type.Optional(Type.Boolean()),
    executionType: Type.Enum(ExecutionType),
    progressUpdateType: Type.Enum(ProgressUpdateType),
    stepNameToTest: Type.Optional(Type.String()),
    sampleData: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
    logsUploadUrl: Type.Optional(Type.String()),
    logsFileId: Type.Optional(Type.String()),
})
export type ExecuteFlowJobData = Static<typeof ExecuteFlowJobData>

export const AgentJobData = Type.Object({
    jobType: Type.Literal(WorkerJobType.EXECUTE_AGENT),
    agentId: Type.String(),
    projectId: Type.String(),
    platformId: Type.String(),
    agentRunId: Type.String(),
    prompt: Type.String(),
})
export type AgentJobData = Static<typeof AgentJobData>

export const WebhookJobData = Type.Object({
    projectId: Type.String(),
    platformId: Type.String(),
    schemaVersion: Type.Number(),
    requestId: Type.String(),
    payload: Type.Any(),
    runEnvironment: Type.Enum(RunEnvironment),
    flowId: Type.String(),
    saveSampleData: Type.Boolean(),
    flowVersionIdToRun: Type.String(),
    execute: Type.Boolean(),
    jobType: Type.Literal(WorkerJobType.EXECUTE_WEBHOOK),
    parentRunId: Type.Optional(Type.String()),
    failParentOnFailure: Type.Optional(Type.Boolean()),
})
export type WebhookJobData = Static<typeof WebhookJobData>


export const ExecuteValidateAuthJobData = Type.Object({
    requestId: Type.String(),
    webserverId: Type.String(),
    jobType: Type.Literal(WorkerJobType.EXECUTE_VALIDATION),
    projectId: Type.Optional(Type.String()),
    platformId: Type.String(),
    piece: PiecePackage,
    connectionValue: Type.Unknown(),
})
export type ExecuteValidateAuthJobData = Static<typeof ExecuteValidateAuthJobData>

export const ExecuteToolJobData = Type.Object({
    requestId: Type.String(),
    webserverId: Type.String(),
    jobType: Type.Literal(WorkerJobType.EXECUTE_TOOL),
    platformId: Type.String(),
    projectId: Type.String(),
    actionName: Type.String(),
    pieceName: Type.String(),
    pieceVersion: Type.String(),
    packageType: Type.Enum(PackageType),
    pieceType: Type.Enum(PieceType),
    input: Type.Record(Type.String(), Type.Unknown()),
})
export type ExecuteToolJobData = Static<typeof ExecuteToolJobData>

export const ExecuteTriggerHookJobData = Type.Object({
    requestId: Type.String(),
    jobType: Type.Literal(WorkerJobType.EXECUTE_TRIGGER_HOOK),
    platformId: Type.String(),
    projectId: Type.String(),
    flowVersion: FlowVersion,
    test: Type.Boolean(),
    webserverId: Type.String(),
    hookType: Type.Enum(TriggerHookType),
    triggerPayload: Type.Optional(TriggerPayload),
})
export type ExecuteTriggerHookJobData = Static<typeof ExecuteTriggerHookJobData>

export const ExecutePropertyJobData = Type.Object({
    requestId: Type.String(),
    jobType: Type.Literal(WorkerJobType.EXECUTE_PROPERTY),
    projectId: Type.String(),
    platformId: Type.String(),
    flowVersion: Type.Optional(FlowVersion),
    propertyName: Type.String(),
    piece: PiecePackage,
    actionOrTriggerName: Type.String(),
    input: Type.Record(Type.String(), Type.Unknown()),
    webserverId: Type.String(),
    sampleData: Type.Record(Type.String(), Type.Unknown()),
    searchValue: Type.Optional(Type.String()),
})
export type ExecutePropertyJobData = Static<typeof ExecutePropertyJobData>

export const ExecuteExtractPieceMetadataJobData = Type.Object({
    requestId: Type.String(),
    webserverId: Type.String(),
    jobType: Type.Literal(WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION),
    projectId: Type.Optional(Type.String()),
    platformId: Type.String(),
    piece: PiecePackage,
})
export type ExecuteExtractPieceMetadataJobData = Static<typeof ExecuteExtractPieceMetadataJobData>

export const UserInteractionJobData = Type.Union([
    ExecuteValidateAuthJobData,
    ExecuteTriggerHookJobData,
    ExecuteToolJobData,
    ExecutePropertyJobData,
    ExecuteExtractPieceMetadataJobData,
])
export type UserInteractionJobData = Static<typeof UserInteractionJobData>

export const UserInteractionJobDataWithoutWatchingInformation = Type.Union([
    Type.Omit(ExecuteValidateAuthJobData, ['webserverId', 'requestId']),
    Type.Omit(ExecuteToolJobData, ['webserverId', 'requestId']),
    Type.Omit(ExecuteTriggerHookJobData, ['webserverId', 'requestId']),
    Type.Omit(ExecutePropertyJobData, ['webserverId', 'requestId']),
    Type.Omit(ExecuteExtractPieceMetadataJobData, ['webserverId', 'requestId']),
])
export type UserInteractionJobDataWithoutWatchingInformation = Static<typeof UserInteractionJobDataWithoutWatchingInformation>

export const JobData = Type.Union([
    PollingJobData,
    RenewWebhookJobData,
    ExecuteFlowJobData,
    WebhookJobData,
    UserInteractionJobData,
    AgentJobData,
])
export type JobData = Static<typeof JobData>
