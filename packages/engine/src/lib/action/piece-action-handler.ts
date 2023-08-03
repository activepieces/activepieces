import { VariableService } from '../services/variable-service';
import {
  AUTHENTICATION_PROPERTY_NAME,
  Action,
  ActionType,
  ExecutionState,
  ExecutionType,
  PieceAction,
  StepOutput,
  StepOutputStatus,
  assertNotNullOrUndefined
} from '@activepieces/shared';
import { BaseActionHandler, InitStepOutputParams } from './action-handler';
import { globals } from '../globals';
import { isNil } from '@activepieces/shared'
import { pieceHelper } from '../helper/action-helper';
import { createContextStore } from '../services/storage.service';
import { connectionManager } from '../services/connections.service';
import { Utils } from '../utils';
import { ActionContext, PauseHook, PauseHookParams, PiecePropertyMap, StaticPropsValue, StopHook, StopHookParams } from '@activepieces/pieces-framework';

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
}

type GeneratePauseHookParams = {
  stepOutput: StepOutput<ActionType.PIECE>
}

export class PieceActionHandler extends BaseActionHandler<PieceAction> {
  executionType: ExecutionType
  variableService: VariableService

  constructor({ executionType, currentAction, nextAction }: CtorParams) {
    super({
      currentAction,
      nextAction
    })

    this.executionType = executionType
    this.variableService = new VariableService()
  }

  private async loadAction(params: LoadActionParams) {
    const { pieceName, pieceVersion, actionName } = params

    const piece = await pieceHelper.loadPieceOrThrow(pieceName, pieceVersion)

    if (isNil(actionName)) {
      throw new Error("Action name is not defined");
    }

    const action = piece.getAction(actionName);

    if (isNil(action)) {
      throw new Error(`error=action_not_found action_name=${actionName}`);
    }

    return action
  }

  private generateStopHook({ stepOutput }: GenerateStopHookParams): StopHook {
    return ({ response }: StopHookParams) => {
      stepOutput.status = StepOutputStatus.STOPPED
      stepOutput.stopResponse = response
    }
  }

  private generatePauseHook({ stepOutput }: GeneratePauseHookParams): PauseHook {
    const actionName = this.currentAction.name

    return ({ pauseMetadata }: PauseHookParams) => {
      stepOutput.status = StepOutputStatus.PAUSED
      stepOutput.pauseMetadata = {
        ...pauseMetadata,
        resumeStepMetadata: {
          type: ActionType.PIECE,
          name: actionName,
        }
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
      censorConnections: true,
    })

    return {
      type: ActionType.PIECE,
      status: StepOutputStatus.RUNNING,
      input: censoredInput,
    }
  }

  async execute(
    executionState: ExecutionState,
    ancestors: [string, number][],
  ): Promise<StepOutput> {
    const { input, pieceName, pieceVersion, actionName } = this.currentAction.settings;

    const stepOutput = await this.loadStepOutput({
      executionState,
      ancestors,
    })

    try {
      if (isNil(actionName)) {
        throw new Error("Action name is not defined")
      }

      const action = await this.loadAction({
        pieceName,
        pieceVersion,
        actionName,
      })
      const piece = await pieceHelper.loadPieceOrThrow(pieceName, pieceVersion);

      const resolvedProps = await this.variableService.resolve<StaticPropsValue<PiecePropertyMap>>({
        unresolvedInput: input,
        executionState,
        censorConnections: false,
      })

      assertNotNullOrUndefined(globals.flowRunId, 'globals.flowRunId')
      const {processedInput, errors} = await this.variableService.applyProcessorsAndValidators(resolvedProps, action.props, piece.auth);

      if (Object.keys(errors).length > 0) {
        throw new Error(JSON.stringify(errors));
      }

      const context: ActionContext = {
        executionType: this.executionType,
        store: createContextStore('', globals.flowVersionId),
        auth: processedInput[AUTHENTICATION_PROPERTY_NAME],
        propsValue: processedInput,
        connections: connectionManager,
        serverUrl: globals.serverUrl!,
        run: {
          id: globals.flowRunId,
          stop: this.generateStopHook({ stepOutput }),
          pause: this.generatePauseHook({ stepOutput }),
        },
        resumePayload: globals.resumePayload,
      }

      stepOutput.output = await action.run(context)

      if (stepOutput.status === StepOutputStatus.RUNNING) {
        stepOutput.status = StepOutputStatus.SUCCEEDED
      }

      return stepOutput
    }
    catch (e) {
      console.error(e)

      stepOutput.status = StepOutputStatus.FAILED
      stepOutput.errorMessage = Utils.tryParseJson((e as Error).message);

      return stepOutput
    }
  }
}
