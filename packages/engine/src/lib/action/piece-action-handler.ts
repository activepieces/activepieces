import { VariableService } from '../services/variable-service'
import {
    AUTHENTICATION_PROPERTY_NAME,
    Action,
    ActionType,
    ExecutionState,
    ExecutionType,
    PauseMetadata,
    PieceAction,
    StepOutput,
    StepOutputStatus,
    StopResponse,
    assertNotNullOrUndefined,
} from '@activepieces/shared'
import { BaseActionHandler, ExecuteActionOutput, ExecuteContext, InitStepOutputParams } from './action-handler'
import { globals } from '../globals'
import { isNil } from '@activepieces/shared'
import { pieceHelper } from '../helper/piece-helper'
import { createContextStore } from '../services/storage.service'
import { utils } from '../utils'
import { ActionContext, PauseHook, PauseHookParams, PiecePropertyMap, StaticPropsValue, StopHook, StopHookParams } from '@activepieces/pieces-framework'
import { createConnectionManager } from '../services/connections.service'
import { createTagsManager } from '../services/tags.service'
import { createFilesService } from '../services/files.service'

type CtorParams = {
    executionType: ExecutionType
    currentAction: PieceAction
    nextAction?: Action
}

type LoadActionParams = {
    pieceName: string
    pieceVersion: string
    actionName: string
}

type GenerateStopHookParams = {
    stepOutput: StepOutput<ActionType.PIECE>
    objectResponse: {
        stopResponse: StopResponse | undefined
    }
}

type GeneratePauseHookParams = {
    stepOutput: StepOutput<ActionType.PIECE>
    objectResponse: {
        pauseMetadata: PauseMetadata | undefined
    }
}

export class PieceActionHandler extends BaseActionHandler<PieceAction> {
    executionType: ExecutionType
    variableService: VariableService

    constructor({ executionType, currentAction, nextAction }: CtorParams) {
        super({
            currentAction,
            nextAction,
        })

        this.executionType = executionType
        this.variableService = new VariableService()
    }

    private async loadAction(params: LoadActionParams) {
        const { pieceName, pieceVersion, actionName } = params

        const piece = await pieceHelper.loadPieceOrThrow(pieceName, pieceVersion)

        if (isNil(actionName)) {
            throw new Error('Action name is not defined')
        }

        const action = piece.getAction(actionName)

        if (isNil(action)) {
            throw new Error(`error=action_not_found action_name=${actionName}`)
        }

        return action
    }

    private generateStopHook({ stepOutput, objectResponse }: GenerateStopHookParams): StopHook {
        return ({ response }: StopHookParams) => {
            stepOutput.status = StepOutputStatus.STOPPED
            objectResponse.stopResponse = response
        }
    }

    private generatePauseHook({ stepOutput, objectResponse }: GeneratePauseHookParams): PauseHook {
        const actionName = this.currentAction.name

        return ({ pauseMetadata }: PauseHookParams) => {
            stepOutput.status = StepOutputStatus.PAUSED
            objectResponse.pauseMetadata = {
                ...pauseMetadata,
                resumeStepMetadata: {
                    type: ActionType.PIECE,
                    name: actionName,
                },
            }
        }
    }

    /**
   * initializes an empty piece step output
   */
    protected override async initStepOutput({ executionState }: InitStepOutputParams): Promise<StepOutput<ActionType.PIECE>> {
        const censoredInput = await this.variableService.resolve({
            unresolvedInput: this.currentAction.settings.input,
            executionState,
            logs: true,
        })

        return {
            type: ActionType.PIECE,
            status: StepOutputStatus.RUNNING,
            input: censoredInput,
        }
    }

    async execute(
        executionContext: ExecuteContext,
        executionState: ExecutionState,
        ancestors: [string, number][],
    ): Promise<ExecuteActionOutput> {
        const { input, pieceName, pieceVersion, actionName } = this.currentAction.settings

        const stepOutput = await this.loadStepOutput({
            executionState,
            ancestors,
        })

        try {
            if (isNil(actionName)) {
                throw new Error('Action name is not defined')
            }

            const action = await this.loadAction({
                pieceName,
                pieceVersion,
                actionName,
            })
            const piece = await pieceHelper.loadPieceOrThrow(pieceName, pieceVersion)

            const resolvedProps = await this.variableService.resolve<StaticPropsValue<PiecePropertyMap>>({
                unresolvedInput: input,
                executionState,
                logs: false,
            })

            assertNotNullOrUndefined(globals.flowRunId, 'globals.flowRunId')
            const { processedInput, errors } = await this.variableService.applyProcessorsAndValidators(resolvedProps, action.props, piece.auth)

            if (Object.keys(errors).length > 0) {
                throw new Error(JSON.stringify(errors))
            }

            const stopResponse = {
                stopResponse: undefined,
            }
            const pauseResponse = {
                pauseMetadata: undefined,
            }
            const context: ActionContext = {
                executionType: this.executionType,
                store: createContextStore('', executionContext.flowVersion.flowId),
                auth: processedInput[AUTHENTICATION_PROPERTY_NAME],
                files: createFilesService({
                    stepName: this.currentAction.name,
                    flowId: executionContext.flowVersion.flowId,
                    type: 'local',
                }),
                server: {
                    token: globals.workerToken!,
                    apiUrl: globals.apiUrl!,
                    publicUrl: globals.serverUrl!,
                },
                propsValue: processedInput,
                tags: createTagsManager(executionState),
                connections: createConnectionManager(executionState),
                serverUrl: globals.serverUrl!,
                run: {
                    id: globals.flowRunId,
                    stop: this.generateStopHook({ stepOutput, objectResponse: stopResponse }),
                    pause: this.generatePauseHook({ stepOutput, objectResponse: pauseResponse }),
                },
                resumePayload: globals.resumePayload,
            }

            stepOutput.output = await action.run(context)

            if (stepOutput.status === StepOutputStatus.RUNNING) {
                stepOutput.status = StepOutputStatus.SUCCEEDED
            }

            return {
                stepOutput,
                executionOutputStatus: this.convertExecutionStatusToStepStatus(stepOutput.status),
                pauseMetadata: pauseResponse.pauseMetadata,
                stopResponse: stopResponse.stopResponse,
            }
        }
        catch (e) {
            console.error(e)

            stepOutput.status = StepOutputStatus.FAILED
            stepOutput.errorMessage = await utils.tryParseJson((e as Error).message)

            return {
                stepOutput,
                executionOutputStatus: this.convertExecutionStatusToStepStatus(stepOutput.status),
                pauseMetadata: undefined,
                stopResponse: undefined,
            }
        }
    }
}
