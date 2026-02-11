import { OutputContext } from '@activepieces/pieces-framework'
import { DEFAULT_MCP_DATA, EngineGenericError, EngineSocketEvent, FlowActionType, FlowRunStatus, GenericStepOutput, isFlowRunStateTerminal, isNil, logSerializer, RunEnvironment, StepOutput, StepOutputStatus, StepRunResponse, UpdateRunProgressRequest, UploadRunLogsRequest } from '@activepieces/shared'
import { Mutex } from 'async-mutex'
import dayjs from 'dayjs'
import fetchRetry from 'fetch-retry'
import { EngineConstants } from '../handler/context/engine-constants'
import { FlowExecutorContext } from '../handler/context/flow-execution-context'
import { utils } from '../utils'
import { workerSocket } from '../worker-socket'


const lock = new Mutex()
const updateLock = new Mutex()
const fetchWithRetry = fetchRetry(global.fetch)

const BACKUP_INTERVAL_MS = 15000
export let latestUpdateParams: UpdateStepProgressParams | null = null
let isBackupLoopRunning = false
let backupLoopPromise: Promise<void> | null = null

async function backupLoop(): Promise<void> {
    while (isBackupLoopRunning) {
        try {
            if (latestUpdateParams) {
                console.log('[Progress] Backup interval fired, starting backup')
                await progressService.backup(latestUpdateParams)
                console.log('[Progress] Backup interval completed')
            }
        }
        catch (err) {
            console.error('[Progress] Backup failed', err)
        }
        await utils.sleep(BACKUP_INTERVAL_MS)
    }
}

export const progressService = {
    init: (): void => {
        isBackupLoopRunning = true
        backupLoopPromise = backupLoop()
    },
    sendUpdate: async (params: UpdateStepProgressParams): Promise<void> => {
        return updateLock.runExclusive(async () => {
            const { engineConstants, flowExecutorContext, stepNameToUpdate } = params
            latestUpdateParams = params
            if (!stepNameToUpdate || !engineConstants.isTestFlow) { // live runs are updated by backup job
                return
            }
            const step = flowExecutorContext.getStepOutput(stepNameToUpdate)
            if (isNil(step)) {
                return
            }
            await sendUpdateProgress({
                step: {
                    name: stepNameToUpdate,
                    path: flowExecutorContext.currentPath.path,
                    output: step,
                },
                flowRun: {
                    projectId: engineConstants.projectId,
                    flowId: engineConstants.flowId,
                    flowVersionId: engineConstants.flowVersionId,
                    id: engineConstants.flowRunId,
                    created: dayjs().toISOString(),
                    updated: dayjs().toISOString(),
                    status: flowExecutorContext.verdict.status,
                    environment: engineConstants.runEnvironment ?? RunEnvironment.TESTING,
                    failParentOnFailure: false,
                    triggeredBy: engineConstants.triggerPieceName,
                    tags: Array.from(flowExecutorContext.tags),
                    startTime: params.startTime,
                },
            })
        })
    },
    createOutputContext: (params: CreateOutputContextParams): OutputContext => {
        const { engineConstants, flowExecutorContext, stepName, stepOutput } = params
        return {
            update: async (params: { data: unknown }) => {
                const steps = flowExecutorContext
                    .upsertStep(stepName, stepOutput.setOutput(params.data)).steps
                    
                const stepResponse = extractStepResponse({
                    steps,
                    runId: engineConstants.flowRunId,
                    stepName,
                })
                await workerSocket.sendToWorkerWithAck(EngineSocketEvent.UPDATE_STEP_PROGRESS, {
                    projectId: engineConstants.projectId,
                    stepResponse,
                })
            },
        }
    },
    backup: async (updateParams: BackUpLogsParams): Promise<void> => {
        const isRunningMcp = updateParams.engineConstants.flowRunId === DEFAULT_MCP_DATA.flowRunId
        if (isRunningMcp) {
            return
        }
        await lock.runExclusive(async () => {
            const { flowExecutorContext, engineConstants } = updateParams
            const executionState = await logSerializer.serialize({
                executionState: {   
                    steps: flowExecutorContext.steps,
                    tags: Array.from(flowExecutorContext.tags),
                },
            })
           
            const logsUploadUrl = engineConstants.logsUploadUrl
            if (isNil(logsUploadUrl)) {
                throw new EngineGenericError('LogsUploadUrlNotSetError', 'Logs upload URL is not set')
            }
            const uploadLogResponse = await uploadExecutionState(logsUploadUrl!, executionState)
            if (!uploadLogResponse.ok) {
                throw new EngineGenericError('ProgressUpdateError', 'Failed to upload execution state', uploadLogResponse)
            }
    
            const stepResponse = extractStepResponse({
                steps: flowExecutorContext.steps,
                runId: engineConstants.flowRunId,
                stepName: engineConstants.stepNameToTest,
            })
    
            const request: UploadRunLogsRequest = {
                runId: engineConstants.flowRunId,
                projectId: engineConstants.projectId,
                workerHandlerId: engineConstants.serverHandlerId ?? null,
                httpRequestId: engineConstants.httpRequestId ?? null,
                status: flowExecutorContext.verdict.status,
                progressUpdateType: engineConstants.progressUpdateType,
                logsFileId: engineConstants.logsFileId,
                failedStep: flowExecutorContext.verdict.status === FlowRunStatus.FAILED ? flowExecutorContext.verdict.failedStep : undefined,
                stepNameToTest: engineConstants.stepNameToTest,
                stepResponse,
                pauseMetadata: flowExecutorContext.verdict.status === FlowRunStatus.PAUSED ? flowExecutorContext.verdict.pauseMetadata : undefined,
                finishTime: isFlowRunStateTerminal({
                    status: flowExecutorContext.verdict.status,
                    ignoreInternalError: false,
                }) ? dayjs().toISOString() : undefined,
                tags: Array.from(flowExecutorContext.tags),
                stepsCount: flowExecutorContext.stepsCount,
            }
            await sendLogsUpdate(request)
        })
    },
    shutdown: async () => {
        console.log('[Progress] Shutdown called, stopping backup loop')
        isBackupLoopRunning = false
        
        if (backupLoopPromise) {
            console.log('[Progress] Waiting for in-progress backup to complete')
            await backupLoopPromise
            backupLoopPromise = null
        }
        
        latestUpdateParams = null
        console.log('[Progress] Shutdown complete')
    },
}

