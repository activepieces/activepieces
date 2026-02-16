import {
    DropdownState,
    DynamicPropsValue,
    PieceMetadata,
    PropertyType,
} from '@activepieces/pieces-framework'
import { webhookSecretsUtils } from '@activepieces/server-shared'
import { AgentPieceProps, AgentToolType, AI_PIECE_NAME, BeginExecuteFlowOperation, CodeAction, EngineOperation, EngineOperationType, EngineResponseStatus, ExecuteActionResponse, ExecuteExtractPieceMetadataOperation, ExecuteFlowOperation, ExecutePropsOptions, ExecuteToolResponse, ExecuteTriggerOperation, ExecuteTriggerResponse, ExecuteValidateAuthOperation, ExecuteValidateAuthResponse, FlowActionType, flowStructureUtil, FlowTriggerType, FlowVersion, parseToJsonIfPossible, PieceActionSettings, PieceTriggerSettings, ResumeExecuteFlowOperation, TriggerHookType } from '@activepieces/shared'
import { trace } from '@opentelemetry/api'
import { FastifyBaseLogger } from 'fastify'
import { CodeArtifact } from '../cache/code-builder'
import { executionFiles } from '../cache/execution-files'
import { pieceWorkerCache } from '../cache/piece-worker-cache'
import { workerMachine } from '../utils/machine'
import { webhookUtils } from '../utils/webhook-utils'
import { Sandbox } from './sandbox/sandbox'
import { sandboxPool } from './sandbox/sandbox-pool'

const tracer = trace.getTracer('engine-runner')


