import { AUTHENTICATION_PROPERTY_NAME, ActionType, PieceAction, StepOutputStatus, assertNotNullOrUndefined } from '@activepieces/shared'
import { BaseExecutor } from './base-executor'
import { EngineConstantData, FlowExecutorContext } from './context/flow-execution-context'
import { variableService } from '../services/variable-service'
import { ActionContext, ConnectionsManager, PauseHook, PauseHookParams, PiecePropertyMap, StaticPropsValue, StopHook, StopHookParams, TagsManager } from '@activepieces/pieces-framework'
import { pieceHelper } from '../helper/piece-helper'
import { createContextStore } from '../services/storage.service'
import { createFilesService } from '../services/files.service'
import { createConnectionService } from '../services/connections.service'

type HookResponse = { stopResponse: StopHookParams | undefined, pauseResponse: PauseHookParams | undefined, tags: string[] }
export const pieceExecutor: BaseExecutor<PieceAction> = {
    async handle({
        action,
        executionState,
        constants,
    }: {
        action: PieceAction
        executionState: FlowExecutorContext
        constants: EngineConstantData
    }) {
        if (executionState.isCompleted({ stepName: action.name })) {
            return executionState
        }
        const {
            censoredInput,
            resolvedInput,
        } = await variableService({
            projectId: constants.projectId,
            workerToken: constants.workerToken,
        }).resolve<StaticPropsValue<PiecePropertyMap>>({
            unresolvedInput: action.settings.input,
            executionState,
        })

        assertNotNullOrUndefined(action.settings.actionName, 'actionName')
        const pieceAction = await pieceHelper.getActionOrThrow({
            pieceName: action.settings.pieceName,
            pieceVersion: action.settings.pieceVersion,
            actionName: action.settings.actionName,
        })

        const piece = await pieceHelper.loadPieceOrThrow(action.settings.pieceName, action.settings.pieceVersion)
        const { processedInput, errors } = await variableService({
            projectId: constants.projectId,
            workerToken: constants.workerToken,
        }).applyProcessorsAndValidators(resolvedInput, pieceAction.props, piece.auth)
        if (Object.keys(errors).length > 0) {
            throw new Error(JSON.stringify(errors))
        }

        const hookResponse: HookResponse = {
            stopResponse: undefined,
            pauseResponse: undefined,
            tags: [],
        }

        const context: ActionContext = {
            executionType: constants.executionType,
            store: createContextStore({
                prefix: '',
                flowId: constants.flowId,
                workerToken: constants.workerToken,
            }),
            auth: processedInput[AUTHENTICATION_PROPERTY_NAME],
            files: createFilesService({
                workerToken: constants.workerToken,
                stepName: action.name,
                flowId: constants.flowId,
                type: 'local',
            }),
            server: {
                token: constants.workerToken,
                apiUrl: constants.apiUrl,
                publicUrl: constants.serverUrl,
            },
            propsValue: processedInput,
            tags: createTagsManager(hookResponse),
            connections: createConnectionManager({
                projectId: constants.projectId,
                workerToken: constants.workerToken,
                hookResponse,
            }),
            serverUrl: constants.serverUrl,
            run: {
                id: constants.flowRunId,
                stop: createStopHook(hookResponse),
                pause: createPauseHook(hookResponse),
            },
            resumePayload: constants.resumePayload,
        }
        const output = await pieceAction.run(context)
        const newExecutionContext = executionState.addTags(hookResponse.tags)

        if (hookResponse.stopResponse) {
            return newExecutionContext.upsertStep(action.name, {
                type: ActionType.PIECE,
                status: StepOutputStatus.SUCCEEDED,
                input: censoredInput,
                output,
            })
        }
        if (hookResponse.pauseResponse) {
            return newExecutionContext.upsertStep(action.name, {
                type: ActionType.PIECE,
                status: StepOutputStatus.PAUSED,
                input: censoredInput,
                output,
            })
        }

        return newExecutionContext.upsertStep(action.name, {
            type: ActionType.PIECE,
            status: StepOutputStatus.SUCCEEDED,
            input: censoredInput,
            output,
        })
    },
}

const createTagsManager = (hookResponse: HookResponse): TagsManager => {
    return {
        add: async (params: {
            name: string
        }): Promise<void> => {
            hookResponse.tags.push(params.name)
        },

    }
}

const createConnectionManager = ({ workerToken, projectId, hookResponse }: { projectId: string, workerToken: string, hookResponse: HookResponse }): ConnectionsManager => {
    return {
        get: async (key: string) => {
            try {
                const connection = await createConnectionService({ projectId, workerToken }).obtain(key)
                hookResponse.tags.push(`connection:${key}`)
                return connection
            }
            catch (e) {
                return null
            }
        },
    }
}

function createStopHook(hookResponse: HookResponse): StopHook {
    return (req: StopHookParams) => {
        hookResponse.stopResponse = req
    }
}

function createPauseHook(hookResponse: HookResponse): PauseHook {
    return (req: PauseHookParams) => {
        hookResponse.pauseResponse = req
    }
}
