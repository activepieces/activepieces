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
import { PieceExecutor } from '../executors/piece-executor';
import { globals } from '../globals';
import { isNil } from 'lodash';

type CtorParams = {
  executionType: ExecutionType
  currentAction: PieceAction
  nextAction?: Action
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

  async execute(
    executionState: ExecutionState
  ): Promise<StepOutput> {
    const censoredInput = await this.variableService.resolve({
      unresolvedInput: this.currentAction.settings.input,
      executionState,
      censorConnections: true,
    })

    const stepOutput: StepOutput<ActionType.PIECE> = {
      type: ActionType.PIECE,
      status: StepOutputStatus.RUNNING,
      input: censoredInput,
    }

    const { input, pieceName, pieceVersion, actionName } = this.currentAction.settings;

    if (this.executionType === ExecutionType.BEGIN && pieceName === 'delay') {
      const { delay } = stepOutput.input as { delay: number }

      stepOutput.output = {
        delay,
        pauseType: PauseType.DELAY,
      }

      stepOutput.status = StepOutputStatus.PAUSED

      return stepOutput
    }

    const config = await this.variableService.resolve({
      unresolvedInput: input,
      executionState,
      censorConnections: false,
    })

    globals.addOneTask()

    if (isNil(actionName)) {
      throw new Error("Action name is not defined")
    }

    try {
      const executer = new PieceExecutor();

      stepOutput.output = await executer.exec({
        pieceName,
        pieceVersion,
        actionName: actionName,
        config,
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