export const operationHandler = (log: FastifyBaseLogger) => ({
    async executeFlow(engineToken: string, operation: Omit<BeginExecuteFlowOperation, EngineConstants> | Omit<ResumeExecuteFlowOperation, EngineConstants>): Promise<OperationResponse<EngineHelperFlowResult>> {
        return tracer.startActiveSpan('engineRunner.executeFlow', {
            attributes: {
                'flow.versionId': operation.flowVersion.id,
                'flow.projectId': operation.projectId,
                'flow.platformId': operation.platformId,
            },
        }, async (span) => {
            try {
                log.debug({
                    flowVersion: operation.flowVersion.id,
                    projectId: operation.projectId,
                }, '[threadEngineRunner#executeFlow]')
                await prepareFlowSandbox(log, engineToken, operation.flowVersion, operation.projectId, operation.platformId)

                const input: ExecuteFlowOperation = {
                    ...operation,
                    engineToken,
                    publicApiUrl: workerMachine.getPublicApiUrl(),
                    internalApiUrl: workerMachine.getInternalApiUrl(),
                }

                return await executeSingleTask<EngineHelperFlowResult>(log, input, EngineOperationType.EXECUTE_FLOW, operation.timeoutInSeconds)
            }
            finally {
                span.end()
            }
        })
    },
    async executeTrigger<T extends TriggerHookType>(engineToken: string, operation: Omit<ExecuteTriggerOperation<T>, EngineConstants>): Promise<OperationResponse<EngineHelperTriggerResult<T>>> {
        log.debug({
            hookType: operation.hookType,
            projectId: operation.projectId,
        }, '[threadEngineRunner#executeTrigger]')

        const triggerSettings = operation.flowVersion.trigger.settings as PieceTriggerSettings
        const triggerPiece = await pieceWorkerCache(log).getPiece({
            engineToken,
            pieceName: triggerSettings.pieceName,
            pieceVersion: triggerSettings.pieceVersion,
            platformId: operation.platformId,
        })

        const input: ExecuteTriggerOperation<TriggerHookType> = {
            platformId: operation.platformId,
            projectId: operation.projectId,
            hookType: operation.hookType,
            webhookUrl: operation.webhookUrl,
            triggerPayload: operation.triggerPayload,
            test: operation.test,
            flowVersion: operation.flowVersion,
            appWebhookUrl: await webhookUtils(log).getAppWebhookUrl({
                appName: triggerPiece.pieceName,
                publicApiUrl: workerMachine.getPublicApiUrl(),
            }),
            publicApiUrl: workerMachine.getPublicApiUrl(),
            internalApiUrl: workerMachine.getInternalApiUrl(),
            webhookSecret: await webhookSecretsUtils.getWebhookSecret(operation.flowVersion),
            engineToken,
            timeoutInSeconds: operation.timeoutInSeconds,
        }
        await executionFiles(log).provision({
            pieces: [triggerPiece],
            codeSteps: [],
        })
        return executeSingleTask(log, input, EngineOperationType.EXECUTE_TRIGGER_HOOK, operation.timeoutInSeconds)
    },
    async extractPieceMetadata(operation: ExecuteExtractPieceMetadataOperation): Promise<OperationResponse<PieceMetadata>> {
        log.debug({ operation }, '[threadEngineRunner#extractPieceMetadata]')
        await executionFiles(log).provision({
            pieces: [operation],
            codeSteps: [],
        })
        return executeSingleTask(log, operation, EngineOperationType.EXTRACT_PIECE_METADATA, operation.timeoutInSeconds)
    },
    async executeValidateAuth(engineToken: string, operation: Omit<ExecuteValidateAuthOperation, EngineConstants>): Promise<OperationResponse<ExecuteValidateAuthResponse>> {

        log.debug({ ...operation.piece, platformId: operation.platformId }, '[threadEngineRunner#executeValidateAuth]')

        await executionFiles(log).provision({
            pieces: [operation.piece],
            codeSteps: [],
        })
        const input: ExecuteValidateAuthOperation = {
            ...operation,
            publicApiUrl: workerMachine.getPublicApiUrl(),
            internalApiUrl: workerMachine.getInternalApiUrl(),
            engineToken,
        }
        return executeSingleTask(log, input, EngineOperationType.EXECUTE_VALIDATE_AUTH, operation.timeoutInSeconds)
    },
    async executeProp(engineToken: string, operation: Omit<ExecutePropsOptions, EngineConstants>): Promise<OperationResponse<EngineHelperPropResult>> {
        log.debug({
            piece: operation.piece,
            propertyName: operation.propertyName,
            stepName: operation.actionOrTriggerName,
        }, '[threadEngineRunner#executeProp]')

        await executionFiles(log).provision({
            pieces: [operation.piece],
            codeSteps: [],
        })

        const input: ExecutePropsOptions = {
            ...operation,
            publicApiUrl: workerMachine.getPublicApiUrl(),
            internalApiUrl: workerMachine.getInternalApiUrl(),
            engineToken,
        }
        return executeSingleTask(log, input, EngineOperationType.EXECUTE_PROPERTY, operation.timeoutInSeconds)
    },
})

async function prepareFlowSandbox(log: FastifyBaseLogger, engineToken: string, flowVersion: FlowVersion, projectId: string, platformId: string): Promise<void> {
    return tracer.startActiveSpan('prepareFlowSandbox', {
        attributes: {
            'sandbox.flowVersionId': flowVersion.id,
            'sandbox.projectId': projectId,
            'sandbox.platformId': platformId,
        },
    }, async (span) => {
        try {
            const steps = flowStructureUtil.getAllSteps(flowVersion.trigger)
            const pieceSteps = steps.filter((step) => step.type === FlowTriggerType.PIECE || step.type === FlowActionType.PIECE)
            span.setAttribute('sandbox.pieceStepsCount', pieceSteps.length)

            const flowPieces = pieceSteps.map((step) => {
                const { pieceName, pieceVersion } = step.settings as PieceTriggerSettings | PieceActionSettings
                const pieces = [ pieceWorkerCache(log).getPiece({
                    engineToken,
                    pieceName,
                    pieceVersion,
                    platformId,
                })]
                if (pieceName === AI_PIECE_NAME) {
                    const agentTools = step.settings.input?.[AgentPieceProps.AGENT_TOOLS]
                    for (const tool of agentTools ?? []) {
                        if (tool.type === AgentToolType.PIECE) {
                            pieces.push(pieceWorkerCache(log).getPiece({
                                engineToken,
                                platformId: tool.platformId,
                                pieceName: tool.pieceMetadata.pieceName,
                                pieceVersion: tool.pieceMetadata.pieceVersion,
                            }),
                            )
                        }
                    }
                }
                return pieces
            })

            const codeSteps = getCodePieces(flowVersion)
            span.setAttribute('sandbox.codeStepsCount', codeSteps.length)
            await executionFiles(log).provision({
                pieces: await Promise.all(flowPieces.flat()),
                codeSteps,
            })
        }
        finally {
            span.end()
        }
    })
}