process.on('SIGTERM', () => void progressService.shutdown())
process.on('SIGINT', () => void progressService.shutdown())

type CreateOutputContextParams = {
    engineConstants: EngineConstants
    flowExecutorContext: FlowExecutorContext
    stepName: string
    stepOutput: GenericStepOutput<FlowActionType.PIECE, unknown>
}

const sendUpdateProgress = async (request: UpdateRunProgressRequest): Promise<void> => {
    const result = await utils.tryCatchAndThrowOnEngineError(() => 
        workerSocket.sendToWorkerWithAck(EngineSocketEvent.UPDATE_RUN_PROGRESS, request),
    )
    if (result.error) {
        throw new EngineGenericError('ProgressUpdateError', 'Failed to send UPDATE_RUN_PROGRESS event', result.error)
    }
}

const sendLogsUpdate = async (request: UploadRunLogsRequest): Promise<void> => {
    const result = await utils.tryCatchAndThrowOnEngineError(() => 
        workerSocket.sendToWorkerWithAck(EngineSocketEvent.UPLOAD_RUN_LOG, request),
    )
    if (result.error) {
        throw new EngineGenericError('ProgressUpdateError', 'Failed to send UPLOAD_RUN_LOG event', result.error)
    }
}

const uploadExecutionState = async (uploadUrl: string, executionState: Buffer, followRedirects = true): Promise<Response> => {
    const response = await fetchWithRetry(uploadUrl, {
        method: 'PUT',
        body: new Uint8Array(executionState),
        headers: {
            'Content-Type': 'application/octet-stream',
        },
        redirect: 'manual',
        retries: 3,
        retryDelay: 3000,
    })

    if (followRedirects && response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location')!
        return uploadExecutionState(location, executionState, false)
    }
    return response
}


const extractStepResponse = (params: ExtractStepResponse): StepRunResponse | undefined => {
    if (isNil(params.stepName)) {
        return undefined
    }

    const stepOutput = params.steps?.[params.stepName]
    const isSuccess = stepOutput?.status === StepOutputStatus.SUCCEEDED || stepOutput?.status === StepOutputStatus.PAUSED
    return {
        runId: params.runId,
        success: isSuccess,
        input: stepOutput?.input,
        output: stepOutput?.output,
        standardError: isSuccess ? '' : (stepOutput?.errorMessage as string),
        standardOutput: '',
    }
}


type UpdateStepProgressParams = {
    engineConstants: EngineConstants
    flowExecutorContext: FlowExecutorContext
    stepNameToUpdate?: string
    startTime?: string
}

type BackUpLogsParams = {
    engineConstants: EngineConstants
    flowExecutorContext: FlowExecutorContext
    stepNameToUpdate?: string
}

type ExtractStepResponse = {
    steps: Record<string, StepOutput>
    runId: string
    stepName?: string
}