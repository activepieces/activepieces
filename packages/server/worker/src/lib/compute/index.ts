import { webhookSecretsUtils } from '@activepieces/server-shared'
import { ActivepiecesError, AgentPieceProps, AgentToolType, AI_PIECE_NAME, BeginExecuteFlowOperation, CodeAction, EngineOperation, EngineOperationType, EngineResponseStatus, ErrorCode, ExecuteExtractPieceMetadataOperation, ExecuteFlowOperation, ExecutePropsOptions, ExecuteTriggerOperation, ExecuteValidateAuthOperation, FlowActionType, flowStructureUtil, FlowTriggerType, FlowVersion, PieceActionSettings, PieceTriggerSettings, ResumeExecuteFlowOperation, TriggerHookType } from '@activepieces/shared'
import { trace } from '@opentelemetry/api'
import chalk from 'chalk'
import { FastifyBaseLogger } from 'fastify'
import { executionFiles } from '../cache/execution-files'
import { pieceWorkerCache } from '../cache/piece-worker-cache'
import { workerMachine } from '../utils/machine'
import { webhookUtils } from '../utils/webhook-utils'
import { CodeArtifact, EngineHelperExtractPieceInformation, EngineHelperFlowResult, EngineHelperPropResult, EngineHelperResponse, EngineHelperResult, EngineHelperTriggerResult, EngineHelperValidateAuthResult } from './engine-runner-types'
import { engineProcessManager } from './process/engine-process-manager'

const tracer = trace.getTracer('engine-runner')

type EngineConstants = 'publicApiUrl' | 'internalApiUrl' | 'engineToken'

export const engineRunner = (log: FastifyBaseLogger) => ({
    async executeFlow(engineToken: string, operation: Omit<BeginExecuteFlowOperation, EngineConstants> | Omit<ResumeExecuteFlowOperation, EngineConstants>): Promise<EngineHelperResponse<EngineHelperFlowResult>> {
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

                return await execute<EngineHelperFlowResult>(log, input, EngineOperationType.EXECUTE_FLOW, operation.timeoutInSeconds)
            }
            finally {
                span.end()
            }
        })
    },
    async executeTrigger<T extends TriggerHookType>(engineToken: string, operation: Omit<ExecuteTriggerOperation<T>, EngineConstants>): Promise<EngineHelperResponse<EngineHelperTriggerResult<T>>> {
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
        return execute(log, input, EngineOperationType.EXECUTE_TRIGGER_HOOK, operation.timeoutInSeconds)
    },
    async extractPieceMetadata(operation: ExecuteExtractPieceMetadataOperation): Promise<EngineHelperResponse<EngineHelperExtractPieceInformation>> {
        log.debug({ operation }, '[threadEngineRunner#extractPieceMetadata]')
        await executionFiles(log).provision({
            pieces: [operation],
            codeSteps: [],
        })
        return execute(log, operation, EngineOperationType.EXTRACT_PIECE_METADATA, operation.timeoutInSeconds)
    },
    async executeValidateAuth(engineToken: string, operation: Omit<ExecuteValidateAuthOperation, EngineConstants>): Promise<EngineHelperResponse<EngineHelperValidateAuthResult>> {

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
        return execute(log, input, EngineOperationType.EXECUTE_VALIDATE_AUTH, operation.timeoutInSeconds)
    },
    async executeProp(engineToken: string, operation: Omit<ExecutePropsOptions, EngineConstants>): Promise<EngineHelperResponse<EngineHelperPropResult>> {
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
        return execute(log, input, EngineOperationType.EXECUTE_PROPERTY, operation.timeoutInSeconds)
    },
    async shutdownAllWorkers(): Promise<void> {
        await engineProcessManager.shutdown()
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

async function execute<Result extends EngineHelperResult>(log: FastifyBaseLogger, operation: EngineOperation, operationType: EngineOperationType, timeoutInSeconds: number): Promise<EngineHelperResponse<Result>> {
    return tracer.startActiveSpan('engineRunner.execute', {
        attributes: {
            'engine.operationType': operationType,
            'engine.timeoutInSeconds': timeoutInSeconds,
        },
    }, async (span) => {
        try {
            const { engine, stdError, stdOut } = await engineProcessManager.executeTask(operationType, operation, log, timeoutInSeconds)

            log.debug({
                stdError: chalk.red(stdError),
                stdOut: chalk.green(stdOut),
            }, '[engineRunner#execute] error')

            span.setAttribute('engine.responseStatus', engine.status)

            if (engine.status === EngineResponseStatus.TIMEOUT) {
                span.recordException(new Error('Execution timeout'))
                throw new ActivepiecesError({
                    code: ErrorCode.EXECUTION_TIMEOUT,
                    params: {
                        standardOutput: stdOut,
                        standardError: stdError,
                    },
                })
            }
            if (engine.status === EngineResponseStatus.MEMORY_ISSUE) {
                span.recordException(new Error('Memory issue'))
                throw new ActivepiecesError({
                    code: ErrorCode.MEMORY_ISSUE,
                    params: {
                        standardOutput: stdOut,
                        standardError: stdError,
                    },
                })
            }

            const result = tryParseJson(engine.response)

            return {
                status: engine.status,
                delayInSeconds: engine.delayInSeconds,
                result: result as Result,
                standardError: stdError,
                standardOutput: stdOut,
            }
        }
        finally {
            span.end()
        }
    })

}



function tryParseJson(value: unknown): unknown {
    try {
        return JSON.parse(value as string)
    }
    catch (e) {
        return value
    }
}