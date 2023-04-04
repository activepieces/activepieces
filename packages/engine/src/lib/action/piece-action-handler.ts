import { VariableService } from '../services/variable-service';
import {
  Action,
  ExecutionState,
  PieceAction,
  StepOutput,
  StepOutputStatus
} from '@activepieces/shared';
import { BaseActionHandler } from './action-handler';
import { PieceExecutor } from '../executors/piece-executor';

export class PieceActionHandler extends BaseActionHandler<PieceAction> {
  variableService: VariableService;

  constructor(
    action: PieceAction,
    nextAction: BaseActionHandler<Action> | undefined
  ) {
    super(action, nextAction);
    this.variableService = new VariableService();
  }

  async execute(
    executionState: ExecutionState
  ): Promise<StepOutput> {
    const stepOutput = new StepOutput();

    const { input, pieceName, pieceVersion, actionName } = this.action.settings;

    const config = await this.variableService.resolve(
      input,
      executionState
    );

    stepOutput.input = config;

    if(!actionName){
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
