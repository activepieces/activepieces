import { VariableService } from '../services/variable-service';
import {
  Action,
  ActionType,
  ExecutionState,
  ExecutionType,
  PauseType,
  PieceAction,
  StepOutput,
  StepOutputStatus
} from '@activepieces/shared';
import { BaseActionHandler } from './action-handler';
import { globals } from '../globals';
import { isNil } from 'lodash';
import { pieceHelper } from '../helper/piece-helper';
import { createContextStore } from '../services/storage.service';
import { connectionManager } from '../services/connections.service';
import { PiecePropertyMap } from '@activepieces/pieces-framework';

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

type ResolveAndValidateInput = {
  actionProps: PiecePropertyMap
  input: unknown
  executionState: ExecutionState
  censorConnections: boolean
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

  private async resolveInput(params: ResolveAndValidateInput) {
    const { actionProps, input, executionState, censorConnections } = params

    const resolvedInput = await this.variableService.resolve({
      unresolvedInput: input,
      executionState,
      censorConnections,
    })

    const { result, errors } = this.variableService.validateAndCast(resolvedInput, actionProps);

    if (Object.keys(errors).length > 0) {
      throw new Error(JSON.stringify(errors));
    }

    return result
  }

  async execute(
    executionState: ExecutionState
  ): Promise<StepOutput> {
    const { input, pieceName, pieceVersion, actionName } = this.currentAction.settings;

    const stepOutput: StepOutput<ActionType.PIECE> = {
      type: ActionType.PIECE,
      status: StepOutputStatus.RUNNING,
      input: {},
    }

    try {
      if (isNil(actionName)) {
        throw new Error("Action name is not defined")
      }

      globals.addOneTask()

      const action = await this.loadAction({
        pieceName,
        pieceVersion,
        actionName,
      })

      stepOutput.input = await this.resolveInput({
        actionProps: action.props,
        input,
        executionState,
        censorConnections: true,
      })

      if (this.executionType === ExecutionType.BEGIN && pieceName === 'delay') {
        const { delay } = stepOutput.input as { delay: number }

        stepOutput.output = {
          delay,
          pauseType: PauseType.DELAY,
        }

        stepOutput.status = StepOutputStatus.PAUSED

        return stepOutput
      }

      const resolvedInput = await this.resolveInput({
        actionProps: action.props,
        input,
        executionState,
        censorConnections: false,
      })

      stepOutput.output = await action.run({
        store: createContextStore('', globals.flowId),
        propsValue: resolvedInput,
        connections: connectionManager
      })

      stepOutput.status = StepOutputStatus.SUCCEEDED
      return stepOutput
    }
    catch (e) {
      console.error(e)

      stepOutput.status = StepOutputStatus.FAILED
      stepOutput.errorMessage = (e as Error).message

      return stepOutput
    }
  }
}
