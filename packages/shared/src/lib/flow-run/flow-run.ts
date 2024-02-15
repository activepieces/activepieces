import { BaseModel } from '../common/base-model'
import { ProjectId } from '../project/project'
import { FlowVersionId } from '../flows/flow-version'
import { FileId } from '../file/file'
import { ApId } from '../common/id-generator'
import {
    ExecutionOutput,
    ExecutionOutputStatus,
    PauseMetadata,
} from './execution/execution-output'
import { FlowId } from '../flows/flow'

export type FlowRunId = ApId

export enum RunTerminationReason {
    STOPPED_BY_HOOK = 'STOPPED_BY_HOOK',
}

export type FlowRun = BaseModel<FlowRunId> & {
    id: FlowRunId
    projectId: ProjectId
    flowId: FlowId
    tags?: string[]
    flowVersionId: FlowVersionId
    flowDisplayName: string
    terminationReason?: RunTerminationReason
    logsFileId: FileId | null
    tasks?: number
    status: ExecutionOutputStatus
    startTime: string
    finishTime: string
    environment: RunEnvironment
    pauseMetadata?: PauseMetadata
    executionOutput?: ExecutionOutput
}

export enum RunEnvironment {
    PRODUCTION = 'PRODUCTION',
    TESTING = 'TESTING',
}

export enum FlowRetryStrategy {
    ON_LATEST_VERSION = 'ON_LATEST_VERSION',
    FROM_FAILED_STEP = 'FROM_FAILED_STEP',
}

export type FlowRetryPayload = {
    strategy: FlowRetryStrategy
}