function getCodePieces(flowVersion: FlowVersion): CodeArtifact[] {
    const steps = flowStructureUtil.getAllSteps(flowVersion.trigger)
    return steps.filter((step) => step.type === FlowActionType.CODE).map((step) => {
        const codeAction = step as CodeAction
        return {
            name: codeAction.name,
            flowVersionId: flowVersion.id,
            flowVersionState: flowVersion.state,
            sourceCode: codeAction.settings.sourceCode,
        }
    })
}

async function executeSingleTask<Result extends OperationResult>(log: FastifyBaseLogger, operation: EngineOperation, operationType: EngineOperationType, timeoutInSeconds: number): Promise<OperationResponse<Result>> {
    return tracer.startActiveSpan('operationHandler.execute', {
        attributes: {
            'sandbox.operationType': operationType,
            'sandbox.timeoutInSeconds': timeoutInSeconds,
        },
    }, async (span) => {
        let sandbox: Sandbox | undefined
        try {
            sandbox = await sandboxPool.allocate(log)
            await sandbox.start({ flowVersionId: getFlowVersionId(operation, operationType), platformId: operation.platformId })

            const { engine, stdError, stdOut } = await sandbox.execute(operationType, operation, { timeoutInSeconds })
            span.setAttribute('engine.responseStatus', engine.status)
            return {
                status: engine.status,
                delayInSeconds: engine.delayInSeconds,
                result: parseToJsonIfPossible(engine.response) as Result,
                standardError: stdError,
                standardOutput: stdOut,
            }
        }
        finally {
            log.debug({ sandboxId: sandbox?.id }, 'Releasing sandbox')
            await sandboxPool.release(sandbox)
            span.end()
        }
    })

}

function getFlowVersionId(operation: EngineOperation, type: EngineOperationType): string | undefined {
    switch (type) {
        case EngineOperationType.EXECUTE_FLOW:
            return (operation as ExecuteFlowOperation).flowVersion.id
        case EngineOperationType.EXECUTE_PROPERTY:
            return (operation as ExecutePropsOptions).flowVersion?.id
        case EngineOperationType.EXECUTE_TRIGGER_HOOK:
            return (operation as ExecuteTriggerOperation<TriggerHookType>).flowVersion.id
        case EngineOperationType.EXTRACT_PIECE_METADATA:
        case EngineOperationType.EXECUTE_VALIDATE_AUTH:
            return undefined
    }
}

// Types
export type EngineHelperFlowResult = Record<string, never>

export type EngineHelperTriggerResult<
    T extends TriggerHookType = TriggerHookType,
> = ExecuteTriggerResponse<T>

export type EngineHelperPropResult = {
    type: PropertyType.DROPDOWN
    options: DropdownState<unknown>
} | {
    type: PropertyType.DYNAMIC
    options: Record<string, DynamicPropsValue>
}


type EngineConstants = 'publicApiUrl' | 'internalApiUrl' | 'engineToken'

export type OperationResult =
    | EngineHelperFlowResult
    | EngineHelperTriggerResult
    | EngineHelperPropResult
    | ExecuteToolResponse
    | ExecuteActionResponse
    | PieceMetadata
    | ExecuteValidateAuthResponse

export type OperationResponse<Result extends OperationResult> = {
    status: EngineResponseStatus
    result: Result
    standardError: string
    standardOutput: string
    delayInSeconds?: number
}
