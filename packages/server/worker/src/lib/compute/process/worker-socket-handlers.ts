import { exceptionHandler } from '@activepieces/server-shared'
import { EngineHttpResponse, FlowActionType, FlowRunResponse, FlowRunStatus, isFlowRunStateTerminal, isNil, LoopStepOutput, spreadIfDefined, StepOutput, StepOutputStatus, StepRunResponse, UpdateRunProgressRequest, WebsocketServerEvent } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { workerSocket } from '../../flow-worker'
import { engineResponsePublisher } from '../../utils/engine-response-publisher'
import { runsMetadataQueue } from '../flow-runs-queue'

export const workerSocketHandlers = (log: FastifyBaseLogger) => ({
    updateRunProgress: async (request: UpdateRunProgressRequest): Promise<void> => {
        const { runId, projectId, workerHandlerId, runDetails, httpRequestId, stepNameToTest, logsFileId } = request

        const nonSupportedStatuses = [FlowRunStatus.RUNNING, FlowRunStatus.SUCCEEDED, FlowRunStatus.PAUSED]
        if (!nonSupportedStatuses.includes(runDetails.status) && !isNil(workerHandlerId) && !isNil(httpRequestId)) {
            await engineResponsePublisher(log).publish(
                httpRequestId,
                workerHandlerId,
                await getFlowResponse(runDetails),
            )
        }

        await runsMetadataQueue(log).add({
            id: runId,
            status: runDetails.status,
            failedStepName: extractFailedStepName(runDetails.steps as Record<string, StepOutput>),
            logsFileId,
            projectId,
            tags: runDetails.tags ?? [],
            ...spreadIfDefined('tasks', runDetails.tasks),
            ...spreadIfDefined('duration', runDetails.duration ? Math.floor(Number(runDetails.duration)) : undefined),
            finishTime: isFlowRunStateTerminal({
                status: runDetails.status,
                ignoreInternalError: true,
            }) ? new Date().toISOString() : undefined,
        })

        if (!isNil(stepNameToTest)) {
            const response = extractStepResponse({
                steps: runDetails.steps as Record<string, StepOutput>,
                projectId,
                status: runDetails.status,
                runId,
                stepNameToTest,
                log,
            })
            
            if (!isNil(response)) {
                const isTerminalOutput = isFlowRunStateTerminal({
                    status: runDetails.status,
                    ignoreInternalError: false,
                })

                const wsEvent = isTerminalOutput  ? WebsocketServerEvent.EMIT_TEST_STEP_FINISHED : WebsocketServerEvent.EMIT_TEST_STEP_PROGRES
                await workerSocket(log).emitWithAck(wsEvent, { projectId, ...response })
            }
        }
    },
})


async function getFlowResponse(
    result: FlowRunResponse,
): Promise<EngineHttpResponse> {
    switch (result.status) {
        case FlowRunStatus.INTERNAL_ERROR:
            return {
                status: StatusCodes.INTERNAL_SERVER_ERROR,
                body: {
                    message: 'An internal error has occurred',
                },
                headers: {},
            }
        case FlowRunStatus.FAILED:
        case FlowRunStatus.MEMORY_LIMIT_EXCEEDED:
            return {
                status: StatusCodes.INTERNAL_SERVER_ERROR,
                body: {
                    message: 'The flow has failed and there is no response returned',
                },
                headers: {},
            }
        case FlowRunStatus.TIMEOUT:
            return {
                status: StatusCodes.GATEWAY_TIMEOUT,
                body: {
                    message: 'The request took too long to reply',
                },
                headers: {},
            }
        case FlowRunStatus.QUOTA_EXCEEDED:
            return {
                status: StatusCodes.NO_CONTENT,
                body: {},
                headers: {},
            }
        // Case that should be handled before
        default:
            throw new Error(`Unexpected flow run status: ${result.status}`)
    }
}

function extractStepResponse(params: NotifyStepFinishedParams): StepRunResponse | null {
    try {
        if (isNil(params.stepNameToTest)) {
            return null
        }

        const stepOutput = params.steps[params.stepNameToTest]

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
    catch (error) {
        exceptionHandler.handle(error, params.log)
        return null
    }
}

const extractFailedStepName = (steps: Record<string, StepOutput>): string | undefined => {
    if (!steps) {
        return undefined
    }

    const failedStep = Object.entries(steps).find(([_, step]) => {
        const stepOutput = step as StepOutput
        if (stepOutput.type === FlowActionType.LOOP_ON_ITEMS) {
            const loopOutput = stepOutput as LoopStepOutput
            return loopOutput.output?.iterations.some(iteration =>
                Object.values(iteration).some(iterationStep =>
                    (iterationStep as StepOutput).status === StepOutputStatus.FAILED,
                ),
            )
        }
        return stepOutput.status === StepOutputStatus.FAILED
    })

    return failedStep?.[0]
}



type NotifyStepFinishedParams = {
    steps: Record<string, StepOutput>
    projectId: string
    status: FlowRunStatus
    runId: string
    stepNameToTest: string
    log: FastifyBaseLogger
}
