import { VariableService } from '../services/variable-service';
import {
  Action,
  ExecutionState,
  PauseType,
  PieceAction,
  StepOutput,
  StepOutputStatus
} from '@activepieces/shared';
import { BaseActionHandler } from './action-handler';
import { PieceExecutor } from '../executors/piece-executor';
import { globals } from '../globals';
import dayjs from 'dayjs';

type CtorParams = {
  currentAction: PieceAction
  nextAction?: Action
}

export class PieceActionHandler extends BaseActionHandler<PieceAction> {
  variableService: VariableService;

  constructor({ currentAction, nextAction }: CtorParams) {
    super({
      currentAction,
      nextAction
    })

    this.variableService = new VariableService();
  }

  async execute(
    executionState: ExecutionState
  ): Promise<StepOutput> {
    const stepOutput = new StepOutput();

    const { input, pieceName, pieceVersion, actionName } = this.currentAction.settings;

    if (pieceName === 'delay') {
      stepOutput.input = await this.variableService.resolve(
        input,
        executionState,
        true,
      )

      const { delay } = stepOutput.input as { delay: number }

      stepOutput.output = {
        delay,
        pauseType: PauseType.DELAY,
      }

      stepOutput.status = StepOutputStatus.PAUSED

      return stepOutput
    }

    const config = await this.variableService.resolve(
      input,
      executionState
    );

    globals.addOneTask();
    stepOutput.input = await this.variableService.resolve(
      input,
      executionState,
      true
    );

    if (!actionName){
      throw new Error("Action name is not defined");
    }

    try {
      const executer = new PieceExecutor();

      stepOutput.output = await executer.exec({
        pieceName,
        pieceVersion,
        actionName: actionName,
        config,
      });

      stepOutput.status = StepOutputStatus.SUCCEEDED;
      return stepOutput;
    } catch (e) {
      stepOutput.errorMessage = (e as Error).message;
      stepOutput.status = StepOutputStatus.FAILED;
      return stepOutput;
    }
  }
}
